import 'server-only';
import { splitSale } from '@/lib/market/price';
import { marketConfig } from './config';
import type { PaymentEvent, PaymentProvider } from './pay/types';
import type { MarketStore } from './store/types';

// Payment events → purchases, subscriptions and sales. Kept apart from service.ts (which needs
// the request's cookies) so tests can run it with the in-memory store.

/**
 * Records one verified payment event. Safe to call twice with the same event: the event id is
 * stored first so retries are skipped, and removed again if a write fails, so the provider's
 * retry (after our 500) applies it instead of being skipped as a duplicate.
 */
export async function applyPaymentEvent(store: MarketStore, provider: string, ev: PaymentEvent) {
  if (!(await store.recordEvent(provider, ev.id))) return 'duplicate';
  try {
    return await applyOnce(store, provider, ev);
  } catch (e) {
    await store.forgetEvent(provider, ev.id).catch((err) => console.error('could not forget event', provider, ev.id, err));
    throw e;
  }
}

/** The price a payment must reach: the price signed into the checkout, else the skill's current price. */
function requiredCents(ev: PaymentEvent, currentPriceCents: number) {
  return ev.signedPriceCents ?? currentPriceCents;
}

async function applyOnce(store: MarketStore, provider: string, ev: PaymentEvent) {
  const fee = marketConfig().feePercent;

  if (ev.type === 'order_refunded') {
    await store.setPurchaseStatus(provider, ev.orderId, 'refunded');
    await store.markSaleRefunded(provider, ev.orderId);
    return 'refunded';
  }

  // Subscription invoices may arrive without custom data: find the subscription we stored.
  let { userId, skillId } = ev;
  if ((!userId || !skillId) && (ev.type === 'subscription_payment' || ev.type === 'subscription')) {
    const sub = await store.findSubscription(provider, ev.subscriptionId);
    userId ||= sub?.user_id || null;
    skillId ||= sub?.skill_id || null;
  }
  if (!userId || !skillId) {
    // An invoice can arrive before subscription_created has been stored: throw, so the event id is
    // forgotten, the route answers 500 and Lemon Squeezy retries it later.
    if (ev.type === 'subscription_payment') throw new Error(`subscription ${ev.subscriptionId} not stored yet`);
    return 'missing_ids';
  }
  const [skill, buyer] = await Promise.all([store.getSkill(skillId), store.getProfile(userId)]);
  if (!skill || !buyer) return 'unknown_skill_or_user';

  switch (ev.type) {
    case 'order_paid': {
      if (skill.pricing !== 'one_time') return 'wrong_pricing';
      // Checked against the signed price (the price the buyer was shown), else today's price.
      if (ev.paidCents < requiredCents(ev, skill.price_cents)) return 'underpaid';
      await store.upsertPurchase({ user_id: userId, skill_id: skillId, provider, order_id: ev.orderId, amount_cents: ev.paidCents, status: 'paid' });
      const s = splitSale(ev.paidCents, skill.creator_id ? fee : 100);
      await store.addSale({ skill_id: skillId, creator_id: skill.creator_id, buyer_id: userId, kind: 'one_time', provider, provider_ref: ev.orderId, gross_cents: s.gross, fee_cents: s.fee, net_cents: s.net });
      return 'purchase';
    }
    case 'subscription':
      // A subscription to a skill that isn't monthly is never created. Status changes of one that
      // already exists still apply (e.g. a cancellation after the creator switched pricing).
      if (skill.pricing !== 'monthly' && !(await store.findSubscription(provider, ev.subscriptionId))) return 'wrong_pricing';
      // Status only: this never sets price_ok, so a subscription gives no access before a full invoice.
      await store.upsertSubscription({ user_id: userId, skill_id: skillId, provider, provider_sub_id: ev.subscriptionId, status: ev.status, current_period_end: ev.periodEnd });
      return 'subscription';
    case 'subscription_payment': {
      // Renewals keep the price fixed at checkout, so an invoice is checked against the signed price
      // (or, without a tag, today's price).
      if (skill.pricing !== 'monthly') return 'wrong_pricing';
      if (ev.paidCents < requiredCents(ev, skill.price_cents)) return 'underpaid';
      await store.markSubscriptionPaid({ user_id: userId, skill_id: skillId, provider, provider_sub_id: ev.subscriptionId });
      const s = splitSale(ev.paidCents, skill.creator_id ? fee : 100);
      await store.addSale({ skill_id: skillId, creator_id: skill.creator_id, buyer_id: userId, kind: 'subscription', provider, provider_ref: ev.invoiceId, gross_cents: s.gross, fee_cents: s.fee, net_cents: s.net });
      return 'sale';
    }
  }
}

/** Verifies and applies one webhook delivery (used by the real webhook route and by the mock checkout). */
export async function handleWebhook(store: MarketStore, pay: PaymentProvider, request: Request, raw: string) {
  const ev = await pay.parseWebhook(request, raw);
  if (!ev) return 'ignored';
  return applyPaymentEvent(store, pay.name, ev);
}
