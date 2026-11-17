// Codelady Səs API: one Web-standard handler, `handle(request, env)`.
// Host adapters: functions/api/[[path]].js (Cloudflare Pages, primary),
// api/[...path].js (Vercel), netlify/functions/api.mjs (Netlify), scripts/dev-server.mjs (Node).
import { getConfig } from './config.js';
import { memoryDb } from './db/memory.js';
import { supabaseDb } from './db/supabase.js';
import { getProvider } from './tts/index.js';
import { getPayment } from './pay/index.js';
import { PRESETS } from './presets.js';
import { makeChallenge, CONSENT_TEXT, abuseCheck } from './consent.js';
import {
  json, HttpError, errorResponse, readJson, sha256Hex, hmacHex, timingSafeEqual,
  clientIp, dayKey, monthKey, similarity, SECURITY_HEADERS
} from './util.js';

const userCache = new Map(); // token -> { user, exp } (per isolate, 60 s)

/* ------------------------------------------------------------------ */
/* context                                                             */
/* ------------------------------------------------------------------ */
async function makeCtx(request, env) {
  const cfg = getConfig(env);
  const db = cfg.supabase ? supabaseDb(cfg) : memoryDb();
  const ip = clientIp(request);
  const ipHash = (await sha256Hex(cfg.ipSalt + '|' + ip)).slice(0, 32);
  return { request, env, cfg, db, ipHash };
}

async function getUser(ctx) {
  const auth = ctx.request.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!token) return null;
  const hit = userCache.get(token);
  if (hit && hit.exp > Date.now()) return hit.user;
  let user = null;
  if (ctx.cfg.supabase) {
    const res = await fetch(`${ctx.cfg.supabase.url}/auth/v1/user`, {
      headers: { apikey: ctx.cfg.supabase.anonKey, Authorization: `Bearer ${token}` }
    });
    if (res.ok) { const u = await res.json(); user = { id: u.id, email: (u.email || '').toLowerCase() }; }
  } else if (ctx.cfg.mockAuth) {
    user = await ctx.db.sessionUser(token);
  }
  if (!user) return null;
  userCache.set(token, { user, exp: Date.now() + 60e3 });
  if (userCache.size > 5000) userCache.clear();
  return user;
}

async function requireUser(ctx) {
  const user = await getUser(ctx);
  if (!user) throw new HttpError(401, 'login_required', 'Please log in');
  return user;
}

function isAdmin(ctx, user) { return Boolean(user && ctx.cfg.adminEmails.includes(user.email)); }

function isPro(ctx, profile) {
  if (!profile || profile.plan !== 'pro') return false;
  if (!profile.plan_renews_at) return true;
  return new Date(profile.plan_renews_at).getTime() + ctx.cfg.limits.graceDays * 864e5 > Date.now();
}

async function account(ctx, user) {
  if (!user) return { tier: 'anon', profile: null };
  const profile = await ctx.db.ensureProfile(user);
  const tier = isAdmin(ctx, user) ? 'admin' : isPro(ctx, profile) ? 'pro' : 'free';
  return { tier, profile };
}

async function rateLimit(ctx, name, windowSec, max, who) {
  const r = await ctx.db.rateHit(`${name}:${who || ctx.ipHash}`, windowSec, max);
  if (!r.allowed) throw new HttpError(429, 'rate_limited', 'Too many requests. Please slow down.', { retryAfter: r.retryAfter });
}

async function verifyTurnstile(ctx, token) {
  const { secret } = ctx.cfg.turnstile;
  if (!secret) return true; // not configured (local dev)
  if (!token) return false;
  const fd = new FormData();
  fd.append('secret', secret);
  fd.append('response', token);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: fd });
  const data = await res.json().catch(() => ({}));
  return Boolean(data.success);
}

