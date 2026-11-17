import 'server-only';
import type { MarketConfig } from '../config';
import { hmacHex, timingSafeEqual } from '../crypto';
import { WebhookError, type CheckoutTag, type PaymentProvider } from './types';

// Lemon Squeezy (merchant of record: it charges the buyer in USD and handles VAT/sales tax).
//
// One store, two products made once by the owner in the Lemon Squeezy dashboard:
//   "Skill (one-time)"  → its variant id in LEMONSQUEEZY_VARIANT_ONE_TIME
//   "Skill (monthly)"   → a subscription variant, id in LEMONSQUEEZY_VARIANT_MONTHLY
// Every checkout overrides the name and the price (custom_price, USD cents) with the skill's own,
// so creators never need their own Lemon Squeezy products. For subscriptions the custom price
// is used for every renewal too (Lemon Squeezy API docs, "Create a checkout").
// Free trials are handled by the site (no card needed), not by Lemon Squeezy.
//
// Webhook: https://<your-domain>/api/market/webhook  (events listed in docs/MARKETPLACE.md)
// Signature: X-Signature = hex HMAC-SHA256 of the raw body with LEMONSQUEEZY_WEBHOOK_SECRET.
//
// Underpayment guard: the variants' public buy links accept checkout[custom][...] from anyone, at the
// variant's own price. So every checkout made here also carries price_cents and
// sig = HMAC-SHA256(LEMONSQUEEZY_WEBHOOK_SECRET, "<user_id>|<skill_id>|<price_cents>|<kind>"). A paying
// event whose tag has no valid sig is rejected, its variant must be the configured one (both variant
// ids must be set: unset = rejected), and the service (payments.ts) refuses any payment below the signed
// price. "Paid" = subtotal minus discount, before tax (so a discount code that takes the amount below
// the skill's price is rejected too).

const API = 'https://api.lemonsqueezy.com/v1';
const cents = (v: unknown) => Math.max(0, Math.round(Number(v) || 0));
/** Amount actually paid before tax, in USD cents: subtotal minus discount (order and invoice payloads). */
const paidCents = (a: Record<string, unknown>) =>
  Math.max(0, cents(a.subtotal_usd ?? a.subtotal) - cents(a.discount_total_usd ?? a.discount_total));

/** The checkout tag signature (see CheckoutTag). */
export function checkoutSig(secret: string, userId: string, skillId: string, priceCents: number | string, kind: string) {
  return hmacHex(secret, `${userId}|${skillId}|${priceCents}|${kind}`);
}

