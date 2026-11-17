import 'server-only';
import type { SkillRow } from '@/lib/market/types';
import type { MarketConfig } from '../config';
import { hmacHex, newId, timingSafeEqual } from '../crypto';
import { WebhookError, type PaymentEvent, type PaymentProvider } from './types';

// Test payments for MOCK mode. No money moves. The checkout is a page on this site
// (/[lang]/market/test-checkout#<skill id>); its "Pay (test)" button asks the server to build
// SIGNED webhook events, which then go through the same verification and handling as real ones.

export function mockPay(cfg: MarketConfig): PaymentProvider & {
  buildEvents(user: { id: string }, skill: SkillRow): Promise<{ body: string; signature: string }[]>;
} {
  return {
    name: 'mock',

    async createCheckout({ skill, successUrl }) {
      const lang = new URL(successUrl).pathname.split('/')[1] || 'en';
      return { url: `/${lang}/market/test-checkout#${skill.id}` };
    },

    async buildEvents(user, skill) {
      const ref = newId().slice(0, 8);
      const base = { testMode: true, userId: user.id, skillId: skill.id, signedPriceCents: skill.price_cents };
      const events: PaymentEvent[] = skill.pricing === 'monthly'
        ? [
            { ...base, id: `sub:${ref}`, type: 'subscription', subscriptionId: `mock_sub_${ref}`, status: 'active', periodEnd: new Date(Date.now() + 30 * 864e5).toISOString() },
            { ...base, id: `inv:${ref}`, type: 'subscription_payment', subscriptionId: `mock_sub_${ref}`, invoiceId: `inv:mock_${ref}`, paidCents: skill.price_cents },
          ]
        : [{ ...base, id: `ord:${ref}`, type: 'order_paid', orderId: `mock_order_${ref}`, paidCents: skill.price_cents }];
      return Promise.all(events.map(async (e) => {
        const body = JSON.stringify(e);
        return { body, signature: await hmacHex(cfg.mockSecret, body) };
      }));
    },

    async parseWebhook(request, raw) {
      const sig = request.headers.get('x-signature') || '';
      if (!timingSafeEqual(sig, await hmacHex(cfg.mockSecret, raw))) throw new WebhookError(401, 'bad signature');
      return JSON.parse(raw) as PaymentEvent;
    },
  };
}
