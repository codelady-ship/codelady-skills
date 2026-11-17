import 'server-only';
import { marketConfig } from '../config';
import { lemonSqueezy } from './lemonsqueezy';
import { mockPay } from './mock';
import type { PaymentProvider } from './types';

// Payment provider registry (MARKET_PAYMENT_PROVIDER, default: lemonsqueezy when its keys are set,
// mock in mock mode). To switch to Paddle: add pay/paddle.ts implementing PaymentProvider
// (Paddle Billing: transactions with custom_data + "Paddle-Signature" webhook check) and list it here.
export function getPayments(): PaymentProvider | null {
  const c = marketConfig();
  switch (c.payments.provider) {
    case 'lemonsqueezy': return c.payments.lemon ? lemonSqueezy(c) : null;
    case 'mock': return c.mock ? mockPay(c) : null; // never in production
    default: return null;
  }
}

export function getMockPay() {
  const c = marketConfig();
  return c.mock && c.payments.provider === 'mock' ? mockPay(c) : null;
}

export type { PaymentProvider, PaymentEvent } from './types';
export { WebhookError } from './types';
