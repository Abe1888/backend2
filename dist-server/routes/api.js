import { Router } from "express";
import fs from "fs";
import path from "path";
import { dashboardService } from "../brain/DashboardService.js";
import { ragService } from "../brain/knowledge/RagService.js";
import { memoryService } from "../brain/memory/MemoryService.js";
import { agentOrchestrator } from "../services/AgentOrchestrator.js";
import { voiceTelemetryService } from "../services/VoiceTelemetryService.js";
import { rateLimitService } from "../services/RateLimitService.js";
import { voiceReadinessService } from "../services/VoiceReadinessService.js";
import { rtcSessionService } from "../services/RtcSessionService.js";
const router = Router();
const isProduction = process.env.NODE_ENV === 'production';
const TELEMETRY_RATE_LIMIT = Number(process.env.TELEMETRY_RATE_LIMIT || 60);
const TELEMETRY_RATE_WINDOW_MS = Number(process.env.TELEMETRY_RATE_WINDOW_MS || 60 * 1000);
const RTC_SESSION_RATE_LIMIT = Number(process.env.RTC_SESSION_RATE_LIMIT || 20);
const RTC_SESSION_RATE_WINDOW_MS = Number(process.env.RTC_SESSION_RATE_WINDOW_MS || 60 * 1000);
const telemetryToken = process.env.VOICE_TELEMETRY_TOKEN || process.env.ADMIN_API_TOKEN || '';
const getRequestIp = (req) => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.trim()) {
        return forwarded.split(',')[0].trim();
    }
    if (Array.isArray(forwarded) && forwarded[0]) {
        return forwarded[0].split(',')[0].trim();
    }
    return req.ip || req.socket.remoteAddress || 'unknown';
};
const requireTelemetryAccess = (req, res, next) => {
    const ip = getRequestIp(req);
    const rateResult = rateLimitService.check(`voice-telemetry:${ip}`, TELEMETRY_RATE_LIMIT, TELEMETRY_RATE_WINDOW_MS);
    if (!rateResult.allowed) {
        res.setHeader('Retry-After', Math.ceil((rateResult.retryAfterMs || 1000) / 1000));
        res.status(429).json({ error: 'Too many telemetry requests' });
        return;
    }
    if (!isProduction) {
        next();
        return;
    }
    if (!telemetryToken) {
        res.status(404).json({ error: 'Not found' });
        return;
    }
    const authHeader = req.headers.authorization || '';
    const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
    const headerToken = req.headers['x-admin-token'];
    if (bearerToken === telemetryToken || headerToken === telemetryToken) {
        next();
        return;
    }
    res.status(403).json({ error: 'Forbidden' });
};
router.get("/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
});
router.get("/brain/status", async (req, res) => {
    try {
        const status = await dashboardService.getBrainStatus();
        res.json(status);
    }
    catch (error) {
        res.status(500).json({ error: "Failed to fetch brain status" });
    }
});
router.post("/rtc/session", (req, res) => {
    const ip = getRequestIp(req);
    const rateResult = rateLimitService.check(`rtc-session:${ip}`, RTC_SESSION_RATE_LIMIT, RTC_SESSION_RATE_WINDOW_MS);
    if (!rateResult.allowed) {
        res.setHeader('Retry-After', Math.ceil((rateResult.retryAfterMs || 1000) / 1000));
        res.status(429).json({ error: 'Too many RTC session requests' });
        return;
    }
    res.json(rtcSessionService.createSession());
});
router.get("/voice/telemetry", requireTelemetryAccess, (req, res) => {
    const includeSnapshot = req.query.detail === '1' || req.query.detail === 'true';
    res.json({
        status: "ok",
        summary: voiceTelemetryService.getSummary(),
        ...(includeSnapshot ? { snapshot: voiceTelemetryService.getSnapshot() } : {}),
    });
});
router.get("/voice/readiness", requireTelemetryAccess, (req, res) => {
    const report = voiceReadinessService.getReport();
    const httpStatus = report.status === 'error' ? 503 : 200;
    res.status(httpStatus).json(report);
});
router.get("/voice/memory", requireTelemetryAccess, (req, res) => {
    res.json({
        status: "ok",
        memory: memoryService.getStats(),
        retrieval: ragService.getStats(),
        orchestrator: agentOrchestrator.getStats(),
        rtc: rtcSessionService.getStats(),
    });
});
router.post("/voice/memory/cleanup", requireTelemetryAccess, (req, res) => {
    const requestedTtlMs = Number(req.body?.maxAgeMs);
    const removed = memoryService.cleanupExpiredSessions(Number.isFinite(requestedTtlMs) && requestedTtlMs > 0 ? requestedTtlMs : undefined);
    res.json({
        status: "ok",
        removed,
        memory: memoryService.getStats(),
    });
});
// ─── Dynamic Config meta & endpoints ───────────────────────────
const getConfigMeta = (pathname) => {
    let filename = 'language_config.json';
    let requiredKey = 'languages';
    let subDir = '';
    if (pathname === '/config/mesh/behavior') {
        filename = 'mesh_behavior_config.json';
        requiredKey = 'meshes';
    }
    else if (pathname === '/config/mesh/material') {
        filename = 'mesh_material_config.json';
        requiredKey = 'materials';
    }
    else if (pathname === '/config/camera') {
        filename = 'camera_config.json';
        requiredKey = 'cameraKeyframesDesktop';
    }
    else if (pathname === '/config/voice') {
        filename = 'voice_config.json';
        subDir = 'live-voice';
        requiredKey = 'voiceMetadata';
    }
    else if (pathname === '/config/knowledge') {
        filename = 'knowledge_config.json';
        subDir = 'live-voice';
        requiredKey = 'sync_engine';
    }
    else if (pathname === '/config/knowledge-md') {
        filename = 'knowledge.md';
        subDir = 'live-voice';
        requiredKey = null;
    }
    else if (pathname === '/config/language') {
        filename = 'language_config.json';
        requiredKey = 'languages';
    }
    else {
        return null;
    }
    const configPath = subDir
        ? path.resolve(process.cwd(), 'src', 'translinkconfig', subDir, filename)
        : path.resolve(process.cwd(), 'src', 'translinkconfig', filename);
    const backupPath = subDir
        ? path.resolve(process.cwd(), 'src', 'translinkconfig', subDir, filename.replace('.json', '.backup.json').replace('.md', '.backup.md'))
        : path.resolve(process.cwd(), 'src', 'translinkconfig', filename.replace('.json', '.backup.json'));
    return { configPath, backupPath, requiredKey, filename };
};
router.get('/config/:type(*)', (req, res) => {
    const meta = getConfigMeta('/config/' + req.params['type(*)']);
    if (!meta) {
        res.status(404).json({ error: 'Config type not found' });
        return;
    }
    const { configPath, requiredKey, filename } = meta;
    try {
        if (!fs.existsSync(configPath)) {
            res.status(404).json({ error: `Config file not found: ${filename}` });
            return;
        }
        const raw = fs.readFileSync(configPath, 'utf8');
        if (requiredKey !== null) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.parse(raw));
        }
        else {
            res.setHeader('Content-Type', 'text/plain; charset=utf-8');
            res.send(raw);
        }
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
router.post('/config/:type(*)', (req, res) => {
    const meta = getConfigMeta('/config/' + req.params['type(*)']);
    if (!meta) {
        res.status(404).json({ error: 'Config type not found' });
        return;
    }
    const { configPath, backupPath, requiredKey, filename } = meta;
    try {
        if (requiredKey !== null) {
            const payload = req.body;
            if (!payload || typeof payload !== 'object' || !payload[requiredKey]) {
                res.status(400).json({ error: `Invalid config payload: missing key '${requiredKey}'` });
                return;
            }
            // Backup
            if (fs.existsSync(configPath)) {
                fs.copyFileSync(configPath, backupPath);
            }
            // Save
            fs.writeFileSync(configPath, JSON.stringify(payload, null, 2), 'utf8');
        }
        else {
            // For plain text / markdown files
            let bodyText = req.body;
            if (typeof req.body !== 'string') {
                bodyText = typeof req.body === 'object' ? req.body.text || JSON.stringify(req.body) : String(req.body);
            }
            // Backup
            if (fs.existsSync(configPath)) {
                fs.copyFileSync(configPath, backupPath);
            }
            // Save
            fs.writeFileSync(configPath, bodyText, 'utf8');
        }
        res.json({ status: 'ok', message: `${filename} saved successfully` });
    }
    catch (e) {
        res.status(400).json({ error: `Failed to parse or write config: ${e.message}` });
    }
});
export default router;
