// Who may run a skill. Pure function: the server loads the rows, this decides.
// Used by every run API before the AI is called; the browser only gets the result.
import type { AccessVia, DenyReason, Grant, Pricing, Purchase, SkillStatus, Subscription, Trial } from './types';

export type AccessInput = {
  skill: { id: string; pricing: Pricing; status: SkillStatus; creator_id: string | null; trial_days: number };
  user: { id: string; isAdmin: boolean } | null;
  now: number;
  purchases?: Pick<Purchase, 'skill_id' | 'user_id' | 'status'>[];
  subscriptions?: Pick<Subscription, 'skill_id' | 'user_id' | 'status' | 'current_period_end' | 'price_ok'>[];
  trials?: Pick<Trial, 'skill_id' | 'user_id' | 'ends_at'>[];
  grants?: Pick<Grant, 'skill_id' | 'user_id' | 'expires_at' | 'revoked_at'>[];
};

export type AccessDecision =
  | { allowed: true; via: AccessVia; until?: string | null }
  | { allowed: false; reason: DenyReason; trialAvailable: boolean };

/** Lemon Squeezy statuses that still mean "paid up" (cancelled = paid until the period ends). */
const LIVE_SUB = new Set(['active', 'on_trial', 'past_due']);

const time = (s: string | null | undefined) => (s ? Date.parse(s) : NaN);

/** Live = paid up (price_ok: an invoice reached the signed price) and in a paid-up status. */
export function subscriptionLive(s: Pick<Subscription, 'status' | 'current_period_end' | 'price_ok'>, now: number) {
  if (!s.price_ok) return false;
  const end = time(s.current_period_end);
  if (LIVE_SUB.has(s.status)) return Number.isNaN(end) || end > now || s.status === 'past_due';
  if (s.status === 'cancelled') return !Number.isNaN(end) && end > now;
  return false;
}

export function grantLive(g: Pick<Grant, 'expires_at' | 'revoked_at'>, now: number) {
  if (g.revoked_at) return false;
  const end = time(g.expires_at);
  return Number.isNaN(end) || end > now;
}

export function canRun(input: AccessInput): AccessDecision {
  const { skill, user, now } = input;
  const mine = <T extends { user_id: string; skill_id: string | null }>(rows: T[] | undefined) =>
    (rows || []).filter((r) => user && r.user_id === user.id && r.skill_id === skill.id);

  const isCreator = !!user && !!skill.creator_id && skill.creator_id === user.id;
  const isAdmin = !!user?.isAdmin;

  // Pending or hidden skills: only their creator and the admin see or run them.
  if (skill.status !== 'approved') {
    if (isAdmin) return { allowed: true, via: 'admin' };
    if (isCreator) return { allowed: true, via: 'creator' };
    return { allowed: false, reason: 'not_listed', trialAvailable: false };
  }
  if (skill.pricing === 'free') return { allowed: true, via: 'free' };
  if (!user) return { allowed: false, reason: 'login', trialAvailable: skill.trial_days > 0 };
  if (isCreator) return { allowed: true, via: 'creator' };
  if (isAdmin) return { allowed: true, via: 'admin' };

  // Admin grants: for this skill, or for every skill (skill_id null).
  const grant = (input.grants || []).find(
    (g) => g.user_id === user.id && (g.skill_id === skill.id || g.skill_id === null) && grantLive(g, now),
  );
  if (grant) return { allowed: true, via: 'grant', until: grant.expires_at };

  // A paid (not refunded) one-time purchase is for life, even if the creator later switches to monthly.
  if (mine(input.purchases).some((p) => p.status === 'paid')) return { allowed: true, via: 'purchase' };
  const sub = mine(input.subscriptions).find((s) => subscriptionLive(s, now));
  if (sub) return { allowed: true, via: 'subscription', until: sub.current_period_end };

  const trials = mine(input.trials);
  const live = trials.find((t) => time(t.ends_at) > now);
  if (live) return { allowed: true, via: 'trial', until: live.ends_at };

  return { allowed: false, reason: 'payment', trialAvailable: skill.trial_days > 0 && trials.length === 0 };
}
