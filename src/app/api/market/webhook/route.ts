import { getPayments, WebhookError } from '@/server/market/pay';
import { getStore } from '@/server/market/store';
import { handleWebhook } from '@/server/market/service';

/**
 * Lemon Squeezy webhook: https://<your-domain>/api/market/webhook
 * The signature (X-Signature, HMAC-SHA256 with LEMONSQUEEZY_WEBHOOK_SECRET) is checked on the
 * raw body before anything else. Only verified events create purchases, subscriptions and sales.
 */
export async function POST(request: Request) {
  const store = getStore();
  const pay = getPayments();
  if (!store || !pay || pay.name === 'mock') return Response.json({ error: 'not_configured' }, { status: 503 });
  const raw = await request.text();
  if (raw.length > 512_000) return Response.json({ error: 'too_big' }, { status: 413 });
  try {
    const result = await handleWebhook(store, pay, request, raw);
    return Response.json({ ok: true, result });
  } catch (e) {
    if (e instanceof WebhookError) return Response.json({ error: e.message }, { status: e.status });
    console.error('market webhook failed', e);
    // 500 makes Lemon Squeezy retry later; the stored event id stops double counting.
    return Response.json({ error: 'failed' }, { status: 500 });
  }
}
