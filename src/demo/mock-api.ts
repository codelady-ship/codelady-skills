// Static demo (GitHub Pages has no server): answers the site's own /api/* calls in the browser.
// Everything here is sample data. Nothing is sent anywhere and no keys are needed.
import { hasLocale, DEFAULT_LOCALE, type Locale } from '@/i18n/config';
import { buildLibrary } from '@/lib/library-build';
import type { LibrarySkill } from '@/lib/library-types';
import type { AccessInfo, SkillRow } from '@/lib/market/types';
import { demoAnswer } from './answers';

type Json = Record<string, unknown>;
const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pageLang = (): Locale => {
  const l = document.documentElement.lang;
  return hasLocale(l) ? l : DEFAULT_LOCALE;
};

// ---------- demo catalogue (names, one-line descriptions, prices only) ----------
const NOW = '2026-11-17T00:00:00.000Z';
type Demo = { id: string; slug: string | null; az: [string, string]; en: [string, string]; pricing: SkillRow['pricing']; cents: number; trial: number; creator: string | null };
const CATALOGUE: Demo[] = [
  { id: 'demo-study-abroad', slug: 'xaricde-tehsil', pricing: 'one_time', cents: 700, trial: 3, creator: null,
    az: ['Xaricdə təhsil planı', 'Proqramlar, son tarixlər və sənədlər bir planda.'],
    en: ['Study abroad plan', 'Programmes, deadlines and documents in one plan.'] },
  { id: 'demo-visa-travel', slug: 'viza-ve-yol', pricing: 'one_time', cents: 500, trial: 3, creator: null,
    az: ['Viza və yol', 'Viza sənədləri, müsahibə və ilk həftə üçün hazırlıq.'],
    en: ['Visa and travel', 'Visa documents, interview practice and your first week.'] },
  { id: 'demo-job-application', slug: 'is-muracieti', pricing: 'one_time', cents: 500, trial: 3, creator: null,
    az: ['İş müraciəti', 'Vakansiyaya uyğunluq, CV qeydləri və müraciət məktubu.'],
    en: ['Job application', 'Vacancy match, CV notes and a cover letter.'] },
  { id: 'demo-reel-hooks', slug: null, pricing: 'free', cents: 0, trial: 0, creator: 'Demo creator',
    az: ['Reels üçün ilk cümlə', 'Videonun ilk 3 saniyəsi üçün 10 cümlə variantı.'],
    en: ['Reel hooks', 'Ten opening lines for the first 3 seconds of a video.'] },
  { id: 'demo-ielts-coach', slug: null, pricing: 'monthly', cents: 300, trial: 7, creator: 'Demo creator',
    az: ['IELTS yazı məşqçisi', 'Essay-ni yoxlayır, bal təxmini və düzəlişlər verir.'],
    en: ['IELTS writing coach', 'Checks your essay, estimates a band and suggests fixes.'] },
];

function row(d: Demo, lang: Locale): SkillRow {
  const [name, tagline] = lang === 'az' ? d.az : d.en;
  return {
    id: d.id, builtin_slug: d.slug, creator_id: d.creator ? 'demo-creator' : null, creator_name: d.creator,
    name, tagline, description: '', input_label: '', pricing: d.pricing, price_cents: d.cents,
    trial_days: d.trial, status: 'approved', source_url: null, created_at: NOW, updated_at: NOW,
  };
}

// ---------- demo account, kept in this tab only ----------
type State = { user: { id: string; email: string; isAdmin: boolean } | null; owned: Record<string, { kind: 'purchase' | 'trial'; date: string; until: string | null }> };
const KEY = 'codelady-demo-market';
function load(): State {
  try { return JSON.parse(sessionStorage.getItem(KEY) || '') as State; } catch { return { user: null, owned: {} }; }
}
function save(s: State) { try { sessionStorage.setItem(KEY, JSON.stringify(s)); } catch {} }

function access(d: Demo, s: State): AccessInfo {
  if (d.pricing === 'free') return { allowed: true, via: 'free' };
  if (!s.user) return { allowed: false, reason: 'login', trialAvailable: d.trial > 0 };
  const o = s.owned[d.id];
  if (o) return { allowed: true, via: o.kind, until: o.until };
  return { allowed: false, trialAvailable: d.trial > 0 };
}

// ---------- the Library (open skills from public GitHub repos), loaded only when needed ----------
let library: Promise<LibrarySkill[]> | null = null;
const getLibrary = () => (library ??= Promise.all([import('@/skills/curated.json'), import('@/skills/catalog.json')])
  .then(([c, k]) => buildLibrary((c.default ?? c) as never, (k.default ?? k) as never)));

// ---------- a quiet tone in place of speech (same idea as the server's mock TTS) ----------
function toneWav(text: string, male: boolean): ArrayBuffer {
  const rate = 24000;
  const seconds = Math.min(12, Math.max(0.6, text.length / 16));
  const n = Math.floor(rate * seconds);
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
  v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, n * 2, true);
  const words = text.split(/\s+/).filter(Boolean).length || 1;
  const per = n / words;
  const base = male ? 140 : 230;
  for (let i = 0; i < n; i++) {
    const w = Math.floor(i / per);
    const pos = (i % per) / per;
    const env = pos < 0.8 ? Math.sin((Math.PI * pos) / 0.8) : 0;
    const hz = base * (1 + 0.08 * Math.sin(w * 1.7));
    v.setInt16(44 + i * 2, Math.round(Math.sin((2 * Math.PI * hz * i) / rate) * env * 0.18 * 32767), true);
  }
  return buf;
}

