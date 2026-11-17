import { marketConfig } from '@/server/market/config';
import { startMockSession } from '@/server/market/session';
import { fail, ok, readBody, str } from '@/server/market/http';
import { sameOrigin } from '@/server/rate';

/**
 * MOCK mode only: sign in as any test email, no password. Refused whenever Supabase is
 * configured or MOCK_AUTH=0, so it can never open a door on the live site.
 */
export async function POST(request: Request) {
  if (!marketConfig().mock) return fail('not_found', 404);
  if (!sameOrigin(request)) return fail('forbidden', 403);
  const body = await readBody(request);
  const email = str(body?.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('bad_input', 400);
  return ok({ user: await startMockSession(email) });
}
