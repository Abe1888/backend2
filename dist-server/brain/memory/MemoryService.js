/**
 * MemoryService handles short-term session context and long-term
 * user persistence for the Translink Voice Agent.
 */
import path from 'path';
import { promises as fsp } from 'fs';
export class MemoryService {
    sessionMemories = new Map();
    sessionUpdatedAt = new Map();
    userContexts = new Map();
    maxSessionMemories = Number(process.env.MEMORY_MAX_SESSIONS || 500);
    maxMessagesPerSession = Number(process.env.MEMORY_MAX_MESSAGES_PER_SESSION || 20);
    async addMemory(sessionId, text) {
        const memories = this.sessionMemories.get(sessionId) || [];
        memories.push(text);
        this.sessionMemories.set(sessionId, memories.slice(-this.maxMessagesPerSession));
        this.sessionUpdatedAt.set(sessionId, Date.now());
        this.enforceSessionLimit();
        console.log(`[Memory] Updated short-term memory for session ${sessionId}`);
        try {
            const logsDir = path.resolve(process.cwd(), 'src/translinkconfig/logs');
            await fsp.mkdir(logsDir, { recursive: true });
            const dateStamp = new Date().toISOString().split('T')[0];
            const logFile = path.join(logsDir, `ai_session_log_${dateStamp}.jsonl`);
            const logEntry = JSON.stringify({
                timestamp: new Date().toISOString(),
                session_id: sessionId,
                text: text
            }) + '\n';
            await fsp.appendFile(logFile, logEntry);
        }
        catch (err) {
            console.error('[MemoryService] Failed to write session log:', err);
        }
    }
    async getContext(sessionId) {
        const memories = this.sessionMemories.get(sessionId) || [];
        return memories.join("\n");
    }
    async updateUserProfile(userId, update) {
        const current = this.userContexts.get(userId) || {};
        this.userContexts.set(userId, { ...current, ...update });
        console.log(`[Memory] Updated long-term profile for user ${userId}`);
    }
    clearSession(sessionId) {
        const hadMemory = this.sessionMemories.delete(sessionId);
        this.sessionUpdatedAt.delete(sessionId);
        return hadMemory;
    }
    cleanupExpiredSessions(maxAgeMs = Number(process.env.MEMORY_SESSION_TTL_MS || 60 * 60 * 1000)) {
        const cutoff = Date.now() - maxAgeMs;
        let removed = 0;
        for (const [sessionId, updatedAt] of this.sessionUpdatedAt.entries()) {
            if (updatedAt < cutoff) {
                this.clearSession(sessionId);
                removed++;
            }
        }
        return removed;
    }
    getStats() {
        const sessions = Array.from(this.sessionMemories.entries());
        const totalMessages = sessions.reduce((sum, [, memories]) => sum + memories.length, 0);
        const oldestUpdatedAt = Math.min(...Array.from(this.sessionUpdatedAt.values()));
        const newestUpdatedAt = Math.max(...Array.from(this.sessionUpdatedAt.values()));
        return {
            activeSessions: this.sessionMemories.size,
            userProfiles: this.userContexts.size,
            totalMessages,
            maxSessionMemories: this.maxSessionMemories,
            maxMessagesPerSession: this.maxMessagesPerSession,
            oldestUpdatedAt: Number.isFinite(oldestUpdatedAt) ? oldestUpdatedAt : null,
            newestUpdatedAt: Number.isFinite(newestUpdatedAt) ? newestUpdatedAt : null,
        };
    }
    enforceSessionLimit() {
        if (this.sessionMemories.size <= this.maxSessionMemories)
            return;
        const sessionsByAge = Array.from(this.sessionUpdatedAt.entries())
            .sort(([, a], [, b]) => a - b);
        while (this.sessionMemories.size > this.maxSessionMemories && sessionsByAge.length > 0) {
            const [sessionId] = sessionsByAge.shift();
            this.clearSession(sessionId);
        }
    }
}
export const memoryService = new MemoryService();