/* Anonymous pass: one Turnstile check per hour instead of one per chunk. */
async function makeAnonPass(ctx) {
  const exp = Date.now() + 3600e3;
  return `${exp}.${(await hmacHex(ctx.cfg.ipSalt, ctx.ipHash + '|' + exp)).slice(0, 32)}`;
}
async function checkAnonPass(ctx) {
  if (!ctx.cfg.turnstile.secret) return true;
  const pass = ctx.request.headers.get('x-anon-pass') || '';
  const [exp, sig] = pass.split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return timingSafeEqual(sig, (await hmacHex(ctx.cfg.ipSalt, ctx.ipHash + '|' + exp)).slice(0, 32));
}

/* Quota buckets per tier (see config.limits). */
function buckets(ctx, tier, user, own) {
  const L = ctx.cfg.limits, d = dayKey(), m = monthKey();
  if (tier === 'admin') return [];
  if (own) return [{ key: `own:${user.id}`, period: m, limit: L.proOwnMonthlyChars, label: 'month' }];
  if (tier === 'pro') return [{ key: `pro:${user.id}`, period: m, limit: L.proBuiltinMonthlyChars, label: 'month' }];
  const global = { key: 'global:free', period: m, limit: L.freeBudgetCharsMonth, label: 'budget', global: true };
  if (tier === 'free') return [
    { key: `u:${user.id}`, period: d, limit: L.freeDailyChars, label: 'day' },
    { key: `um:${user.id}`, period: m, limit: L.freeMonthlyChars, label: 'month' }, global];
  return [{ key: `anon:${ctx.ipHash}`, period: d, limit: L.anonDailyChars, label: 'day' }, global];
}

async function reserve(ctx, list, chars) {
  const done = [];
  for (const b of list) {
    const total = await ctx.db.addUsage(b.key, b.period, chars);
    done.push(b);
    if (total > b.limit) {
      await refund(ctx, done, chars);
      if (b.global) throw new HttpError(503, 'free_budget', 'Free voices are paused for this month. Log in with Pro or use your own Gemini key.');
      throw new HttpError(429, 'quota_exceeded', 'Your quota is used up', { quota: { limit: b.limit, used: total - chars, period: b.label } });
    }
  }
  return done;
}
async function refund(ctx, list, chars) {
  for (const b of list) await ctx.db.addUsage(b.key, b.period, -chars);
}

async function usageSummary(ctx, tier, user) {
  const out = {};
  for (const b of buckets(ctx, tier, user, false)) {
    if (b.global) continue;
    out[b.label] = { used: await ctx.db.getUsage(b.key, b.period), limit: b.limit };
  }
  if (tier === 'pro' || tier === 'admin') {
    const own = buckets(ctx, 'pro', user, true)[0];
    out.own = { used: await ctx.db.getUsage(own.key, own.period), limit: tier === 'admin' ? null : own.limit };
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* routes                                                              */
/* ------------------------------------------------------------------ */
const routes = [];
const route = (method, pattern, fn) => routes.push({ method, re: new RegExp('^' + pattern.replace(/:(\w+)/g, '(?<$1>[^/]+)') + '$'), fn });

route('GET', '/api/health', async () => json({ ok: true }));

route('GET', '/api/config', async (ctx) => {
  const c = ctx.cfg;
  return json({
    authMode: c.supabase ? 'supabase' : (c.mockAuth ? 'mock' : 'none'),
    supabaseUrl: c.supabase?.url || null,
    supabaseAnonKey: c.supabase?.anonKey || null, // public by design (RLS protects data)
    turnstileSiteKey: c.turnstile.siteKey || null,
    providers: { builtin: c.providers.builtin, clone: c.providers.clone, payment: c.providers.payment },
    mock: { tts: c.providers.builtin === 'mock', clone: c.providers.clone === 'mock', payment: c.providers.payment === 'mock' },
    limits: {
      maxChunkChars: c.limits.maxChunkChars, maxTextChars: c.limits.maxTextChars,
      anonDailyChars: c.limits.anonDailyChars, freeDailyChars: c.limits.freeDailyChars, freeMonthlyChars: c.limits.freeMonthlyChars,
      proBuiltinMonthlyChars: c.limits.proBuiltinMonthlyChars, proOwnMonthlyChars: c.limits.proOwnMonthlyChars
    },
    price: c.priceLabel,
    killSwitch: c.killSwitch,
    consentVersion: c.consentVersion
  });
});

route('POST', '/api/auth/mock', async (ctx) => {
  if (!ctx.cfg.mockAuth) throw new HttpError(404, 'not_found', 'Not found');
  await rateLimit(ctx, 'mockauth', 60, 20);
  const { email } = await readJson(ctx.request);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email || '')) throw new HttpError(400, 'bad_email', 'Invalid e-mail');
  return json(await ctx.db.createSession(email));
});

