// Supabase adapter: PostgREST + Storage + Auth over plain fetch (service role,
// server side only). Schema: supabase/migrations/0001_init.sql.
import { HttpError } from '../util.js';

export function supabaseDb(cfg) {
  const { url, serviceKey, bucket } = cfg.supabase;
  const H = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` };

  async function rest(path, { method = 'GET', body, prefer, query = '' } = {}) {
    const res = await fetch(`${url}/rest/v1/${path}${query}`, {
      method,
      headers: { ...H, 'Content-Type': 'application/json', ...(prefer ? { Prefer: prefer } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    if (!res.ok) {
      const t = await res.text();
      if (res.status === 409) return { conflict: true, text: t };
      throw new HttpError(502, 'db_error', `Database error (${res.status})`, { detail: t.slice(0, 200) });
    }
    if (res.status === 204) return null;
    const t = await res.text();
    return t ? JSON.parse(t) : null;
  }
  const one = (rows) => (Array.isArray(rows) ? rows[0] || null : rows);
  const enc = encodeURIComponent;

  return {
    kind: 'supabase',
    async ensureProfile(user) {
      await rest('profiles', { method: 'POST', body: { id: user.id, email: user.email }, prefer: 'resolution=ignore-duplicates,return=minimal', query: '?on_conflict=id' });
      return one(await rest('profiles', { query: `?id=eq.${user.id}&select=*` }));
    },
    async getProfile(id) { return one(await rest('profiles', { query: `?id=eq.${id}&select=*` })); },
    async updateProfile(id, patch) { return one(await rest('profiles', { method: 'PATCH', body: patch, prefer: 'return=representation', query: `?id=eq.${id}` })); },
    async findProfileBySubscription(provider, subId) {
      return one(await rest('profiles', { query: `?pay_provider=eq.${enc(provider)}&pay_subscription_id=eq.${enc(subId)}&select=*` }));
    },
    async deleteProfile(id) {
      await rest('profiles', { method: 'DELETE', query: `?id=eq.${id}` });
      const res = await fetch(`${url}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers: H });
      if (!res.ok && res.status !== 404) throw new HttpError(502, 'auth_delete_failed', 'Could not delete the auth user');
    },

    async getUsage(key, period) {
      const r = one(await rest('usage', { query: `?key=eq.${enc(key)}&period=eq.${enc(period)}&select=chars` }));
      return r ? r.chars : 0;
    },
    async addUsage(key, period, chars) {
      return await rest('rpc/add_usage', { method: 'POST', body: { p_key: key, p_period: period, p_chars: chars } });
    },

    async listVoices(userId) { return await rest('voices', { query: `?user_id=eq.${userId}&select=*&order=created_at.desc` }); },
    async getVoice(id) { return one(await rest('voices', { query: `?id=eq.${enc(id)}&select=*` })); },
    async createVoice(row) { return one(await rest('voices', { method: 'POST', body: row, prefer: 'return=representation' })); },
    async deleteVoice(id) { await rest('voices', { method: 'DELETE', query: `?id=eq.${enc(id)}` }); },

    async logConsent(row) { return one(await rest('voice_consents', { method: 'POST', body: row, prefer: 'return=representation' })); },
    async markConsentDeleted(voiceId) { await rest('voice_consents', { method: 'PATCH', body: { voice_deleted_at: new Date().toISOString() }, query: `?voice_id=eq.${enc(voiceId)}` }); },
    async linkConsentVoice(consentId, voiceId) { await rest('voice_consents', { method: 'PATCH', body: { voice_id: voiceId }, query: `?id=eq.${consentId}` }); },

    async createChallenge(userId, sentence) {
      return one(await rest('consent_challenges', { method: 'POST', body: { user_id: userId, sentence, expires_at: new Date(Date.now() + 15 * 60e3).toISOString() }, prefer: 'return=representation' }));
    },
    async takeChallenge(id, userId) {
      const rows = await rest('consent_challenges', {
        method: 'PATCH', body: { used: true }, prefer: 'return=representation',
        query: `?id=eq.${enc(id)}&user_id=eq.${userId}&used=eq.false&expires_at=gt.${enc(new Date().toISOString())}`
      });
      return one(rows);
    },

    async recordPaymentEvent(provider, eventId, row) {
      const r = await rest('payment_events', { method: 'POST', body: { provider, event_id: eventId, ...row }, prefer: 'return=minimal' });
      return !(r && r.conflict);
    },
    async saveCheckout(id, row) { await rest('checkouts', { method: 'POST', body: { id, ...row }, prefer: 'return=minimal' }); },
    async getCheckout(id) { return one(await rest('checkouts', { query: `?id=eq.${enc(id)}&select=*` })); },

    async createReport(row) { await rest('abuse_reports', { method: 'POST', body: row, prefer: 'return=minimal' }); },

    async rateHit(key, windowSec, max) {
      const r = await rest('rpc/rate_hit', { method: 'POST', body: { p_key: key, p_window: windowSec, p_max: max } });
      const row = one(r) || r;
      return { allowed: Boolean(row.allowed), retryAfter: row.retry_after || windowSec };
    },

    async updateVoice(id, patch) { return one(await rest('voices', { method: 'PATCH', body: patch, prefer: 'return=representation', query: `?id=eq.${enc(id)}` })); },
    async logGeneration(row) { await rest('generations', { method: 'POST', body: row, prefer: 'return=minimal' }); },
    async listReports(limit = 50) { return await rest('abuse_reports', { query: `?select=*&order=created_at.desc&limit=${limit}` }); },
    async updateReport(id, patch) { await rest('abuse_reports', { method: 'PATCH', body: patch, query: `?id=eq.${enc(id)}` }); },
    async adminSummary(month) {
      return await rest('rpc/admin_summary', { method: 'POST', body: { p_month: month } });
    },
    async findProfileByEmail(email) { return one(await rest('profiles', { query: `?email=eq.${enc(email.toLowerCase())}&select=*` })); },
    async listAllVoices(limit = 100) { return await rest('voices', { query: `?select=id,user_id,name,provider,status,created_at&order=created_at.desc&limit=${limit}` }); }
  };
}
