// In-memory store for LOCAL DEVELOPMENT ONLY (data is lost on restart and is
// per-instance on serverless hosts). Same interface as db/supabase.js.
import { randomId } from '../util.js';

const S = globalThis.__CL_MEM__ || (globalThis.__CL_MEM__ = {
  sessions: new Map(), profiles: new Map(), usage: new Map(), voices: new Map(), consents: [],
  challenges: new Map(), payEvents: new Map(), reports: [], rate: new Map(), files: new Map(), checkouts: new Map()
});

export function memoryDb() {
  return {
    kind: 'memory',
    // mock auth sessions
    async createSession(email) {
      const lower = email.toLowerCase();
      let id = [...S.profiles.values()].find((p) => p.email === lower)?.id;
      if (!id) id = crypto.randomUUID();
      const token = 'mock_' + randomId(24);
      S.sessions.set(token, { id, email: lower });
      return { token, user: { id, email: lower } };
    },
    async sessionUser(token) { return S.sessions.get(token) || null; },
    async deleteSessions(userId) { for (const [t, u] of S.sessions) if (u.id === userId) S.sessions.delete(t); },

    async ensureProfile(user) {
      if (!S.profiles.has(user.id)) S.profiles.set(user.id, { id: user.id, email: user.email, plan: 'free', plan_status: 'none', plan_renews_at: null, pay_provider: null, pay_subscription_id: null, created_at: new Date().toISOString() });
      return S.profiles.get(user.id);
    },
    async getProfile(id) { return S.profiles.get(id) || null; },
    async updateProfile(id, patch) { const p = S.profiles.get(id); if (p) Object.assign(p, patch); return p; },
    async findProfileBySubscription(provider, subId) {
      return [...S.profiles.values()].find((p) => p.pay_provider === provider && p.pay_subscription_id === subId) || null;
    },
    async deleteProfile(id) { S.profiles.delete(id); },

    async getUsage(key, period) { return S.usage.get(key + '|' + period) || 0; },
    async addUsage(key, period, chars) { const k = key + '|' + period; const v = (S.usage.get(k) || 0) + chars; S.usage.set(k, v); return v; },

    async listVoices(userId) { return [...S.voices.values()].filter((v) => v.user_id === userId); },
    async getVoice(id) { return S.voices.get(id) || null; },
    async createVoice(row) { const v = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }; S.voices.set(v.id, v); return v; },
    async deleteVoice(id) { S.voices.delete(id); },

    async logConsent(row) { const c = { id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }; S.consents.push(c); return c; },
    async markConsentDeleted(voiceId) { S.consents.filter((c) => c.voice_id === voiceId).forEach((c) => { c.voice_deleted_at = new Date().toISOString(); }); },
    async linkConsentVoice(consentId, voiceId) { const c = S.consents.find((x) => x.id === consentId); if (c) c.voice_id = voiceId; },

    async createChallenge(userId, sentence) { const id = crypto.randomUUID(); S.challenges.set(id, { id, user_id: userId, sentence, expires_at: Date.now() + 15 * 60e3, used: false }); return S.challenges.get(id); },
    async takeChallenge(id, userId) {
      const c = S.challenges.get(id);
      if (!c || c.user_id !== userId || c.used || c.expires_at < Date.now()) return null;
      c.used = true; return c;
    },

    async recordPaymentEvent(provider, eventId, row) {
      const k = provider + ':' + eventId;
      if (S.payEvents.has(k)) return false;
      S.payEvents.set(k, { ...row, created_at: new Date().toISOString() }); return true;
    },
    async saveCheckout(id, row) { S.checkouts.set(id, row); },
    async getCheckout(id) { return S.checkouts.get(id) || null; },

    async createReport(row) { S.reports.push({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }); },

    async rateHit(key, windowSec, max) {
      const now = Date.now();
      const r = S.rate.get(key);
      if (!r || r.reset < now) { S.rate.set(key, { count: 1, reset: now + windowSec * 1000 }); return { allowed: true, retryAfter: 0 }; }
      r.count++;
      return { allowed: r.count <= max, retryAfter: Math.ceil((r.reset - now) / 1000) };
    },

    async updateVoice(id, patch) { const v = S.voices.get(id); if (v) Object.assign(v, patch); return v; },
    async logGeneration(row) { (S.generations || (S.generations = [])).push({ id: crypto.randomUUID(), created_at: new Date().toISOString(), ...row }); },
    async listReports(limit = 50) { return S.reports.slice(-limit).reverse(); },
    async updateReport(id, patch) { const r = S.reports.find((x) => x.id === id); if (r) Object.assign(r, patch); },
    async adminSummary(month) {
      const gens = (S.generations || []).filter((g) => g.created_at.startsWith(month));
      const by = {};
      gens.forEach((g) => { by[g.tier] = (by[g.tier] || 0) + g.chars; });
      return {
        users: S.profiles.size, pro: [...S.profiles.values()].filter((p) => p.plan === 'pro').length,
        voices: S.voices.size, openReports: S.reports.filter((r) => r.status === 'open').length,
        charsByTier: by, recentPayments: [...S.payEvents.values()].slice(-10).reverse()
      };
    },
    async findProfileByEmail(email) { return [...S.profiles.values()].find((p) => p.email === email.toLowerCase()) || null; },
    async listAllVoices(limit = 100) { return [...S.voices.values()].slice(-limit).reverse(); },
    _state: S
  };
}