route('POST', '/api/anon-pass', async (ctx) => {
  await rateLimit(ctx, 'anonpass', 3600, 30);
  const { token } = await readJson(ctx.request);
  if (!(await verifyTurnstile(ctx, token))) throw new HttpError(403, 'captcha_failed', 'Bot check failed');
  return json({ pass: await makeAnonPass(ctx) });
});

route('GET', '/api/me', async (ctx) => {
  const user = await requireUser(ctx);
  const { tier, profile } = await account(ctx, user);
  let voices = await ctx.db.listVoices(user.id);
  // Lazy clean-up: voices of lapsed subscribers are deleted after N days.
  if (tier === 'free' && voices.length && profile.plan_ended_at &&
      Date.now() - new Date(profile.plan_ended_at).getTime() > ctx.cfg.limits.voiceDeleteAfterDays * 864e5) {
    for (const v of voices) await deleteVoiceEverywhere(ctx, v);
    voices = [];
  }
  return json({
    user: { id: user.id, email: user.email }, tier,
    plan: { plan: profile.plan, status: profile.plan_status, renewsAt: profile.plan_renews_at, portalUrl: profile.pay_portal_url || null, provider: profile.pay_provider || null },
    usage: await usageSummary(ctx, tier, user),
    voices: voices.map((v) => ({ id: v.id, name: v.name, status: v.status, created_at: v.created_at }))
  });
});

route('DELETE', '/api/me', async (ctx) => {
  const user = await requireUser(ctx);
  await rateLimit(ctx, 'delme', 3600, 5, user.id);
  const { profile } = await account(ctx, user);
  for (const v of await ctx.db.listVoices(user.id)) await deleteVoiceEverywhere(ctx, v);
  if (profile?.pay_subscription_id) { try { await getPayment(ctx.cfg, ctx.db).cancel({ profile }); } catch (e) { console.error('cancel on delete failed', e); } }
  await ctx.db.deleteProfile(user.id);
  if (ctx.db.deleteSessions) await ctx.db.deleteSessions(user.id);
  for (const [t, v] of userCache) if (v.user.id === user.id) userCache.delete(t);
  return json({ deleted: true });
});

