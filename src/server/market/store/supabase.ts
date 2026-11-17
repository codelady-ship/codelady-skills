import 'server-only';
import type { Grant, Payout, Profile, Purchase, Sale, SkillRow, Subscription, Trial } from '@/lib/market/types';
import type { MarketStore } from './types';

// Supabase adapter: PostgREST over plain fetch with the service-role key (server only),
// same approach as src/server/voice/db/supabase.js. Schema: supabase/migrations/0002_marketplace.sql.

export class DbError extends Error {}

export function supabaseStore(cfg: { url: string; serviceKey: string }): MarketStore {
  const H = { apikey: cfg.serviceKey, Authorization: `Bearer ${cfg.serviceKey}` };
  const enc = encodeURIComponent;

  async function rest<T>(path: string, opts: { method?: string; body?: unknown; prefer?: string; query?: string } = {}): Promise<T | null | { conflict: true }> {
    const res = await fetch(`${cfg.url}/rest/v1/${path}${opts.query || ''}`, {
      method: opts.method || 'GET',
      headers: { ...H, 'Content-Type': 'application/json', ...(opts.prefer ? { Prefer: opts.prefer } : {}) },
      body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
      cache: 'no-store',
    });
    if (res.status === 409) return { conflict: true };
    if (!res.ok) throw new DbError(`Database error ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const t = res.status === 204 ? '' : await res.text();
    return t ? (JSON.parse(t) as T) : null;
  }
  const rows = async <T>(path: string, query: string) => ((await rest<T[]>(path, { query })) as T[] | null) || [];
  const first = <T>(r: unknown): T | null => (Array.isArray(r) ? (r[0] as T) ?? null : null);
  const insert = async <T>(table: string, body: unknown, extra = '') =>
    rest<T[]>(table, { method: 'POST', body, prefer: `return=representation${extra}` });
  const patch = async <T>(table: string, query: string, body: unknown) =>
    first<T>(await rest<T[]>(table, { method: 'PATCH', body, prefer: 'return=representation', query }));

  return {
    kind: 'supabase',

    async ensureProfile(u) {
      await rest('profiles', { method: 'POST', body: { id: u.id, email: u.email.toLowerCase() }, prefer: 'resolution=ignore-duplicates,return=minimal', query: '?on_conflict=id' });
      return first<Profile>(await rest('profiles', { query: `?id=eq.${enc(u.id)}&select=id,email,display_name,created_at` }))!;
    },
    async getProfile(id) { return first<Profile>(await rest('profiles', { query: `?id=eq.${enc(id)}&select=id,email,display_name,created_at` })); },
    async findProfileByEmail(email) {
      return first<Profile>(await rest('profiles', { query: `?email=eq.${enc(email.trim().toLowerCase())}&select=id,email,display_name,created_at` }));
    },
    async listProfiles(limit = 500) { return rows<Profile>('profiles', `?select=id,email,display_name,created_at&order=created_at.desc&limit=${limit}`); },

    async listSkills(f = {}) {
      const q = ['select=*', 'order=created_at.desc'];
      if (f.status) q.push(`status=eq.${f.status}`);
      if (f.creatorId) q.push(`creator_id=eq.${enc(f.creatorId)}`);
      if (!f.includeBuiltin) q.push('builtin_slug=is.null');
      return rows<SkillRow>('skills', `?${q.join('&')}`);
    },
    async getSkill(id) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
      return first<SkillRow>(await rest('skills', { query: `?id=eq.${id}&select=*` }));
    },
    async getBuiltinSkill(slug) { return first<SkillRow>(await rest('skills', { query: `?builtin_slug=eq.${enc(slug)}&select=*` })); },
    async createSkill(row, instructions) {
      const s = first<SkillRow>(await insert('skills', row));
      if (!s) throw new DbError('skill not created');
      if (instructions) await rest('skill_sources', { method: 'POST', body: { skill_id: s.id, instructions }, prefer: 'return=minimal' });
      return s;
    },
    async updateSkill(id, p) { return patch<SkillRow>('skills', `?id=eq.${enc(id)}`, p); },
    async getInstructions(id) {
      return first<{ instructions: string }>(await rest('skill_sources', { query: `?skill_id=eq.${enc(id)}&select=instructions` }))?.instructions ?? null;
    },

    async entitlements(userId, skillId) {
      const u = enc(userId), s = enc(skillId);
      const [purchases, subscriptions, trials, grants] = await Promise.all([
        rows<Purchase>('purchases', `?user_id=eq.${u}&skill_id=eq.${s}&select=*`),
        rows<Subscription>('subscriptions', `?user_id=eq.${u}&skill_id=eq.${s}&select=*`),
        rows<Trial>('trials', `?user_id=eq.${u}&skill_id=eq.${s}&select=*`),
        rows<Grant>('access_grants', `?user_id=eq.${u}&or=(skill_id.eq.${s},skill_id.is.null)&revoked_at=is.null&select=*`),
      ]);
      return { purchases, subscriptions, trials, grants };
    },
    async userEntitlements(userId) {
      const u = enc(userId);
      const [purchases, subscriptions, trials, grants] = await Promise.all([
        rows<Purchase>('purchases', `?user_id=eq.${u}&select=*&order=created_at.desc`),
        rows<Subscription>('subscriptions', `?user_id=eq.${u}&select=*&order=created_at.desc`),
        rows<Trial>('trials', `?user_id=eq.${u}&select=*&order=started_at.desc`),
        rows<Grant>('access_grants', `?user_id=eq.${u}&select=*&order=created_at.desc`),
      ]);
      return { purchases, subscriptions, trials, grants };
    },
    async listAll() {
      const [purchases, subscriptions, trials, grants] = await Promise.all([
        rows<Purchase>('purchases', '?select=*&order=created_at.desc&limit=2000'),
        rows<Subscription>('subscriptions', '?select=*&order=created_at.desc&limit=2000'),
        rows<Trial>('trials', '?select=*&order=started_at.desc&limit=2000'),
        rows<Grant>('access_grants', '?select=*&order=created_at.desc&limit=2000'),
      ]);
      return { purchases, subscriptions, trials, grants };
    },

    async createTrial(row) {
      const r = await insert<Trial>('trials', row);
      return r && 'conflict' in r ? null : first<Trial>(r);
    },
    async upsertPurchase(row) {
      return first<Purchase>(await insert('purchases?on_conflict=provider,order_id', row, ',resolution=merge-duplicates'))!;
    },
    async setPurchaseStatus(provider, orderId, status) {
      return patch<Purchase>('purchases', `?provider=eq.${enc(provider)}&order_id=eq.${enc(orderId)}`, { status });
    },
    async upsertSubscription(row) {
      // merge-duplicates updates only the columns in the body, so price_ok is never overwritten here.
      return first<Subscription>(await insert('subscriptions?on_conflict=provider,provider_sub_id', row, ',resolution=merge-duplicates'))!;
    },
    async markSubscriptionPaid(row) {
      // Insert-only (ignored when the row exists), then set price_ok on whichever row is there.
      await rest('subscriptions', {
        method: 'POST', query: '?on_conflict=provider,provider_sub_id', prefer: 'resolution=ignore-duplicates,return=minimal',
        body: { ...row, status: 'incomplete', current_period_end: null, price_ok: true },
      });
      await rest('subscriptions', {
        method: 'PATCH', prefer: 'return=minimal', body: { price_ok: true },
        query: `?provider=eq.${enc(row.provider)}&provider_sub_id=eq.${enc(row.provider_sub_id)}`,
      });
    },
    async findSubscription(provider, subId) {
      return first<Subscription>(await rest('subscriptions', { query: `?provider=eq.${enc(provider)}&provider_sub_id=eq.${enc(subId)}&select=*` }));
    },

    async addGrant(row) { return first<Grant>(await insert('access_grants', row))!; },
    async revokeGrant(id) { return patch<Grant>('access_grants', `?id=eq.${enc(id)}&revoked_at=is.null`, { revoked_at: new Date().toISOString() }); },

    async addSale(row) {
      const r = await rest<null>('sales', { method: 'POST', body: row, prefer: 'return=minimal' });
      return !(r && 'conflict' in r);
    },
    async forgetEvent(provider, eventId) {
      await rest('market_events', { method: 'DELETE', prefer: 'return=minimal', query: `?provider=eq.${enc(provider)}&event_id=eq.${enc(eventId)}` });
    },
    async markSaleRefunded(provider, ref) {
      await rest('sales', { method: 'PATCH', body: { refunded: true }, query: `?provider=eq.${enc(provider)}&provider_ref=eq.${enc(ref)}` });
    },
    async listSales(f = {}) {
      return rows<Sale>('sales', `?select=*&order=created_at.desc&limit=${f.limit || 1000}${f.creatorId ? `&creator_id=eq.${enc(f.creatorId)}` : ''}`);
    },

    async addPayout(row) { return first<Payout>(await insert('payouts', row))!; },
    async listPayouts(f = {}) {
      return rows<Payout>('payouts', `?select=*&order=created_at.desc${f.creatorId ? `&creator_id=eq.${enc(f.creatorId)}` : ''}`);
    },

    async recordEvent(provider, eventId) {
      const r = await rest<null>('market_events', { method: 'POST', body: { provider, event_id: eventId }, prefer: 'return=minimal' });
      return !(r && 'conflict' in r);
    },
  };
}
