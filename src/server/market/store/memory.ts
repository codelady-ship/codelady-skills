import 'server-only';
import type { Grant, Payout, Profile, Purchase, Sale, SkillRow, Subscription, Trial } from '@/lib/market/types';
import { newId } from '../crypto';
import type { Entitlements, MarketStore } from './types';

// In-memory database for MOCK mode (local testing without Supabase).
// Lives on globalThis so it survives hot reloads; resets when the dev server restarts.
// Starts with a demo creator and three demo skills so the whole flow can be tried at once.

type Db = {
  profiles: Profile[]; skills: SkillRow[]; sources: Map<string, string>;
  purchases: Purchase[]; subscriptions: Subscription[]; trials: Trial[]; grants: Grant[];
  sales: Sale[]; payouts: Payout[]; events: Set<string>;
};

const now = () => new Date().toISOString();
export const DEMO_CREATOR = { id: '00000000-0000-4000-8000-00000000c0de', email: 'creator@mock.test' };

function seed(): Db {
  const db: Db = {
    profiles: [{ id: DEMO_CREATOR.id, email: DEMO_CREATOR.email, display_name: 'Demo Creator', created_at: now() }],
    skills: [], sources: new Map(), purchases: [], subscriptions: [], trials: [], grants: [], sales: [], payouts: [], events: new Set(),
  };
  const base = { builtin_slug: null, creator_id: DEMO_CREATOR.id, creator_name: 'Demo Creator', status: 'approved' as const, source_url: null, created_at: now(), updated_at: now() };
  const demo: [Omit<SkillRow, keyof typeof base | 'id'>, string][] = [
    [{ name: 'Cover letter polisher', tagline: 'Makes a cover letter shorter and clearer.', description: 'Paste your cover letter; get a tighter version and three notes on what changed.', input_label: 'Your cover letter', pricing: 'free', price_cents: 0, trial_days: 0 },
      'You edit cover letters. Make the letter shorter and clearer, keep facts, then list three changes.'],
    [{ name: 'Interview coach', tagline: 'Ten likely questions and strong answers for your job.', description: 'Describe the job and your background. You get ten likely interview questions, model answers and what to avoid.', input_label: 'The job and your background', pricing: 'one_time', price_cents: 500, trial_days: 7 },
      'You are an interview coach. Give ten likely questions with model answers based on the job and background given.'],
    [{ name: 'Weekly content planner', tagline: 'A week of posts for your small business.', description: 'Tell it about your business. Every week you get seven post ideas with captions.', input_label: 'Your business in two sentences', pricing: 'monthly', price_cents: 300, trial_days: 3 },
      'You plan social media content. Give seven post ideas with captions for the business described.'],
  ];
  demo.forEach(([s, src], i) => {
    const id = `00000000-0000-4000-8000-00000000d0${i}${i}`;
    db.skills.push({ ...base, ...s, id });
    db.sources.set(id, src);
  });
  return db;
}

const g = globalThis as unknown as { __marketMemDb?: Db };
const db = () => (g.__marketMemDb ||= seed());

const empty = (): Entitlements => ({ purchases: [], subscriptions: [], trials: [], grants: [] });
const byNewest = <T extends { created_at: string }>(a: T, b: T) => b.created_at.localeCompare(a.created_at);