const firstValue = (values: unknown) =>
  Object.values((values as Record<string, string>) || {}).map(String).find((x) => x.trim()) || '';

// ---------- router ----------
async function handle(path: string, method: string, body: Json): Promise<Response> {
  const lang = hasLocale(String(body.lang)) ? (body.lang as Locale) : pageLang();

  if (path.startsWith('run/')) {
    await wait(900);
    return json(demoAnswer(path.slice(4), lang, firstValue(body.values)));
  }
  if (path === 'run-custom') { await wait(900); return json(demoAnswer('', lang, firstValue(body.values))); }
  if (path === 'tts') {
    await wait(600);
    return new Response(toneWav(String(body.text || ''), body.gender === 'm'), {
      headers: { 'Content-Type': 'audio/wav', 'X-Engine': 'mock', 'X-Audio-Format': 'wav' },
    });
  }
  if (path === 'library') return json(await getLibrary());
  if (path === 'search') return json({ keywords: [] });
  if (path === 'translate') return json({});
  if (path === 'skill-import') {
    return json({
      error: 'failed',
      message: lang === 'az'
        ? 'Demo versiyada GitHub-dan skill oxumaq üçün server yoxdur. Tam versiyanı öz kompüterində işə sal (README).'
        : 'The demo has no server to read skills from GitHub. Run the full version locally (see the README).',
    }, 501);
  }

  if (path.startsWith('market/')) return market(path.slice(7), method, body, lang);
  return json({ error: 'not_found' }, 404);
}

async function market(path: string, method: string, body: Json, lang: Locale): Promise<Response> {
  const s = load();
  if (path === 'me') return json({ user: s.user, config: { authMode: 'mock', payments: 'mock', feePercent: 20 } });
  if (path === 'auth/mock') {
    const email = String(body.email || '').trim().toLowerCase() || 'buyer@mock.test';
    save({ ...s, user: { id: `demo-${email}`, email, isAdmin: false } });
    return json({ ok: true });
  }
  if (path === 'auth/signout') { save({ user: null, owned: {} }); return json({ ok: true }); }
  if (path === 'rates') return json({ suggested: lang === 'az' ? 'AZN' : 'USD', rates: { USD: 1, AZN: 1.7, EUR: 0.92, TRY: 41, RUB: 80, GBP: 0.78 } });

  if (path === 'skills' && method === 'GET') return json({ skills: CATALOGUE.map((d) => row(d, lang)) });
  if (path === 'skills') return json({ error: 'failed' }, 501); // publishing needs the real server
  if (path.startsWith('skills/')) {
    const id = decodeURIComponent(path.slice(7));
    const d = CATALOGUE.find((x) => x.id === id);
    // Built-in panels stay open in the demo; prices and the buy/trial flow are shown in the Market.
    if (!d) return id.startsWith('builtin:') ? json({ skill: null, access: { allowed: true, via: 'free' } }) : json({ error: 'not_found' }, 404);
    return json({ skill: row(d, lang), access: access(d, s) });
  }
  if (path === 'checkout' || path === 'trial') {
    if (!s.user) return json({ error: 'login' }, 401);
    const d = CATALOGUE.find((x) => x.id === body.skillId);
    if (!d) return json({ error: 'not_found' }, 404);
    const until = path === 'trial' ? new Date(Date.now() + d.trial * 86400000).toISOString() : null;
    s.owned[d.id] = { kind: path === 'trial' ? 'trial' : 'purchase', date: new Date().toISOString(), until };
    save(s);
    return json({});
  }
  if (path.startsWith('run/')) {
    await wait(900);
    const d = CATALOGUE.find((x) => x.id === decodeURIComponent(path.slice(4)));
    return json(demoAnswer(d?.slug || '', lang, firstValue(body.values)));
  }
  if (path === 'purchases') {
    const rows = Object.entries(s.owned).map(([id, o]) => ({ kind: o.kind, skill_id: id, date: o.date, until: o.until, status: 'active' }));
    const skills = Object.fromEntries(CATALOGUE.map((d) => [d.id, { name: row(d, lang).name, builtin_slug: d.slug }]));
    return json({ rows, skills });
  }
  if (path === 'earnings') {
    if (!s.user) return json({ error: 'login' }, 401);
    return json({ feePercent: 20, totals: { gross: 0, fee: 0, net: 0, paid: 0, balance: 0 }, skills: [], sales: [], payouts: [] });
  }
  return json({ error: 'forbidden' }, 403);
}

/** Routes fetch('/api/…') to the handlers above; every other request goes out unchanged. */
export function installDemoApi() {
  const w = window as Window & { __demoApi?: boolean };
  if (w.__demoApi) return;
  w.__demoApi = true;
  const real = window.fetch.bind(window);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    const u = new URL(url, location.href);
    if (u.origin !== location.origin || !u.pathname.startsWith('/api/')) return real(input, init);
    let body: Json = {};
    try { if (typeof init?.body === 'string') body = JSON.parse(init.body); } catch {}
    return handle(u.pathname.slice(5), (init?.method || 'GET').toUpperCase(), body);
  };
}
