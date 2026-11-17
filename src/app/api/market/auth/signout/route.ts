import { endSession } from '@/server/market/session';
import { fail, ok } from '@/server/market/http';
import { sameOrigin } from '@/server/rate';

export async function POST(request: Request) {
  if (!sameOrigin(request)) return fail('forbidden', 403);
  await endSession();
  return ok({ ok: true });
}
