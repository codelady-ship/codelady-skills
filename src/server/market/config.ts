import 'server-only';
import { DEFAULT_FEE_PERCENT } from '@/lib/market/price';

// Marketplace settings, read from the environment on every call (Cloudflare can change them
// without a rebuild). Nothing secret ever leaves the server: see publicConfig() for what the
// browser may know. Every variable is listed with comments in .env.example.

const list = (v: string | undefined) => String(v || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

/** Test accounts offered on the sign-in page in mock mode. */
export const MOCK_ADMIN_EMAIL = 'admin@mock.test';
export const MOCK_USER_EMAIL = 'buyer@mock.test';

export function marketConfig() {
  const env = process.env;
  const supabase = env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY
    ? { url: env.SUPABASE_URL.replace(/\/$/, ''), anonKey: env.SUPABASE_ANON_KEY, serviceKey: env.SUPABASE_SERVICE_ROLE_KEY }
    : null;
  // Mock mode = fake sign-in, in-memory database and test payments. Only possible while
  // Supabase is NOT configured, and switched off by MOCK_AUTH=0 (wrangler.jsonc sets 0 for production).
  const mock = !supabase && env.MOCK_AUTH !== '0';
  const lemon = env.LEMONSQUEEZY_API_KEY && env.LEMONSQUEEZY_STORE_ID
    ? {
        apiKey: env.LEMONSQUEEZY_API_KEY,
        storeId: env.LEMONSQUEEZY_STORE_ID,
        variantOneTime: env.LEMONSQUEEZY_VARIANT_ONE_TIME || '',
        variantMonthly: env.LEMONSQUEEZY_VARIANT_MONTHLY || '',
        webhookSecret: env.LEMONSQUEEZY_WEBHOOK_SECRET || '',
        testMode: env.LEMONSQUEEZY_TEST_MODE !== '0',
      }
    : null;
  const provider = (env.MARKET_PAYMENT_PROVIDER || (lemon ? 'lemonsqueezy' : mock ? 'mock' : 'none')).toLowerCase();
  const fee = Number(env.MARKET_FEE_PERCENT);
  return {
    mock,
    supabase,
    adminEmails: [...list(env.ADMIN_EMAILS), ...(mock ? [MOCK_ADMIN_EMAIL] : [])],
    siteUrl: (env.SITE_URL || '').replace(/\/$/, ''),
    payments: { provider, lemon },
    feePercent: Number.isFinite(fee) && fee >= 0 && fee <= 100 && env.MARKET_FEE_PERCENT !== '' ? fee : DEFAULT_FEE_PERCENT,
    /** Signs mock session cookies and mock webhooks. A random value per server start is fine for local tests. */
    mockSecret: env.MOCK_SESSION_SECRET || processSecret(),
  };
}
export type MarketConfig = ReturnType<typeof marketConfig>;

/** What the browser may know: no keys, no secrets. */
export function publicConfig() {
  const c = marketConfig();
  return {
    authMode: c.supabase ? 'google' : c.mock ? 'mock' : 'none',
    payments: c.payments.provider,
    feePercent: c.feePercent,
  } as const;
}

const g = globalThis as unknown as { __marketSecret?: string };
function processSecret() {
  if (!g.__marketSecret) {
    const b = new Uint8Array(32);
    crypto.getRandomValues(b);
    g.__marketSecret = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  }
  return g.__marketSecret;
}

export function siteOrigin(request: Request) {
  return marketConfig().siteUrl || new URL(request.url).origin;
}
