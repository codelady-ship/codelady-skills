import 'server-only';
import { canRun, type AccessDecision } from '@/lib/market/access';
import type { SkillRow } from '@/lib/market/types';
import type { SessionUser } from './session';
import { getUser } from './session';
import { getStore, type MarketStore } from './store';

/** Loads what the user owns for this skill and decides (src/lib/market/access.ts). */
export async function accessFor(store: MarketStore, user: SessionUser | null, skill: SkillRow): Promise<AccessDecision> {
  const ent = user && skill.pricing !== 'free' && skill.status === 'approved' && skill.creator_id !== user.id && !user.isAdmin
    ? await store.entitlements(user.id, skill.id)
    : {};
  return canRun({ skill, user, now: Date.now(), ...ent });
}

/** A skill as the public may see it. Instructions are never in a SkillRow; the source link of paid skills is hidden too. */
export function publicSkill(s: SkillRow) {
  return { ...s, source_url: s.pricing === 'free' ? s.source_url : null };
}

// Built-in skills: the owner can put a price on them from the admin page (a skills row with builtin_slug).
// Looked up on every run, so cached briefly per server instance.
const builtinCache = new Map<string, { row: SkillRow | null; until: number }>();
export function forgetBuiltin(slug?: string) {
  if (slug) builtinCache.delete(slug); else builtinCache.clear();
}
export async function builtinRow(store: MarketStore, slug: string) {
  const hit = builtinCache.get(slug);
  if (hit && hit.until > Date.now()) return hit.row;
  const row = await store.getBuiltinSkill(slug);
  builtinCache.set(slug, { row, until: Date.now() + 30_000 });
  return row;
}

/**
 * Gate for /api/run/[slug]. Built-in skills stay free unless the admin priced them;
 * a priced one goes through the same access check as creator skills.
 * Returns null when the run may go ahead, otherwise the HTTP status to answer with.
 */
export async function builtinGate(slug: string): Promise<null | { status: 401 | 402 | 403; reason: string }> {
  const store = getStore();
  if (!store) return null; // marketplace not set up: built-in skills work as before
  let row: SkillRow | null;
  try {
    row = await builtinRow(store, slug);
  } catch (e) {
    console.error('builtin price lookup failed', slug, e);
    return null; // the database being down must not take the free tools down
  }
  if (!row || row.pricing === 'free') return null;
  const user = await getUser();
  // A priced built-in that the admin hid still runs for nobody but the admin.
  const d = await accessFor(store, user, { ...row, status: row.status === 'hidden' ? 'hidden' : 'approved' });
  if (d.allowed) return null;
  return d.reason === 'login' ? { status: 401, reason: 'login' } : d.reason === 'payment' ? { status: 402, reason: 'payment' } : { status: 403, reason: 'not_listed' };
}

// Payment events: see payments.ts (kept separate so tests can load it without request cookies).
export { applyPaymentEvent, handleWebhook } from './payments';
