// Webhook safety: signed checkout tags, underpayment, variant check, event retries.
// Runs with the in-memory store; no network (fetch is stubbed where a checkout is created).
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.LEMONSQUEEZY_API_KEY = 'test-key';
process.env.LEMONSQUEEZY_STORE_ID = '1';
process.env.LEMONSQUEEZY_VARIANT_ONE_TIME = '111';
process.env.LEMONSQUEEZY_VARIANT_MONTHLY = '222';
process.env.LEMONSQUEEZY_WEBHOOK_SECRET = 'whsec_test';
process.env.LEMONSQUEEZY_TEST_MODE = '1';

const { marketConfig } = await import('../src/server/market/config.ts');
const { lemonSqueezy, checkoutSig } = await import('../src/server/market/pay/lemonsqueezy.ts');
const { WebhookError } = await import('../src/server/market/pay/types.ts');
const { applyPaymentEvent, handleWebhook } = await import('../src/server/market/payments.ts');
const { memoryStore } = await import('../src/server/market/store/memory.ts');
const { accessFor } = await import('../src/server/market/service.ts');
const { hmacHex } = await import('../src/server/market/crypto.ts');

const SECRET = 'whsec_test';
const ONE_TIME = '00000000-0000-4000-8000-00000000d011'; // demo "Interview coach", $5.00
const MONTHLY = '00000000-0000-4000-8000-00000000d022'; // demo "Weekly content planner", $3.00/month
const store = memoryStore();
const pay = lemonSqueezy(marketConfig());
let seq = 0;

async function buyer() {
  const id = `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`;
  await store.ensureProfile({ id, email: `b${seq}@example.com` });
  return id;
}

async function tag(userId: string, skillId: string, price: number, kind = skillId === MONTHLY ? 'monthly' : 'one_time') {
  return { market: '1', user_id: userId, skill_id: skillId, price_cents: String(price), kind, sig: await checkoutSig(SECRET, userId, skillId, price, kind) };
}

async function deliver(event: string, custom: Record<string, unknown>, attributes: Record<string, unknown>, id = `o${++seq}`, provider = pay) {
  const raw = JSON.stringify({ meta: { event_name: event, custom_data: custom, test_mode: true }, data: { id, attributes: { updated_at: 't', ...attributes } } });
  const request = new Request('https://site.test/api/market/webhook', { method: 'POST', headers: { 'x-signature': await hmacHex(SECRET, raw) } });
  return handleWebhook(store, provider, request, raw);
}

const order = (subtotal: number, variant: number | string = 111) => ({ status: 'paid', subtotal_usd: subtotal, first_order_item: { variant_id: variant } });
const owns = async (userId: string, skillId: string) => (await store.entitlements(userId, skillId)).purchases.some((p) => p.status === 'paid');

test('checkout carries the price, kind and a signature of user|skill|price|kind', async () => {
  const realFetch = globalThis.fetch;
  let sent: { data: { attributes: { custom_price: number; checkout_data: { custom: Record<string, string> } } } } | null = null;
  globalThis.fetch = (async (_url: string, init: RequestInit) => {
    sent = JSON.parse(String(init.body));
    return new Response(JSON.stringify({ data: { attributes: { url: 'https://pay.test/c/1' } } }), { status: 201 });
  }) as typeof fetch;
  try {
    const skill = (await store.getSkill(ONE_TIME))!;
    await pay.createCheckout({ user: { id: 'u-1', email: 'u@example.com' }, skill, successUrl: 'https://site.test/en/ok' });
  } finally {
    globalThis.fetch = realFetch;
  }
  const custom = sent!.data.attributes.checkout_data.custom;
  assert.equal(sent!.data.attributes.custom_price, 500);
  assert.equal(custom.price_cents, '500');
  assert.equal(custom.kind, 'one_time');
  assert.equal(custom.sig, await hmacHex(SECRET, `u-1|${ONE_TIME}|500|one_time`));
});

test('a correctly signed and fully paid order gives access', async () => {
  const u = await buyer();
  assert.equal(await deliver('order_created', await tag(u, ONE_TIME, 500), order(500)), 'purchase');
  assert.ok(await owns(u, ONE_TIME));
});

test('custom data added to a public buy link (no signature) is rejected', async () => {
  const u = await buyer();
  await assert.rejects(
    deliver('order_created', { market: '1', user_id: u, skill_id: ONE_TIME }, order(100)),
    (e: unknown) => e instanceof WebhookError && e.status === 403,
  );
  assert.equal(await owns(u, ONE_TIME), false);
});

test('a changed price or another user/skill breaks the signature', async () => {
  const u = await buyer();
  const t = await tag(u, ONE_TIME, 500);
  await assert.rejects(deliver('order_created', { ...t, price_cents: '100' }, order(100)), WebhookError);
  await assert.rejects(deliver('order_created', { ...t, skill_id: MONTHLY }, order(500)), WebhookError);
  await assert.rejects(deliver('order_created', { ...t, user_id: await buyer() }, order(500)), WebhookError);
});

test('paying less than the signed price is rejected as underpaid', async () => {
  const u = await buyer();
  assert.equal(await deliver('order_created', await tag(u, ONE_TIME, 500), order(100)), 'underpaid');
  assert.equal(await owns(u, ONE_TIME), false);
  assert.equal((await store.listSales()).some((s) => s.buyer_id === u), false);
});

test('the signed price is what counts (e.g. the price was lowered after the checkout was made)', async () => {
  const u = await buyer();
  assert.equal(await deliver('order_created', await tag(u, ONE_TIME, 400), order(400)), 'purchase');
  assert.ok(await owns(u, ONE_TIME));
});