route('POST', '/api/tts', async (ctx) => {
  const body = await readJson(ctx.request);
  const text = String(body.text || '').trim();
  const presetId = PRESETS[body.presetId] ? body.presetId : 'semimi';
  const gender = body.gender === 'm' ? 'm' : 'f';
  const speed = Math.min(1.2, Math.max(0.8, Number(body.speed) || 1));
  const emphasis = Array.isArray(body.emphasis) ? body.emphasis.map(String).slice(0, 6).map((s) => s.slice(0, 40)) : [];
  if (!text) throw new HttpError(400, 'empty_text', 'Text is empty');
  if (text.length > ctx.cfg.limits.maxChunkChars) throw new HttpError(413, 'chunk_too_long', 'Text part is too long', { maxChunkChars: ctx.cfg.limits.maxChunkChars });

  const user = await getUser(ctx);
  const { tier } = await account(ctx, user);
  await rateLimit(ctx, 'tts', 60, tier === 'anon' ? 10 : 30, user ? user.id : null);
  if (ctx.cfg.killSwitch && tier !== 'admin') throw new HttpError(503, 'paused', 'Voice generation is paused for maintenance');
  if (tier === 'anon' && !(await checkAnonPass(ctx))) throw new HttpError(403, 'captcha_required', 'Bot check required');

  let voice = null;
  if (body.voiceId) {
    if (tier !== 'pro' && tier !== 'admin') throw new HttpError(402, 'pro_required', 'Your own voice needs the Pro plan');
    voice = await ctx.db.getVoice(String(body.voiceId));
    if (!voice || (voice.user_id !== user.id && tier !== 'admin')) throw new HttpError(404, 'voice_not_found', 'Voice not found');
    if (voice.status !== 'active') throw new HttpError(403, 'voice_suspended', 'This voice is suspended');
    if (abuseCheck(text)) {
      await ctx.db.logGeneration({ user_id: user.id, tier, voice_kind: 'own', voice_id: voice.id, engine: 'blocked', chars: 0, text_sha256: await sha256Hex(text) });
      throw new HttpError(403, 'blocked_content', 'This text looks like a scam pattern and cannot be read with a cloned voice');
    }
  }

  const reserved = await reserve(ctx, buckets(ctx, tier, user, Boolean(voice)), text.length);
  let out;
  try {
    if (voice) out = await getProvider(voice.provider, ctx.cfg).synthesizeWithVoice({ text, providerVoiceId: voice.provider_voice_id, presetId, speed });
    else out = await getProvider(ctx.cfg.providers.builtin, ctx.cfg).synthesize({ text, presetId, gender, speed, emphasis });
  } catch (e) {
    await refund(ctx, reserved, text.length);
    throw e;
  }
  await ctx.db.logGeneration({
    user_id: user ? user.id : null, tier, voice_kind: voice ? 'own' : 'builtin', voice_id: voice ? voice.id : null,
    engine: voice ? voice.provider : ctx.cfg.providers.builtin, model: out.model || null, chars: text.length, text_sha256: await sha256Hex(text)
  });
  return new Response(out.stream || out.bytes, {
    status: 200,
    headers: { ...SECURITY_HEADERS, 'Content-Type': out.mime, 'X-Audio-Format': out.format, 'X-Engine': voice ? voice.provider : ctx.cfg.providers.builtin, 'X-Chars': String(text.length) }
  });
});

route('POST', '/api/voices/challenge', async (ctx) => {
  const user = await requireUser(ctx);
  const { tier } = await account(ctx, user);
  if (tier !== 'pro' && tier !== 'admin') throw new HttpError(402, 'pro_required', 'Your own voice needs the Pro plan');
  await rateLimit(ctx, 'challenge', 3600, 10, user.id);
  const c = await ctx.db.createChallenge(user.id, makeChallenge());
  return json({ challengeId: c.id, sentence: c.sentence, expiresInSec: 900, consentText: CONSENT_TEXT, consentVersion: ctx.cfg.consentVersion });
});

