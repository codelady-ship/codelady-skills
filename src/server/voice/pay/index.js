// Payment provider registry. Interface:
//   createCheckout({ user, successUrl }) -> { url, checkoutId }
//   cancel({ profile }) -> true
//   verifyWebhook(request, rawBody) -> event | throws HttpError(401)
// event = { eventId, userId, subscriptionId, customerId, status, active, periodEnd, portalUrl, raw }
// The app trusts ONLY webhook-verified state to switch plans.
import { mockPay } from './mock.js';
import { lemonSqueezyPay } from './lemonsqueezy.js';
import { HttpError } from '../util.js';

const FACTORIES = { mock: mockPay, lemonsqueezy: lemonSqueezyPay };

export function getPayment(cfg, db) {
  const f = FACTORIES[cfg.payment.provider];
  if (!f) throw new HttpError(500, 'bad_provider', `Unknown payment provider "${cfg.payment.provider}"`);
  return f(cfg, db);
}
