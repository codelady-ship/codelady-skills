import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { adminGet, adminPost, resetAdminSandbox } from '../src/demo/admin-sandbox.ts';

// The static demo's admin sandbox: sample data in memory (no sessionStorage in Node), same actions as the admin API.
type Data = {
  skills: { id: string; status: string; pricing: string; price_cents: number }[];
  balances: { creator_id: string; balance: number; paid: number }[];
  grants: { id: string; revoked_at: string | null; email: string }[];
};
const data = () => adminGet('en').body as unknown as Data;

beforeEach(() => resetAdminSandbox());

test('seeds sample users, skills, sales and balances', () => {
  const d = data();
  assert.ok(d.skills.length >= 3);
  assert.ok(d.balances.some((b) => b.balance > 0));
});

test('status, price, grant, revoke and payout change only the sandbox copy', () => {
  const pending = data().skills.find((s) => s.status === 'pending')!;
  assert.equal(adminPost('en', { action: 'status', skillId: pending.id, status: 'approved' }).status, 200);
  assert.equal(data().skills.find((s) => s.id === pending.id)!.status, 'approved');

  assert.equal(adminPost('en', { action: 'price', skillId: pending.id, pricing: 'monthly', price: '2.50', trial_days: 7 }).status, 200);
  assert.equal(data().skills.find((s) => s.id === pending.id)!.price_cents, 250);

  assert.equal(adminPost('en', { action: 'grant', email: 'buyer@mock.test', skillId: 'all' }).status, 200);
  const g = data().grants.find((x) => x.email === 'buyer@mock.test')!;
  assert.equal(adminPost('en', { action: 'revoke', grantId: g.id }).status, 200);
  assert.ok(data().grants.find((x) => x.id === g.id)!.revoked_at);

  const b = data().balances.find((x) => x.balance > 0)!;
  assert.equal(adminPost('en', { action: 'payout', creatorId: b.creator_id, amount: (b.balance / 100).toFixed(2) }).status, 200);
  assert.equal(data().balances.find((x) => x.creator_id === b.creator_id)!.balance, 0);

  resetAdminSandbox();
  assert.equal(data().skills.find((s) => s.id === pending.id)!.status, 'pending');
});

test('bad input is refused like on the server', () => {
  const id = data().skills[0].id;
  assert.equal(adminPost('en', { action: 'price', skillId: id, pricing: 'one_time', price: 'abc' }).body.error, 'bad_price');
  assert.equal(adminPost('en', { action: 'grant', email: 'nobody@mock.test' }).body.error, 'no_user');
  assert.equal(adminPost('en', { action: 'drop_tables' }).body.error, 'bad_input');
});
