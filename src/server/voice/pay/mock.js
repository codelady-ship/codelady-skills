// Mock payment provider for local development. No money moves.
// Checkout returns a link back to the account page with a test panel; "Pay (test)"
// sends a SIGNED webhook through the same verification path a real provider uses.
import { HttpError, hmacHex, randomId, timingSafeEqual } from '../util.js';

export function mockPay(cfg, db) {
  const secret = cfg.mockSecret;
  return {
    name: 'mock',
    isMock: true,
    async createCheckout({ user, successUrl }) {
      const checkoutId = 'chk_' + randomId(8);
      await db.saveCheckout(checkoutId, { user_id: user.id, provider: 'mock', created_at: new Date().toISOString() });
      const u = new URL(successUrl);
      u.searchParams.set('mock_checkout', checkoutId);
      return { url: u.pathname + u.search, checkoutId };
    },
    async cancel() { return true; },
    // Builds a signed webhook body (used by POST /api/billing/mock/complete).
    async buildEvent({ userId, outcome }) {
      const now = Date.now();
      const body = JSON.stringify({
        id: 'evt_' + randomId(8),
        type: outcome === 'paid' ? 'subscription.active' : 'subscription.expired',
        user_id: userId,
        subscription_id: 'sub_mock_' + userId.slice(0, 8),
        customer_id: 'cus_mock_' + userId.slice(0, 8),
        period_end: new Date(now + 30 * 864e5).toISOString()
      });
      return { body, signature: await hmacHex(secret, body) };
    },
    async verifyWebhook(request, rawBody) {
      const sig = request.headers.get('x-signature') || '';
      if (!timingSafeEqual(sig, await hmacHex(secret, rawBody))) throw new HttpError(401, 'bad_signature', 'Invalid webhook signature');
      const e = JSON.parse(rawBody);
      const active = e.type === 'subscription.active';
      return {
        eventId: e.id, userId: e.user_id, subscriptionId: e.subscription_id, customerId: e.customer_id,
        status: active ? 'active' : 'expired', active, periodEnd: active ? e.period_end : null, portalUrl: null, raw: e
      };
    }
  };
}