export function lemonSqueezy(cfg: MarketConfig): PaymentProvider {
  const ls = cfg.payments.lemon;
  return {
    name: 'lemonsqueezy',

    async createCheckout({ user, skill, successUrl }) {
      if (!ls) throw new Error('Lemon Squeezy is not configured');
      const variant = skill.pricing === 'monthly' ? ls.variantMonthly : ls.variantOneTime;
      if (!variant) throw new Error(`LEMONSQUEEZY_VARIANT_${skill.pricing === 'monthly' ? 'MONTHLY' : 'ONE_TIME'} is not set`);
      if (!ls.webhookSecret) throw new Error('LEMONSQUEEZY_WEBHOOK_SECRET is not set (it also signs checkouts)');
      const price = String(skill.price_cents);
      const custom: CheckoutTag = {
        market: '1', user_id: user.id, skill_id: skill.id, kind: skill.pricing,
        price_cents: price, sig: await checkoutSig(ls.webhookSecret, user.id, skill.id, price, skill.pricing),
      };
      const body = {
        data: {
          type: 'checkouts',
          attributes: {
            custom_price: skill.price_cents,
            product_options: {
              name: skill.name.slice(0, 80),
              description: skill.tagline.slice(0, 300),
              redirect_url: successUrl,
              enabled_variants: [Number(variant)],
            },
            checkout_options: { embed: false, media: false },
            checkout_data: { email: user.email, custom },
            test_mode: ls.testMode,
            expires_at: new Date(Date.now() + 2 * 3600e3).toISOString(),
          },
          relationships: {
            store: { data: { type: 'stores', id: String(ls.storeId) } },
            variant: { data: { type: 'variants', id: String(variant) } },
          },
        },
      };
      const res = await fetch(`${API}/checkouts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${ls.apiKey}`, Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.data?.attributes?.url) throw new Error(`checkout failed (${res.status})`);
      return { url: data.data.attributes.url as string };
    },

    async parseWebhook(request, raw) {
      if (!ls?.webhookSecret) throw new WebhookError(503, 'LEMONSQUEEZY_WEBHOOK_SECRET is not set');
      const sig = request.headers.get('x-signature') || '';
      if (!timingSafeEqual(sig, await hmacHex(ls.webhookSecret, raw))) throw new WebhookError(401, 'bad signature');

      const e = JSON.parse(raw);
      const name: string = e?.meta?.event_name || '';
      const custom = (e?.meta?.custom_data || {}) as Partial<CheckoutTag>;
      const testMode = Boolean(e?.meta?.test_mode);
      // Not ours (the voice app shares the store) or a test payment reaching the live site.
      if (custom.market !== '1') return null;
      if (testMode && !ls.testMode) return null;

      const a = e?.data?.attributes || {};
      const objId = String(e?.data?.id || '');

      // Events that can give access must carry a checkout tag signed by this site (or none at all:
      // a subscription invoice without custom data is matched to the stored subscription instead).
      // Refunds only take access away, so they need no tag.
      let signedPriceCents: number | null = null;
      const refund = name === 'order_refunded' || name === 'subscription_payment_refunded';
      if (!refund && (custom.user_id || custom.skill_id || custom.price_cents !== undefined || custom.sig)) {
        const price = String(custom.price_cents ?? '');
        const kind = String(custom.kind ?? '');
        if (!custom.user_id || !custom.skill_id || !/^\d+$/.test(price) || !kind) throw new WebhookError(403, 'bad checkout tag');
        // kind (one_time / monthly) is signed too, so a one-time tag can't be replayed on the monthly product.
        const want = await checkoutSig(ls.webhookSecret, String(custom.user_id), String(custom.skill_id), price, kind);
        if (!timingSafeEqual(String(custom.sig || ''), want)) throw new WebhookError(403, 'bad checkout signature');
        signedPriceCents = Number(price);
      }
      const base = {
        id: `${name}:${objId}:${a.updated_at || ''}`, testMode, signedPriceCents,
        userId: refund ? null : custom.user_id || null, skillId: refund ? null : custom.skill_id || null,
      };
      // The product must be the one configured for marketplace checkouts. Fails closed: an unset
      // variant id rejects the event.
      const wrongVariant = (v: unknown, want: string) => !want || String(v ?? '') !== want;

      switch (name) {
        case 'order_created':
          // Subscription first payments are counted from subscription_payment_success instead.
          if (custom.kind === 'monthly' || a.status !== 'paid') return null;
          if (ls.variantMonthly && String(a.first_order_item?.variant_id ?? '') === ls.variantMonthly) return null;
          if (wrongVariant(a.first_order_item?.variant_id, ls.variantOneTime)) throw new WebhookError(403, 'wrong variant');
          return { ...base, type: 'order_paid', orderId: objId, paidCents: paidCents(a) };
        case 'order_refunded':
          return { ...base, type: 'order_refunded', orderId: objId };
        case 'subscription_payment_refunded':
          return { ...base, type: 'order_refunded', orderId: `inv:${objId}` };
        case 'subscription_payment_success':
          if (a.status !== 'paid') return null;
          return { ...base, type: 'subscription_payment', subscriptionId: String(a.subscription_id || ''), invoiceId: `inv:${objId}`, paidCents: paidCents(a) };
        case 'subscription_created':
        case 'subscription_updated':
        case 'subscription_cancelled':
        case 'subscription_resumed':
        case 'subscription_expired':
        case 'subscription_paused':
        case 'subscription_unpaused':
          if (wrongVariant(a.variant_id, ls.variantMonthly)) throw new WebhookError(403, 'wrong variant');
          return {
            ...base, type: 'subscription', subscriptionId: objId, status: String(a.status || 'unknown'),
            periodEnd: (a.status === 'cancelled' || a.status === 'expired' ? a.ends_at : a.renews_at) || a.ends_at || null,
          };
        default:
          return null;
      }
    },
  };
}
