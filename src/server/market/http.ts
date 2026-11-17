import 'server-only';
import { sameOrigin } from '@/server/rate';
import { getUser, type SessionUser } from './session';
import { getStore, type MarketStore } from './store';

// Small helpers shared by the /api/market/* routes. Errors are short codes;
// the browser turns them into words (src/i18n/market, `errors`).

export const fail = (error: string, status: number) => Response.json({ error }, { status, headers: { 'Cache-Control': 'no-store' } });
export const ok = (data: unknown) => Response.json(data, { headers: { 'Cache-Control': 'no-store' } });

export async function readBody(request: Request, maxBytes = 120_000): Promise<Record<string, unknown> | null> {
  const text = await request.text().catch(() => '');
  if (!text || text.length > maxBytes) return null;
  try {
    const v = JSON.parse(text);
    return v && typeof v === 'object' && !Array.isArray(v) ? v : null;
  } catch {
    return null;
  }
}

export const str = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

type Ctx = { store: MarketStore; user: SessionUser | null };
type Guard = { user?: 'optional' | 'required' | 'admin'; write?: boolean };

/**
 * Runs a handler with the store and the signed-in user, after the checks every route needs:
 * marketplace configured, same-origin for writes, sign-in or admin when asked.
 * Admin is decided here, on the server, from ADMIN_EMAILS — never from anything the browser sends.
 */
export async function withMarket(request: Request, guard: Guard, fn: (ctx: Ctx) => Promise<Response>): Promise<Response> {
  const store = getStore();
  if (!store) return fail('not_configured', 503);
  if (guard.write && !sameOrigin(request)) return fail('forbidden', 403);
  const user = await getUser();
  if (guard.user === 'required' && !user) return fail('login', 401);
  if (guard.user === 'admin' && !user?.isAdmin) return fail(user ? 'forbidden' : 'login', user ? 403 : 401);
  try {
    return await fn({ store, user });
  } catch (e) {
    console.error('market api failed', new URL(request.url).pathname, e);
    return fail('failed', 500);
  }
}
