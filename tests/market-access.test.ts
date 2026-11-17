// Run: npm test   (Node's built-in test runner; Node 23.6+ runs TypeScript directly)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canRun, subscriptionLive, type AccessInput } from '../src/lib/market/access.ts';

const NOW = Date.parse('2026-11-11T12:00:00Z');
const day = 864e5;
const iso = (ms: number) => new Date(ms).toISOString();

const paid = { id: 'sk1', pricing: 'one_time' as const, status: 'approved' as const, creator_id: 'creator', trial_days: 7 };
const buyer = { id: 'u1', isAdmin: false };
const run = (over: Partial<AccessInput>) => canRun({ skill: paid, user: buyer, now: NOW, ...over });

test('free approved skill: anyone, even signed out', () => {
  const r = canRun({ skill: { ...paid, pricing: 'free' }, user: null, now: NOW });
  assert.deepEqual(r, { allowed: true, via: 'free' });
});

test('paid skill, signed out: asked to sign in', () => {
  const r = run({ user: null });
  assert.equal(r.allowed, false);
  assert.equal(!r.allowed && r.reason, 'login');
});

test('paid skill, signed in without anything: asked to pay, trial offered', () => {
  assert.deepEqual(run({}), { allowed: false, reason: 'payment', trialAvailable: true });
});

test('no trial offered when trial_days is 0', () => {
  const r = canRun({ skill: { ...paid, trial_days: 0 }, user: buyer, now: NOW });
  assert.deepEqual(r, { allowed: false, reason: 'payment', trialAvailable: false });
});

test('creator and admin always run their paid skill', () => {
  assert.equal(run({ user: { id: 'creator', isAdmin: false } }).allowed, true);
  assert.deepEqual(run({ user: { id: 'boss', isAdmin: true } }), { allowed: true, via: 'admin' });
});

test('paid purchase allows; refunded purchase does not', () => {
  assert.deepEqual(run({ purchases: [{ user_id: 'u1', skill_id: 'sk1', status: 'paid' }] }), { allowed: true, via: 'purchase' });
  assert.equal(run({ purchases: [{ user_id: 'u1', skill_id: 'sk1', status: 'refunded' }] }).allowed, false);
});

test('purchase of another skill or by another user does not count', () => {
  assert.equal(run({ purchases: [{ user_id: 'u1', skill_id: 'other', status: 'paid' }] }).allowed, false);
  assert.equal(run({ purchases: [{ user_id: 'u2', skill_id: 'sk1', status: 'paid' }] }).allowed, false);
});

test('subscriptions: active, cancelled-but-paid-up, expired', () => {
  const monthly = { ...paid, pricing: 'monthly' as const };
  const sub = (status: string, end: number, price_ok = true) => ({ user_id: 'u1', skill_id: 'sk1', status, current_period_end: iso(end), price_ok });
  const go = (s: ReturnType<typeof sub>) => canRun({ skill: monthly, user: buyer, now: NOW, subscriptions: [s] });
  assert.equal(go(sub('active', NOW + 5 * day)).allowed, true);
  assert.equal(go(sub('cancelled', NOW + 5 * day)).allowed, true);
  assert.equal(go(sub('cancelled', NOW - day)).allowed, false);
  assert.equal(go(sub('expired', NOW + 5 * day)).allowed, false);
  assert.equal(go(sub('unpaid', NOW + 5 * day)).allowed, false);
  assert.equal(subscriptionLive({ status: 'past_due', current_period_end: iso(NOW - day), price_ok: true }, NOW), true);
});

test('a subscription without a fully paid invoice (price_ok false) gives no access', () => {
  const monthly = { ...paid, pricing: 'monthly' as const };
  const s = { user_id: 'u1', skill_id: 'sk1', status: 'active', current_period_end: iso(NOW + 5 * day), price_ok: false };
  const r = canRun({ skill: monthly, user: buyer, now: NOW, subscriptions: [s] });
  assert.equal(r.allowed, false);
  assert.equal(!r.allowed && r.reason, 'payment');
});

test('trial: live trial allows, ended trial blocks and is not offered again', () => {
  const live = run({ trials: [{ user_id: 'u1', skill_id: 'sk1', ends_at: iso(NOW + day) }] });
  assert.equal(live.allowed && live.via, 'trial');
  const ended = run({ trials: [{ user_id: 'u1', skill_id: 'sk1', ends_at: iso(NOW - day) }] });
  assert.deepEqual(ended, { allowed: false, reason: 'payment', trialAvailable: false });
});

test('admin grants: per skill, all skills, expiry and revoke', () => {
  const g = (skill_id: string | null, expires_at: string | null, revoked_at: string | null = null) =>
    run({ grants: [{ user_id: 'u1', skill_id, expires_at, revoked_at }] });
  assert.equal(g('sk1', null).allowed, true);
  assert.equal(g(null, null).allowed, true);
  assert.equal(g('other', null).allowed, false);
  assert.equal(g('sk1', iso(NOW + day)).allowed, true);
  assert.equal(g('sk1', iso(NOW - day)).allowed, false);
  assert.equal(g('sk1', null, iso(NOW - day)).allowed, false);
});

test('pending or hidden skills: only creator and admin', () => {
  for (const status of ['pending', 'hidden'] as const) {
    const skill = { ...paid, pricing: 'free' as const, status };
    assert.deepEqual(canRun({ skill, user: null, now: NOW }), { allowed: false, reason: 'not_listed', trialAvailable: false });
    assert.equal(canRun({ skill, user: buyer, now: NOW, purchases: [{ user_id: 'u1', skill_id: 'sk1', status: 'paid' }] }).allowed, false);
    assert.equal(canRun({ skill, user: { id: 'creator', isAdmin: false }, now: NOW }).allowed, true);
    assert.equal(canRun({ skill, user: { id: 'x', isAdmin: true }, now: NOW }).allowed, true);
  }
});

test('built-in skill marked paid (no creator): nobody counts as its creator', () => {
  const builtin = { ...paid, creator_id: null };
  assert.equal(canRun({ skill: builtin, user: buyer, now: NOW }).allowed, false);
});