test('a discount that takes the paid amount below the signed price is underpaid', async () => {
  const u = await buyer();
  assert.equal(await deliver('order_created', await tag(u, ONE_TIME, 500), { ...order(500), discount_total_usd: 400 }), 'underpaid');
  assert.equal(await owns(u, ONE_TIME), false);
});

test('variant ids not configured: paying events are rejected (fail closed)', async () => {
  const cfg = marketConfig();
  const noVariants = lemonSqueezy({ ...cfg, payments: { ...cfg.payments, lemon: { ...cfg.payments.lemon!, variantOneTime: '', variantMonthly: '' } } });
  const u = await buyer();
  await assert.rejects(deliver('order_created', await tag(u, ONE_TIME, 500), order(500), undefined, noVariants), WebhookError);
  await assert.rejects(deliver('subscription_created', await tag(u, MONTHLY, 300), { status: 'active', variant_id: 222 }, undefined, noVariants), WebhookError);
  assert.equal(await owns(u, ONE_TIME), false);
});

test('an order for another product (variant) is rejected', async () => {
  const u = await buyer();
  await assert.rejects(deliver('order_created', await tag(u, ONE_TIME, 500), order(500, 999)), WebhookError);
  assert.equal(await owns(u, ONE_TIME), false);
});

test('a subscription gives access only after an invoice paid the signed price', async () => {
  const u = await buyer();
  const t = await tag(u, MONTHLY, 300);
  const skill = (await store.getSkill(MONTHLY))!;
  const can = async () => accessFor(store, { id: u, email: 'x@example.com', isAdmin: false }, skill);
  assert.equal(await deliver('subscription_created', t, { status: 'active', variant_id: 222, renews_at: '2099-01-01T00:00:00Z' }, 's1'), 'subscription');
  let d = await can();
  assert.equal(d.allowed, false, 'active status alone gives no access');
  assert.equal(!d.allowed && d.reason, 'payment');
  assert.equal(await deliver('subscription_payment_success', t, { status: 'paid', subscription_id: 's1', subtotal_usd: 100 }), 'underpaid');
  assert.equal((await can()).allowed, false, 'an underpaid invoice gives no access');
  assert.equal(await deliver('subscription_payment_success', t, { status: 'paid', subscription_id: 's1', subtotal_usd: 300 }), 'sale');
  d = await can();
  assert.equal(d.allowed && d.via, 'subscription');
  // A later status event does not reset price_ok.
  assert.equal(await deliver('subscription_updated', t, { status: 'active', variant_id: 222, renews_at: '2099-02-01T00:00:00Z' }, 's1'), 'subscription');
  assert.equal((await can()).allowed, true);
  await assert.rejects(deliver('subscription_created', t, { status: 'active', variant_id: 999 }, 's2'), WebhookError);
});

test('a one-time tag replayed on the monthly product is rejected (kind is signed)', async () => {
  const u = await buyer();
  const t = await tag(u, ONE_TIME, 500);
  await assert.rejects(deliver('subscription_created', { ...t, kind: 'monthly' }, { status: 'active', variant_id: 222 }, 'sx'), WebhookError);
  // Even a correctly signed tag can't make a subscription to a one-time skill, or a one-time purchase of a monthly one.
  assert.equal(await deliver('subscription_created', await tag(u, ONE_TIME, 500, 'monthly'), { status: 'active', variant_id: 222 }, 'sy'), 'wrong_pricing');
  assert.equal(await deliver('subscription_payment_success', await tag(u, ONE_TIME, 500, 'monthly'), { status: 'paid', subscription_id: 'sy', subtotal_usd: 500 }), 'wrong_pricing');
  assert.equal(await deliver('order_created', await tag(u, MONTHLY, 300, 'one_time'), order(300)), 'wrong_pricing');
  assert.equal(await owns(u, ONE_TIME), false);
  assert.equal(await store.findSubscription('lemonsqueezy', 'sy'), null);
});

test('an invoice for a subscription not stored yet fails (500) and is retried, not marked done', async () => {
  const ev = { id: 'inv:early', testMode: true, userId: null, skillId: null, signedPriceCents: null, type: 'subscription_payment' as const, subscriptionId: 'not-yet', invoiceId: 'inv:early', paidCents: 300 };
  await assert.rejects(applyPaymentEvent(store, 'lemonsqueezy', ev), /not stored yet/);
  assert.equal(await store.recordEvent('lemonsqueezy', 'inv:early'), true, 'the event id was forgotten, so the retry is applied');
});

test('refunds need no checkout tag', async () => {
  const u = await buyer();
  assert.equal(await deliver('order_created', await tag(u, ONE_TIME, 500), order(500), 'r1'), 'purchase');
  assert.equal(await deliver('order_refunded', { market: '1' }, { status: 'refunded' }, 'r1'), 'refunded');
  assert.equal(await owns(u, ONE_TIME), false);
});

test('a write that fails does not mark the event as done: the retry grants access', async () => {
  const u = await buyer();
  let fail = true;
  const flaky = {
    ...store,
    async upsertPurchase(row: Parameters<typeof store.upsertPurchase>[0]) {
      if (fail) { fail = false; throw new Error('database down'); }
      return store.upsertPurchase(row);
    },
  };
  const ev = { id: `order_created:retry-${u}`, testMode: true, userId: u, skillId: ONE_TIME, signedPriceCents: 500, type: 'order_paid' as const, orderId: `retry-${u}`, paidCents: 500 };
  await assert.rejects(applyPaymentEvent(flaky, 'lemonsqueezy', ev), /database down/);
  assert.equal(await applyPaymentEvent(flaky, 'lemonsqueezy', ev), 'purchase');
  assert.ok(await owns(u, ONE_TIME));
  assert.equal(await applyPaymentEvent(flaky, 'lemonsqueezy', ev), 'duplicate');
});
