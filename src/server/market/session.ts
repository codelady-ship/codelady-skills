import 'server-only';
import { cookies } from 'next/headers';
import { marketConfig } from './config';
import { b64url, hmacHex, timingSafeEqual } from './crypto';
import { getStore } from './store';

// Who is signed in. Cookies are httpOnly (JavaScript in the page can't read them),
// SameSite=Lax and Secure outside localhost.
//   Google (Supabase Auth): mk_at = access token, mk_rt = refresh token. Checked with Supabase.
//   Mock mode:              mk_mock = "<payload>.<hmac>", signed with the server's mock secret.

export type SessionUser = { id: string; email: string; isAdmin: boolean };

const AT = 'mk_at', RT = 'mk_rt', MOCK = 'mk_mock';
const secure = () => process.env.NODE_ENV === 'production';
const base = () => ({ httpOnly: true, sameSite: 'lax' as const, secure: secure(), path: '/' });

export function isAdminEmail(email: string) {
  return marketConfig().adminEmails.includes(email.trim().toLowerCase());
}

/** Supabase users: the email must be confirmed. (Mock users are fixed test accounts and use isAdminEmail.) */
export function isAdminFor(u: { email?: string | null; email_confirmed_at?: string | null }) {
  return !!u.email_confirmed_at && !!u.email && isAdminEmail(u.email);
}

// ---- mock -----------------------------------------------------------------
/** Same email → same id, so a test user keeps their purchases after signing in again. */
async function mockId(email: string) {
  const h = await hmacHex('mock-user-id', email);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`;
}

export async function startMockSession(email: string) {
  const c = marketConfig();
  if (!c.mock) throw new Error('mock sign-in is off');
  const clean = email.trim().toLowerCase();
  const user = { id: await mockId(clean), email: clean };
  const payload = b64url(new TextEncoder().encode(JSON.stringify(user)));
  (await cookies()).set(MOCK, `${payload}.${await hmacHex(c.mockSecret, payload)}`, { ...base(), maxAge: 7 * 86400 });
  await getStore()?.ensureProfile(user);
  return { ...user, isAdmin: isAdminEmail(clean) };
}

async function mockUser(raw: string | undefined): Promise<SessionUser | null> {
  if (!raw) return null;
  const [payload, sig] = raw.split('.');
  if (!payload || !sig || !timingSafeEqual(sig, await hmacHex(marketConfig().mockSecret, payload))) return null;
  try {
    const u = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/'))) as { id: string; email: string };
    return { id: u.id, email: u.email, isAdmin: isAdminEmail(u.email) };
  } catch {
    return null;
  }
}

// ---- Supabase Auth --------------------------------------------------------
type Tokens = { access_token: string; refresh_token: string; expires_in?: number };
const cache = new Map<string, { user: SessionUser; until: number }>();

/** PKCE step 2 (Google → Supabase → our callback): trade the one-time code for tokens. */
export async function exchangeCode(code: string, verifier: string): Promise<(Tokens & { user?: { id: string; email?: string } }) | null> {
  const sb = marketConfig().supabase!;
  const res = await fetch(`${sb.url}/auth/v1/token?grant_type=pkce`, {
    method: 'POST',
    headers: { apikey: sb.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_code: code, code_verifier: verifier }),
    cache: 'no-store',
  });
  return res.ok ? await res.json() : null;
}

export async function saveTokens(t: Tokens) {
  const jar = await cookies();
  jar.set(AT, t.access_token, { ...base(), maxAge: Math.max(60, t.expires_in || 3600) });
  jar.set(RT, t.refresh_token, { ...base(), maxAge: 30 * 86400 });
}

async function supabaseUser(token: string): Promise<SessionUser | null> {
  const sb = marketConfig().supabase!;
  const hit = cache.get(token);
  if (hit && hit.until > Date.now()) return hit.user;
  const res = await fetch(`${sb.url}/auth/v1/user`, { headers: { apikey: sb.anonKey, Authorization: `Bearer ${token}` }, cache: 'no-store' });
  if (!res.ok) return null;
  const u = (await res.json()) as { id?: string; email?: string; email_confirmed_at?: string | null };
  if (!u.id || !u.email) return null;
  // Admin only for a confirmed address on ADMIN_EMAILS (an unconfirmed sign-up could claim any email).
  const user = { id: u.id, email: u.email.toLowerCase(), isAdmin: isAdminFor(u) };
  if (cache.size > 500) cache.clear();
  cache.set(token, { user, until: Date.now() + 60_000 });
  return user;
}

async function refresh(refreshToken: string): Promise<Tokens | null> {
  const sb = marketConfig().supabase!;
  const res = await fetch(`${sb.url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: { apikey: sb.anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: 'no-store',
  });
  return res.ok ? ((await res.json()) as Tokens) : null;
}

/**
 * The signed-in user, or null. Call from Route Handlers only (it may refresh cookies).
 * The admin flag comes from ADMIN_EMAILS on the server, never from the browser.
 */
export async function getUser(): Promise<SessionUser | null> {
  const c = marketConfig();
  const jar = await cookies();
  if (c.mock) return mockUser(jar.get(MOCK)?.value);
  if (!c.supabase) return null;
  const at = jar.get(AT)?.value;
  const user = at ? await supabaseUser(at) : null;
  if (user) return user;
  const rt = jar.get(RT)?.value;
  if (!rt) return null;
  const fresh = await refresh(rt);
  if (!fresh) {
    jar.delete(AT); jar.delete(RT);
    return null;
  }
  await saveTokens(fresh);
  return supabaseUser(fresh.access_token);
}

export async function endSession() {
  const jar = await cookies();
  const c = marketConfig();
  const at = jar.get(AT)?.value;
  if (c.supabase && at) {
    await fetch(`${c.supabase.url}/auth/v1/logout`, { method: 'POST', headers: { apikey: c.supabase.anonKey, Authorization: `Bearer ${at}` } }).catch(() => null);
    cache.delete(at);
  }
  for (const n of [AT, RT, MOCK]) jar.delete(n);
}
