import { fail, ok, readBody, str, withMarket } from '@/server/market/http';
import { getMockPay } from '@/server/market/pay';
import { handleWebhook } from '@/server/market/service';

/**
 * MOCK mode only: the "Pay (test)" button on the test checkout page. Builds signed webhook
 * events and pushes them through the same verification and handling as real Lemon Squeezy
 * webhooks. Answers 404 whenever mock payments are off (always on the live site).
 */
export async function POST(request: Request) {
  const mock = getMockPay();
  if (!mock) return fail('not_found', 404);
  return withMarket(request, { user: 'required', write: true }, async ({ store, user }) => {
    const b = await readBody(request);
    const id = str(b?.skillId, 80);
    const skill = id.startsWith('builtin:') ? await store.getBuiltinSkill(id.slice(8)) : await store.getSkill(id);
    if (!skill || skill.pricing === 'free') return fail('not_found', 404);
    const results = [];
    for (const e of await mock.buildEvents(user!, skill)) {
      const req = new Request(request.url, { method: 'POST', headers: { 'x-signature': e.signature }, body: e.body });
      results.push(await handleWebhook(store, mock, req, e.body));
    }
    return ok({ results });
  });
}