route('POST', '/api/voices', async (ctx) => {
  const user = await requireUser(ctx);
  const { tier } = await account(ctx, user);
  if (tier !== 'pro' && tier !== 'admin') throw new HttpError(402, 'pro_required', 'Your own voice needs the Pro plan');
  await rateLimit(ctx, 'voicecreate', 86400, ctx.cfg.limits.maxVoiceAttemptsPerDay, user.id);
  const existing = await ctx.db.listVoices(user.id);
  if (tier !== 'admin' && existing.length >= ctx.cfg.limits.maxVoicesPerUser) throw new HttpError(409, 'voice_limit', 'You already have a voice. Delete it first.');
  if (ctx.cfg.providers.clone !== 'mock' && ctx.cfg.providers.verify === 'mock') throw new HttpError(503, 'verify_not_configured', 'Consent verification is not configured');

  const len = Number(ctx.request.headers.get('content-length') || 0);
  if (len > ctx.cfg.limits.maxSampleBytes * 2 + 64 * 1024) throw new HttpError(413, 'too_large', 'Recordings are too large');
  const form = await ctx.request.formData();
  const checks = { own_voice: form.get('own_voice') === 'on', adult: form.get('adult') === 'on', biometric: form.get('biometric') === 'on', no_fraud: form.get('no_fraud') === 'on' };
  if (!Object.values(checks).every(Boolean)) throw new HttpError(400, 'consent_required', 'All consent boxes are required');
  const name = String(form.get('name') || 'Mənim səsim').slice(0, 40);
  const reference = form.get('reference'), challengeAudio = form.get('challenge_audio');
  for (const f of [reference, challengeAudio]) {
    if (!f || typeof f === 'string') throw new HttpError(400, 'audio_required', 'Both recordings are required');
    if (f.size > ctx.cfg.limits.maxSampleBytes) throw new HttpError(413, 'too_large', 'A recording is too large');
    if (!/^audio\/|^video\/webm/.test(f.type || '')) throw new HttpError(415, 'bad_audio', 'Unsupported audio type');
  }
  const challenge = await ctx.db.takeChallenge(String(form.get('challenge_id') || ''), user.id);
  if (!challenge) throw new HttpError(410, 'challenge_expired', 'The verification sentence expired. Get a new one.');

  const chBytes = new Uint8Array(await challengeAudio.arrayBuffer());
  const transcript = await getProvider(ctx.cfg.providers.verify, ctx.cfg).transcribe({ bytes: chBytes, type: challengeAudio.type });
  let score = null;
  if (ctx.cfg.providers.verify !== 'mock') {
    if (!transcript) throw new HttpError(502, 'verify_failed', 'Could not check the verification recording');
    score = similarity(transcript, challenge.sentence);
  }
  const passed = score === null || score >= 0.6;
  const consent = await ctx.db.logConsent({
    user_id: user.id, consent_text_version: ctx.cfg.consentVersion, consent_text_sha256: await sha256Hex(CONSENT_TEXT.az + '\n' + CONSENT_TEXT.en),
    checkboxes: checks, ip_hash: ctx.ipHash, user_agent: (ctx.request.headers.get('user-agent') || '').slice(0, 200),
    challenge_phrase: challenge.sentence, challenge_passed: passed, challenge_score: score
  });
  if (!passed) throw new HttpError(422, 'challenge_mismatch', 'The recording did not match the sentence. Read it clearly and try again.');

  // Raw audio goes straight to the provider and is never stored by us.
  const provider = ctx.cfg.providers.clone;
  const { providerVoiceId } = await getProvider(provider, ctx.cfg).createVoice({
    name: `cl-${user.id.slice(0, 8)}-${Date.now()}`,
    files: [
      { bytes: new Uint8Array(await reference.arrayBuffer()), type: reference.type, name: reference.name || 'reference.webm' },
      { bytes: chBytes, type: challengeAudio.type, name: 'consent.webm' }
    ]
  });
  const voice = await ctx.db.createVoice({ user_id: user.id, provider, provider_voice_id: providerVoiceId, name, status: 'active' });
  await ctx.db.linkConsentVoice(consent.id, voice.id);
  return json({ voice: { id: voice.id, name: voice.name, status: voice.status, created_at: voice.created_at } }, 201);
});

async function deleteVoiceEverywhere(ctx, v) {
  await getProvider(v.provider, ctx.cfg).deleteVoice(v.provider_voice_id);
  await ctx.db.deleteVoice(v.id);
  await ctx.db.markConsentDeleted(v.id);
}

route('DELETE', '/api/voices/:id', async (ctx, p) => {
  const user = await requireUser(ctx);
  await rateLimit(ctx, 'voicedel', 3600, 20, user.id);
  const v = await ctx.db.getVoice(p.id);
  if (!v || (v.user_id !== user.id && !isAdmin(ctx, user))) throw new HttpError(404, 'voice_not_found', 'Voice not found');
  await deleteVoiceEverywhere(ctx, v);
  return json({ deleted: true });
});

