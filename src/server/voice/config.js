// Reads configuration from environment variables. No secrets are hardcoded.
// `env` is process.env on Node/Vercel/Netlify and context.env on Cloudflare.

const num = (v, d) => (v === undefined || v === '' || isNaN(Number(v)) ? d : Number(v));
const list = (v) => String(v || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

export function getConfig(env = {}) {
  const supabase = Boolean(env.SUPABASE_URL && env.SUPABASE_ANON_KEY && env.SUPABASE_SERVICE_ROLE_KEY);
  const builtin = env.TTS_PROVIDER || (env.GEMINI_API_KEY ? 'gemini' : 'mock');
  const clone = env.CLONE_PROVIDER || (env.ELEVENLABS_API_KEY ? 'elevenlabs' : 'mock');
  const payment = env.PAYMENT_PROVIDER || 'mock';
  const devMode = !supabase;

  return {
    devMode,
    siteUrl: (env.SITE_URL || '').replace(/\/$/, ''),
    adminEmails: list(env.ADMIN_EMAILS),
    supabase: supabase ? {
      url: env.SUPABASE_URL.replace(/\/$/, ''),
      anonKey: env.SUPABASE_ANON_KEY,
      serviceKey: env.SUPABASE_SERVICE_ROLE_KEY,
      bucket: env.SUPABASE_BUCKET || 'voice-samples'
    } : null,
    // Mock login is only possible when Supabase is NOT configured (local dev).
    mockAuth: devMode && env.MOCK_AUTH !== '0',
    providers: { builtin, clone, payment, verify: env.VERIFY_PROVIDER || (env.GEMINI_API_KEY ? 'gemini' : 'mock') },
    gemini: {
      apiKey: env.GEMINI_API_KEY || '',
      models: list(env.GEMINI_TTS_MODELS || 'gemini-3.8-flash-lite-tts,gemini-3.8-flash-tts,gemini-3.1-flash-tts-preview,gemini-2.5-flash-preview-tts'),
      sttModel: env.GEMINI_STT_MODEL || 'gemini-2.5-flash'
    },
    eleven: {
      apiKey: env.ELEVENLABS_API_KEY || '',
      model: env.ELEVENLABS_MODEL || 'eleven_v3',
      voiceF: env.ELEVENLABS_VOICE_F || '',
      voiceM: env.ELEVENLABS_VOICE_M || ''
    },
    payment: {
      provider: payment,
      testMode: env.PAYMENT_TEST_MODE !== '0',
      priceAzn: num(env.PLAN_PRICE_AZN, 20),
      webhookSecret: env.PAYMENT_WEBHOOK_SECRET || '',
      env
    },
    // Starting values from research/voice-site-analysis.md §3 (tune after a month of data).
    limits: {
      maxChunkChars: num(env.MAX_CHUNK_CHARS, 1500),
      maxTextChars: num(env.MAX_TEXT_CHARS, 5000),
      anonDailyChars: num(env.ANON_DAILY_CHARS, 1000),
      freeDailyChars: num(env.FREE_DAILY_CHARS, 3000),
      freeMonthlyChars: num(env.FREE_MONTHLY_CHARS, 15000),
      proBuiltinMonthlyChars: num(env.PRO_BUILTIN_MONTHLY_CHARS, 100000),
      proOwnMonthlyChars: num(env.PRO_OWN_MONTHLY_CHARS, 60000),
      freeBudgetCharsMonth: num(env.FREE_BUDGET_CHARS_MONTH, 1500000),
      maxVoicesPerUser: num(env.MAX_VOICES_PER_USER, 1),
      maxSampleBytes: num(env.MAX_SAMPLE_BYTES, 4 * 1024 * 1024),
      maxVoiceAttemptsPerDay: num(env.MAX_VOICE_ATTEMPTS_PER_DAY, 3),
      graceDays: num(env.PLAN_GRACE_DAYS, 3),
      voiceDeleteAfterDays: num(env.VOICE_DELETE_AFTER_DAYS, 30)
    },
    killSwitch: env.KILL_SWITCH === '1',
    turnstile: { siteKey: env.TURNSTILE_SITE_KEY || '', secret: env.TURNSTILE_SECRET || '' },
    priceLabel: { amount: num(env.PLAN_PRICE_AZN, 20), currency: 'AZN', chargeNote: env.PLAN_CHARGE_NOTE || '' },
    consentVersion: env.CONSENT_VERSION || '2026-11-09-draft',
    ipSalt: env.IP_HASH_SALT || 'dev-only-salt-change-me',
    mockSecret: env.MOCK_WEBHOOK_SECRET || 'dev-mock-secret'
  };
}
