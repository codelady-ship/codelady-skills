// Lemon Squeezy (merchant of record) adapter, TEST MODE by default.
// Env: LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID, LEMONSQUEEZY_VARIANT_ID,
//      PAYMENT_WEBHOOK_SECRET (the webhook "signing secret"), PAYMENT_TEST_MODE (default on).
// Webhook URL: https://<your-domain>/api/webhooks/lemonsqueezy
// Docs: https://docs.lemonsqueezy.com/api/checkouts , /help/webhooks/signing-requests
import { HttpError, hmacHex, timingSafeEqual } from '../util.js';

const API = 'https://api.lemonsqueezy.com/v1';
const ACTIVE = new Set(['active', 'on_trial', 'past_due', 'cancelled']); // cancelled = paid until ends_at

export function lemonSqueezyPay(cfg) {
  const env = cfg.payment.env;
  const key = env.LEMONSQUEEZY_API_KEY;
  const H = () => {
    if (!key) throw new HttpError(503, 'payment_not_configured', 'LEMONSQUEEZY_API_KEY is not set');
    return { Authorization: `Bearer ${key}`, Accept: 'application/vnd.api+json', 'Content-Type': 'application/vnd.api+json' };
  };

  return {
    name: 'lemonsqueezy',
    async createCheckout({ user, successUrl }) {
      const body = {
        data: {
          type: 'checkouts',
          attributes: {
            checkout_data: { email: user.email, custom: { user_id: user.id } },
            product_options: { redirect_url: successUrl },
            test_mode: cfg.payment.testMode
          },
          relationships: {
            store: { data: { type: 'stores', id: String(env.LEMONSQUEEZY_STORE_ID || '') } },
            variant: { data: { type: 'variants', id: String(env.LEMONSQUEEZY_VARIANT_ID || '') } }
          }
        }
      };
      const res = await fetch(`${API}/checkouts`, { method: 'POST', headers: H(), body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new HttpError(502, 'checkout_failed', 'Could not create a checkout', { providerStatus: res.status });
      return { url: data.data.attributes.url, checkoutId: data.data.id };
    },
    async cancel({ profile }) {
      if (!profile.pay_subscription_id) return true;
      const res = await fetch(`${API}/subscriptions/${encodeURIComponent(profile.pay_subscription_id)}`, { method: 'DELETE', headers: H() });
      if (!res.ok && res.status !== 404) throw new HttpError(502, 'cancel_failed', 'Could not cancel the subscription');
      return true;
    },
    async verifyWebhook(request, rawBody) {
      const secret = cfg.payment.webhookSecret;
      if (!secret) throw new HttpError(503, 'payment_not_configured', 'PAYMENT_WEBHOOK_SECRET is not set');
      const sig = request.headers.get('x-signature') || '';
      if (!timingSafeEqual(sig, await hmacHex(secret, rawBody))) throw new HttpError(401, 'bad_signature', 'Invalid webhook signature');
      const e = JSON.parse(rawBody);
      const name = e.meta?.event_name || '';
      if (!name.startsWith('subscription_')) return { ignore: true, eventId: `${name}:${e.data?.id}` };
      // Marketplace skill subscriptions share the store; they are handled by /api/market/webhook.
      if (e.meta?.custom_data?.market === '1') return { ignore: true, eventId: `${name}:${e.data?.id}` };
      const a = e.data?.attributes || {};
      const status = a.status || 'unknown';
      return {
        // LS has no event id; build a stable one from event, object and update time.
        eventId: `${name}:${e.data?.id}:${a.updated_at || ''}`,
        userId: e.meta?.custom_data?.user_id || null,
        subscriptionId: String(e.data?.id || ''),
        customerId: String(a.customer_id || ''),
        status,
        active: ACTIVE.has(status),
        periodEnd: a.ends_at || a.renews_at || null,
        portalUrl: a.urls?.customer_portal || null,
        testMode: Boolean(e.meta?.test_mode),
        raw: { event: name, status, test_mode: e.meta?.test_mode }
      };
    }
  };
}