route('POST', '/api/billing/checkout', async (ctx) => {
  const user = await requireUser(ctx);
  await rateLimit(ctx, 'checkout', 3600, 10, user.id);
  const origin = ctx.cfg.siteUrl || new URL(ctx.request.url).origin;
  const r = await getPayment(ctx.cfg, ctx.db).createCheckout({ user, successUrl: `${origin}/hesab.html?paid=1` });
  return json({ url: r.url, testMode: ctx.cfg.payment.testMode });
});

route('POST', '/api/billing/cancel', async (ctx) => {
  const user = await requireUser(ctx);
  await rateLimit(ctx, 'cancel', 3600, 10, user.id);
  const { profile } = await account(ctx, user);
  await getPayment(ctx.cfg, ctx.db).cancel({ profile });
  // State changes only when the provider's webhook arrives.
  return json({ requested: true, portalUrl: profile.pay_portal_url || null });
});

route('POST', '/api/billing/mock/complete', async (ctx) => {
  if (ctx.cfg.providers.payment !== 'mock') throw new HttpError(404, 'not_found', 'Not found');
  const user = await requireUser(ctx);
  const { checkoutId, outcome } = await readJson(ctx.request);
  const pay = getPayment(ctx.cfg, ctx.db);
  if (outcome === 'paid') {
    const chk = await ctx.db.getCheckout(String(checkoutId || ''));
    if (!chk || chk.user_id !== user.id) throw new HttpError(404, 'checkout_not_found', 'Checkout not found');
  }
  const { body, signature } = await pay.buildEvent({ userId: user.id, outcome: outcome === 'paid' ? 'paid' : 'expired' });
  const req = new Request(new URL('/api/webhooks/mock', ctx.request.url), { method: 'POST', headers: { 'x-signature': signature, 'content-type': 'application/json' }, body });
  return handleWebhook({ ...ctx, request: req }, 'mock');
});

async function handleWebhook(ctx, provider) {
  if (provider !== ctx.cfg.providers.payment) throw new HttpError(404, 'not_found', 'Unknown webhook');
  const raw = await ctx.request.text();
  if (raw.length > 256 * 1024) throw new HttpError(413, 'too_large', 'Payload too large');
  const ev = await getPayment(ctx.cfg, ctx.db).verifyWebhook(ctx.request, raw);
  if (ev.ignore) return json({ ok: true, ignored: true });
  if (!ctx.cfg.payment.testMode && ev.testMode) return json({ ok: true, ignored: 'test_event_in_live_mode' });
  const fresh = await ctx.db.recordPaymentEvent(provider, ev.eventId, { user_id: ev.userId, status: ev.status, payload: ev.raw });
  if (!fresh) return json({ ok: true, duplicate: true });
  let profile = ev.userId ? await ctx.db.getProfile(ev.userId) : null;
  if (!profile && ev.subscriptionId) profile = await ctx.db.findProfileBySubscription(provider, ev.subscriptionId);
  if (!profile) return json({ ok: true, warning: 'user_not_found' });
  const patch = ev.active
    ? { plan: 'pro', plan_status: ev.status, plan_renews_at: ev.periodEnd, plan_ended_at: null, pay_provider: provider, pay_subscription_id: ev.subscriptionId, pay_customer_id: ev.customerId, pay_portal_url: ev.portalUrl }
    : { plan: 'free', plan_status: ev.status, plan_ended_at: new Date().toISOString() };
  await ctx.db.updateProfile(profile.id, patch);
  return json({ ok: true, plan: patch.plan });
}
route('POST', '/api/webhooks/:provider', async (ctx, p) => {
  await rateLimit(ctx, 'webhook', 60, 120);
  return handleWebhook(ctx, p.provider);
});