export function memoryStore(): MarketStore {
  return {
    kind: 'memory',

    async ensureProfile(u) {
      const d = db();
      let p = d.profiles.find((x) => x.id === u.id);
      if (!p) d.profiles.push((p = { id: u.id, email: u.email.toLowerCase(), display_name: null, created_at: now() }));
      return p;
    },
    async getProfile(id) { return db().profiles.find((p) => p.id === id) || null; },
    async findProfileByEmail(email) { return db().profiles.find((p) => p.email === email.trim().toLowerCase()) || null; },
    async listProfiles(limit = 500) { return [...db().profiles].sort(byNewest).slice(0, limit); },

    async listSkills(f = {}) {
      return db().skills
        .filter((s) => (!f.status || s.status === f.status) && (!f.creatorId || s.creator_id === f.creatorId) && (f.includeBuiltin || !s.builtin_slug))
        .sort(byNewest);
    },
    async getSkill(id) { return db().skills.find((s) => s.id === id) || null; },
    async getBuiltinSkill(slug) { return db().skills.find((s) => s.builtin_slug === slug) || null; },
    async createSkill(row, instructions) {
      const s: SkillRow = { ...row, id: newId(), created_at: now(), updated_at: now() };
      db().skills.push(s);
      if (instructions) db().sources.set(s.id, instructions);
      return s;
    },
    async updateSkill(id, patch) {
      const s = db().skills.find((x) => x.id === id);
      if (!s) return null;
      Object.assign(s, patch, { updated_at: now() });
      return s;
    },
    async getInstructions(id) { return db().sources.get(id) ?? null; },

    async entitlements(userId, skillId) {
      const d = db();
      const mine = <T extends { user_id: string; skill_id: string | null }>(rows: T[], all = false) =>
        rows.filter((r) => r.user_id === userId && (r.skill_id === skillId || (all && r.skill_id === null)));
      return { purchases: mine(d.purchases), subscriptions: mine(d.subscriptions), trials: mine(d.trials), grants: mine(d.grants, true) };
    },
    async userEntitlements(userId) {
      const d = db();
      const mine = <T extends { user_id: string }>(rows: T[]) => rows.filter((r) => r.user_id === userId);
      return { purchases: mine(d.purchases), subscriptions: mine(d.subscriptions), trials: mine(d.trials), grants: mine(d.grants) };
    },
    async listAll() {
      const d = db();
      return d ? { purchases: [...d.purchases], subscriptions: [...d.subscriptions], trials: [...d.trials], grants: [...d.grants] } : empty();
    },

    async createTrial(row) {
      const d = db();
      if (d.trials.some((t) => t.user_id === row.user_id && t.skill_id === row.skill_id)) return null;
      const t = { ...row, id: newId() };
      d.trials.push(t);
      return t;
    },
    async upsertPurchase(row) {
      const d = db();
      const old = d.purchases.find((p) => p.provider === row.provider && p.order_id === row.order_id);
      if (old) return Object.assign(old, row);
      const p = { ...row, id: newId(), created_at: now() };
      d.purchases.push(p);
      return p;
    },
    async setPurchaseStatus(provider, orderId, status) {
      const p = db().purchases.find((x) => x.provider === provider && x.order_id === orderId);
      if (p) p.status = status;
      return p || null;
    },
    async upsertSubscription(row) {
      const d = db();
      const old = d.subscriptions.find((s) => s.provider === row.provider && s.provider_sub_id === row.provider_sub_id);
      if (old) return Object.assign(old, row, { updated_at: now() }); // price_ok is kept
      const s = { ...row, price_ok: false, id: newId(), created_at: now(), updated_at: now() };
      d.subscriptions.push(s);
      return s;
    },
    async markSubscriptionPaid(row) {
      const d = db();
      const old = d.subscriptions.find((s) => s.provider === row.provider && s.provider_sub_id === row.provider_sub_id);
      if (old) Object.assign(old, { price_ok: true, updated_at: now() });
      else d.subscriptions.push({ ...row, status: 'incomplete', current_period_end: null, price_ok: true, id: newId(), created_at: now(), updated_at: now() });
    },
    async findSubscription(provider, subId) {
      return db().subscriptions.find((s) => s.provider === provider && s.provider_sub_id === subId) || null;
    },

    async addGrant(row) {
      const gr: Grant = { ...row, id: newId(), created_at: now(), revoked_at: null };
      db().grants.push(gr);
      return gr;
    },
    async revokeGrant(id) {
      const gr = db().grants.find((x) => x.id === id);
      if (gr && !gr.revoked_at) gr.revoked_at = now();
      return gr || null;
    },

    async addSale(row) {
      const d = db();
      if (d.sales.some((s) => s.provider === row.provider && s.provider_ref === row.provider_ref)) return false;
      d.sales.push({ ...row, id: newId(), created_at: now(), refunded: false });
      return true;
    },
    async markSaleRefunded(provider, ref) {
      for (const s of db().sales) if (s.provider === provider && s.provider_ref === ref) s.refunded = true;
    },
    async listSales(f = {}) {
      return db().sales.filter((s) => !f.creatorId || s.creator_id === f.creatorId).sort(byNewest).slice(0, f.limit || 1000);
    },

    async addPayout(row) {
      const p = { ...row, id: newId(), created_at: now() };
      db().payouts.push(p);
      return p;
    },
    async listPayouts(f = {}) { return db().payouts.filter((p) => !f.creatorId || p.creator_id === f.creatorId).sort(byNewest); },

    async recordEvent(provider, id) {
      const key = `${provider}:${id}`;
      if (db().events.has(key)) return false;
      db().events.add(key);
      return true;
    },
    async forgetEvent(provider, id) { db().events.delete(`${provider}:${id}`); },
  };
}
