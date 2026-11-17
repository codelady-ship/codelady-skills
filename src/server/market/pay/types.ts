import type { SkillRow } from '@/lib/market/types';

/**
 * A payment provider. Lemon Squeezy today; Paddle (or another merchant of record) can be
 * added as one more file with these three functions and a line in pay/index.ts.
 * The site trusts ONLY verified webhooks to give access: a redirect back from checkout proves nothing.
 */
export interface PaymentProvider {
  name: string;
  /** A hosted checkout page for this buyer and skill, in USD at the skill's own price. */
  createCheckout(args: { user: { id: string; email: string }; skill: SkillRow; successUrl: string }): Promise<{ url: string }>;
  /** Checks the signature (throws WebhookError on a bad one); null = an event the marketplace ignores. */
  parseWebhook(request: Request, rawBody: string): Promise<PaymentEvent | null>;
}

/**
 * Custom data the site attaches to every checkout, returned in each webhook.
 * `sig` = hex HMAC-SHA256 of `${user_id}|${skill_id}|${price_cents}|${kind}` (see checkoutSig), so nobody
 * can add their own user, skill, price or kind to a public buy link: the webhook rejects a tag without a valid sig.
 */
export type CheckoutTag = { market: '1'; user_id: string; skill_id: string; price_cents: string; kind: string; sig: string };

export type PaymentEvent = {
  /** Stable id for de-duplicating retries */
  id: string;
  testMode: boolean;
  userId: string | null;
  skillId: string | null;
  /** The skill price (USD cents) signed into the checkout; null when the event carried no checkout tag. */
  signedPriceCents: number | null;
} & (
  | { type: 'order_paid'; orderId: string; paidCents: number }
  | { type: 'order_refunded'; orderId: string }
  | { type: 'subscription'; subscriptionId: string; status: string; periodEnd: string | null }
  | { type: 'subscription_payment'; subscriptionId: string; invoiceId: string; paidCents: number }
);

export class WebhookError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