route('POST', '/api/report', async (ctx) => {
  await rateLimit(ctx, 'report', 3600, 5);
  const b = await readJson(ctx.request, 16 * 1024);
  if (!(await verifyTurnstile(ctx, b.turnstileToken))) throw new HttpError(403, 'captcha_failed', 'Bot check failed');
  const reason = String(b.reason || '').slice(0, 40);
  const details = String(b.details || '').slice(0, 4000);
  if (!reason || details.length < 10) throw new HttpError(400, 'details_required', 'Please describe the problem');
  const voiceId = String(b.voiceId || '').trim().slice(0, 64);
  let suspended = false;
  if (/^[0-9a-f-]{36}$/i.test(voiceId)) {
    const v = await ctx.db.getVoice(voiceId);
    if (v) { await ctx.db.updateVoice(v.id, { status: 'suspended' }); suspended = true; }
  }
  await ctx.db.createReport({ reporter_email: String(b.email || '').slice(0, 200) || null, voice_id: suspended ? voiceId : null, reason, details, evidence_url: String(b.url || '').slice(0, 500) || null, status: 'open', ip_hash: ctx.ipHash });
  return json({ ok: true, suspended }, 201);
});

/* admin */
async function requireAdmin(ctx) {
  const user = await requireUser(ctx);
  if (!isAdmin(ctx, user)) throw new HttpError(403, 'admin_only', 'Admins only');
  return user;
}
route('GET', '/api/admin/summary', async (ctx) => {
  await requireAdmin(ctx);
  return json({
    summary: await ctx.db.adminSummary(monthKey()),
    reports: await ctx.db.listReports(50),
    voices: (await ctx.db.listAllVoices(100)).map(({ provider_voice_id, ...v }) => v),
    killSwitch: ctx.cfg.killSwitch
  });
});
route('POST', '/api/admin/grant', async (ctx) => {
  await requireAdmin(ctx);
  const { email, days } = await readJson(ctx.request);
  const p = await ctx.db.findProfileByEmail(String(email || ''));
  if (!p) throw new HttpError(404, 'user_not_found', 'This user has not logged in yet');
  const until = new Date(Date.now() + Math.min(366, Math.max(1, Number(days) || 30)) * 864e5).toISOString();
  await ctx.db.updateProfile(p.id, { plan: 'pro', plan_status: 'gift', plan_renews_at: until, plan_ended_at: null });
  return json({ ok: true, until });
});
route('POST', '/api/admin/voice-status', async (ctx) => {
  await requireAdmin(ctx);
  const { id, status } = await readJson(ctx.request);
  if (!['active', 'suspended'].includes(status)) throw new HttpError(400, 'bad_status', 'Bad status');
  await ctx.db.updateVoice(String(id), { status });
  return json({ ok: true });
});
route('POST', '/api/admin/report-status', async (ctx) => {
  const admin = await requireAdmin(ctx);
  const { id, status } = await readJson(ctx.request);
  if (!['open', 'resolved', 'rejected'].includes(status)) throw new HttpError(400, 'bad_status', 'Bad status');
  await ctx.db.updateReport(String(id), { status, handled_by: admin.email });
  return json({ ok: true });
});

/* ------------------------------------------------------------------ */
export async function handle(request, env = {}) {
  try {
    const url = new URL(request.url);
    let path = url.searchParams.get('__p') ? '/api/' + url.searchParams.get('__p') : url.pathname;
    path = path.replace(/\/+$/, '') || '/';
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: SECURITY_HEADERS });
    // Same-origin API: reject cross-site browser writes (webhooks are server-to-server and send no Origin).
    const origin = request.headers.get('origin');
    if (origin && request.method !== 'GET' && !path.startsWith('/api/webhooks/') && origin !== url.origin) {
      const site = getConfig(env).siteUrl;
      if (!site || origin !== site) return json({ error: 'bad_origin', message: 'Cross-origin request blocked' }, 403);
    }
    const ctx = await makeCtx(request, env);
    for (const r of routes) {
      if (r.method !== request.method) continue;
      const m = r.re.exec(path);
      if (m) return await r.fn(ctx, m.groups || {});
    }
    return json({ error: 'not_found', message: 'Not found' }, 404);
  } catch (e) {
    return errorResponse(e);
  }
}
