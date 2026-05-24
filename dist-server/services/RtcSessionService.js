import crypto from 'crypto';
class RtcSessionService {
    ttlMs = Number(process.env.RTC_SESSION_TTL_MS || 2 * 60 * 1000);
    createSession() {
        const enabled = process.env.VOICE_RTC_ENABLED === 'true';
        const iceServers = this.getIceServers();
        const sessionId = crypto.randomUUID();
        const expiresAt = new Date(Date.now() + this.ttlMs).toISOString();
        return {
            sessionId,
            enabled,
            provider: process.env.RTC_PROVIDER || 'translink-webrtc-foundation',
            transport: 'webrtc',
            expiresAt,
            iceServers,
            controlChannel: {
                type: 'websocket',
                path: '/ws/live',
            },
            media: {
                audio: true,
                video: false,
                preferredCodec: 'opus',
            },
            status: enabled ? 'ready' : 'disabled',
            reason: enabled
                ? undefined
                : 'VOICE_RTC_ENABLED is not true. WebSocket voice remains the active production transport while WebRTC infrastructure is prepared.',
        };
    }
    getStats() {
        const iceServers = this.getIceServers();
        return {
            enabled: process.env.VOICE_RTC_ENABLED === 'true',
            provider: process.env.RTC_PROVIDER || 'translink-webrtc-foundation',
            ttlMs: this.ttlMs,
            iceServerCount: iceServers.length,
            hasTurn: iceServers.some((server) => {
                const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
                return urls.some((url) => url.startsWith('turn:') || url.startsWith('turns:'));
            }),
        };
    }
    getIceServers() {
        const urls = (process.env.RTC_TURN_URLS || '')
            .split(',')
            .map((url) => url.trim())
            .filter(Boolean);
        if (urls.length === 0) {
            return [{ urls: 'stun:stun.l.google.com:19302' }];
        }
        const username = process.env.RTC_TURN_USERNAME;
        const credential = process.env.RTC_TURN_CREDENTIAL;
        return [
            {
                urls,
                ...(username ? { username } : {}),
                ...(credential ? { credential } : {}),
            },
        ];
    }
}
export const rtcSessionService = new RtcSessionService();
