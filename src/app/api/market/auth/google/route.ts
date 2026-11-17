import { NextResponse } from 'next/server';
import { marketConfig, siteOrigin } from '@/server/market/config';
import { randomToken, sha256B64url } from '@/server/market/crypto';
import { safeNext } from '@/server/market/redirect';

/**
 * Step 1 of "Continue with Google": send the visitor to Supabase Auth, which shows Google's
 * sign-in. PKCE: we keep a random verifier in a short httpOnly cookie and send only its hash.
 */
export async function GET(request: Request) {
  const c = marketConfig();
  const url = new URL(request.url);
  const next = safeNext(url.searchParams.get('next'));
  if (!c.supabase) return NextResponse.redirect(new URL(next, url.origin));

  const verifier = randomToken(48);
  const callback = new URL('/api/market/auth/callback', siteOrigin(request));
  callback.searchParams.set('next', next);
  const auth = new URL(`${c.supabase.url}/auth/v1/authorize`);
  auth.searchParams.set('provider', 'google');
  auth.searchParams.set('redirect_to', callback.toString());
  auth.searchParams.set('code_challenge', await sha256B64url(verifier));
  auth.searchParams.set('code_challenge_method', 's256');

  const res = NextResponse.redirect(auth);
  res.cookies.set('mk_pkce', verifier, {
    httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/api/market/auth', maxAge: 600,
  });
  return res;
}
