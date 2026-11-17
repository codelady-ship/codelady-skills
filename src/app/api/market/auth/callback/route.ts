import { NextResponse, type NextRequest } from 'next/server';
import { marketConfig, siteOrigin } from '@/server/market/config';
import { exchangeCode } from '@/server/market/session';
import { getStore } from '@/server/market/store';
import { safeNext } from '@/server/market/redirect';

/** Step 2: Supabase sends the visitor back here with ?code=…; we trade it for a session. */
export async function GET(request: NextRequest) {
  const c = marketConfig();
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get('next'));
  const origin = siteOrigin(request);
  const back = (failed: boolean) => {
    const to = new URL(failed ? next.replace(/^(\/[a-z]{2})?.*$/, '$1/signin') : next, origin);
    if (failed) to.searchParams.set('error', '1');
    return NextResponse.redirect(to);
  };
  const code = url.searchParams.get('code');
  const verifier = request.cookies.get('mk_pkce')?.value;
  if (!c.supabase || !code || !verifier) return back(true);

  const tokens = await exchangeCode(code, verifier).catch(() => null);
  if (!tokens?.access_token || !tokens.user?.id || !tokens.user.email) return back(true);
  await getStore()?.ensureProfile({ id: tokens.user.id, email: tokens.user.email }).catch((e) => console.error('profile', e));

  const res = back(false);
  const base = { httpOnly: true, sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', path: '/' };
  res.cookies.set('mk_at', tokens.access_token, { ...base, maxAge: Math.max(60, tokens.expires_in || 3600) });
  res.cookies.set('mk_rt', tokens.refresh_token, { ...base, maxAge: 30 * 86400 });
  res.cookies.set('mk_pkce', '', { ...base, path: '/api/market/auth', maxAge: 0 });
  return res;
}
