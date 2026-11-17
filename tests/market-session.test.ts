// Admin rights need an address on ADMIN_EMAILS that Supabase has confirmed.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.ADMIN_EMAILS = 'owner@example.com';
const { isAdminFor, isAdminEmail } = await import('../src/server/market/session.ts');

test('a confirmed admin address is admin', () => {
  assert.equal(isAdminFor({ email: 'Owner@Example.com', email_confirmed_at: '2026-11-01T00:00:00Z' }), true);
});

test('an unconfirmed sign-up with the admin address is not admin', () => {
  assert.equal(isAdminFor({ email: 'owner@example.com', email_confirmed_at: null }), false);
  assert.equal(isAdminFor({ email: 'owner@example.com' }), false);
});

test('a confirmed address not on the list is not admin', () => {
  assert.equal(isAdminFor({ email: 'someone@example.com', email_confirmed_at: '2026-11-01T00:00:00Z' }), false);
});

test('the list check itself (used for mock test accounts) is unchanged', () => {
  assert.equal(isAdminEmail(' OWNER@example.com '), true);
});
