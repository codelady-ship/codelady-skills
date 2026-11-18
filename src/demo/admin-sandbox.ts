// Static demo only: an in-browser sandbox for the admin page (GitHub Pages has no server).
// Sample marketplace data lives in this tab's sessionStorage (or memory if storage is blocked,
// e.g. in a third-party iframe) and resets when the tab closes. Nothing is sent anywhere,
// so the demo admin cannot touch real data. The real admin API (src/app/api/market/admin)
// keeps checking ADMIN_EMAILS on the server and is not part of this build.
import type { Locale } from '@/i18n/config';
import type { Grant, Payout, Pricing, Profile, Sale, SkillRow, SkillStatus } from '@/lib/market/types';

export const DEMO_ADMIN_EMAIL = 'admin@mock.test';

type AdminData = {
  users: (Profile & { purchases: number; trials: number })[];
  skills: (SkillRow & { creator_email: string })[];
  builtin: { slug: string; name: string; pricing: Pricing; price_cents: number; trial_days: number }[];
  sales: (Sale & { skill_name: string; buyer_email: string; creator_email: string })[];
  grants: (Grant & { email: string; skill_name: string | null })[];
  payouts: (Payout & { email: string })[];
  balances: { creator_id: string; email: string; net: number; paid: number; balance: number }[];
  grantable: { id: string; name: string }[];
};

const KEY = 'codelady-demo-admin';
let memory: AdminData | null = null;

const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;
const day = (d: number) => new Date(Date.UTC(2026, 10, 17) - d * 86400000).toISOString();

const U = { buyer: id(1), creator: id(2), creator2: id(3), student: id(4) };
const S = { hooks: id(11), ielts: id(12), cv: id(13), quiz: id(14) };

function seed(lang: Locale): AdminData {
  const az = lang === 'az';
  const t = (a: string, e: string) => (az ? a : e);
  const users = [
    { id: U.buyer, email: 'buyer@mock.test', display_name: 'Demo buyer', created_at: day(20), purchases: 2, trials: 1 },
    { id: U.creator, email: 'creator@mock.test', display_name: 'Demo creator', created_at: day(30), purchases: 0, trials: 0 },
    { id: U.creator2, email: 'teacher@mock.test', display_name: 'Demo teacher', created_at: day(12), purchases: 1, trials: 0 },
    { id: U.student, email: 'student@mock.test', display_name: null, created_at: day(3), purchases: 0, trials: 2 },
  ];
  const skill = (sid: string, creator: string, email: string, name: string, tagline: string, pricing: Pricing, cents: number, trial: number, status: SkillStatus, age: number) => ({
    id: sid, builtin_slug: null, creator_id: creator, creator_name: null, name, tagline, description: '', input_label: '',
    pricing, price_cents: cents, trial_days: trial, status, source_url: null, created_at: day(age), updated_at: day(age), creator_email: email,
  });
  const skills = [
    skill(S.hooks, U.creator, 'creator@mock.test', t('Reels üçün ilk cümlə', 'Reel hooks'), t('Videonun ilk 3 saniyəsi üçün 10 variant.', 'Ten opening lines for a video.'), 'free', 0, 0, 'approved', 25),
    skill(S.ielts, U.creator, 'creator@mock.test', t('IELTS yazı məşqçisi', 'IELTS writing coach'), t('Essay-ni yoxlayır və bal təxmin edir.', 'Checks an essay and estimates a band.'), 'monthly', 300, 7, 'approved', 22),
    skill(S.cv, U.creator2, 'teacher@mock.test', t('CV-ni ingiliscəyə uyğunlaşdır', 'CV to English'), t('CV-ni beynəlxalq formata salır.', 'Turns a CV into an international format.'), 'one_time', 400, 3, 'pending', 2),
    skill(S.quiz, U.creator2, 'teacher@mock.test', t('Dərs üçün test', 'Lesson quiz'), t('Mövzudan 10 suallıq test.', 'A 10-question quiz from a topic.'), 'one_time', 200, 0, 'hidden', 9),
  ];
  const builtin = [
    { slug: 'xaricde-tehsil', name: t('Xaricdə təhsil planı', 'Study abroad plan'), pricing: 'one_time' as Pricing, price_cents: 700, trial_days: 3 },
    { slug: 'viza-ve-yol', name: t('Viza və yol', 'Visa and travel'), pricing: 'one_time' as Pricing, price_cents: 500, trial_days: 3 },
    { slug: 'is-muracieti', name: t('İş müraciəti', 'Job application'), pricing: 'one_time' as Pricing, price_cents: 500, trial_days: 3 },
  ];
  const sale = (n: number, sid: string, name: string, buyer: string, buyerEmail: string, creator: string | null, creatorEmail: string, gross: number, age: number, refunded = false) => {
    const fee = creator ? Math.round(gross * 0.2) : 0;
    return {
      id: id(100 + n), skill_id: sid, creator_id: creator, buyer_id: buyer, kind: 'one_time' as const, provider: 'mock', provider_ref: `demo-${n}`,
      gross_cents: gross, fee_cents: fee, net_cents: gross - fee, refunded, created_at: day(age),
      skill_name: name, buyer_email: buyerEmail, creator_email: creatorEmail,
    };
  };
  const sales = [
    sale(1, S.ielts, skills[1].name, U.buyer, 'buyer@mock.test', U.creator, 'creator@mock.test', 300, 15),
    sale(2, S.ielts, skills[1].name, U.creator2, 'teacher@mock.test', U.creator, 'creator@mock.test', 300, 8),
    sale(3, id(21), builtin[0].name, U.buyer, 'buyer@mock.test', null, '', 700, 6),
    sale(4, S.ielts, skills[1].name, U.student, 'student@mock.test', U.creator, 'creator@mock.test', 300, 4, true),
  ];
  const grants = [
    { id: id(201), user_id: U.student, skill_id: null, expires_at: day(-30), revoked_at: null, note: t('Tələbə üçün pulsuz giriş', 'Free access for a student'), created_by: DEMO_ADMIN_EMAIL, created_at: day(3), email: 'student@mock.test', skill_name: null },
  ];
  const payouts = [
    { id: id(301), creator_id: U.creator, amount_cents: 200, note: t('Oktyabr', 'October'), created_by: DEMO_ADMIN_EMAIL, created_at: day(10), email: 'creator@mock.test' },
  ];
  const data: AdminData = { users, skills, builtin, sales, grants, payouts, balances: [], grantable: [] };
  return derive(data);
}

/** Balances and the grant list follow from the rows, as on the server. */
function derive(d: AdminData): AdminData {
  const b = new Map<string, { creator_id: string; email: string; net: number; paid: number }>();
  const email = Object.fromEntries(d.users.map((u) => [u.id, u.email]));
  for (const s of d.sales) {
    if (!s.creator_id || s.refunded) continue;
    const r = b.get(s.creator_id) || { creator_id: s.creator_id, email: email[s.creator_id] || '', net: 0, paid: 0 };
    r.net += s.net_cents;
    b.set(s.creator_id, r);
  }
  for (const p of d.payouts) {
    const r = b.get(p.creator_id) || { creator_id: p.creator_id, email: email[p.creator_id] || '', net: 0, paid: 0 };
    r.paid += p.amount_cents;
    b.set(p.creator_id, r);
  }
  return {
    ...d,
    balances: [...b.values()].map((r) => ({ ...r, balance: r.net - r.paid })),
    grantable: d.skills.filter((s) => s.pricing !== 'free').map((s) => ({ id: s.id, name: s.name })),
  };
}

function load(lang: Locale): AdminData {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as AdminData;
  } catch {}
  return (memory ??= seed(lang));
}
function save(d: AdminData) {
  memory = d;
  try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch {}
}
export function resetAdminSandbox() {
  memory = null;
  try { sessionStorage.removeItem(KEY); } catch {}
}

type Result = { status: number; body: Record<string, unknown> };
const ok = (body: Record<string, unknown> = {}): Result => ({ status: 200, body });
const bad = (error: string, status = 400): Result => ({ status, body: { error } });
const nowIso = () => new Date().toISOString();
const text = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export function adminGet(lang: Locale): Result {
  const d = load(lang);
  save(d);
  return ok(d as unknown as Record<string, unknown>);
}

/** Same actions and checks as POST /api/market/admin, applied to the sandbox copy. */
export function adminPost(lang: Locale, b: Record<string, unknown>): Result {
  const d = load(lang);
  switch (b.action) {
    case 'status': {
      const s = d.skills.find((x) => x.id === b.skillId);
      if (!s || !['pending', 'approved', 'hidden'].includes(String(b.status))) return bad('bad_input');
      s.status = b.status as SkillStatus;
      s.updated_at = nowIso();
      break;
    }
    case 'price': {
      const pricing = b.pricing as Pricing;
      if (!['free', 'one_time', 'monthly'].includes(pricing)) return bad('bad_input');
      const p = String(b.price ?? '').trim().replace(',', '.');
      const cents = pricing === 'free' ? 0 : /^\d{1,4}(\.\d{1,2})?$/.test(p) ? Math.round(Number(p) * 100) : 0;
      if (pricing !== 'free' && cents <= 0) return bad('bad_price');
      const trial = pricing === 'free' ? 0 : Number(b.trial_days) || 0;
      if (![0, 3, 7, 14].includes(trial)) return bad('bad_input');
      const row = typeof b.builtinSlug === 'string' ? d.builtin.find((x) => x.slug === b.builtinSlug) : d.skills.find((x) => x.id === b.skillId);
      if (!row) return bad('not_found', 404);
      Object.assign(row, { pricing, price_cents: cents, trial_days: trial });
      break;
    }
    case 'grant': {
      const u = d.users.find((x) => x.email === text(b.email, 200).toLowerCase());
      if (!u) return bad('no_user', 404);
      const skillId = !b.skillId || b.skillId === 'all' ? null : String(b.skillId);
      const s = skillId ? d.skills.find((x) => x.id === skillId) : null;
      if (skillId && !s) return bad('not_found', 404);
      const exp = text(b.expires, 30);
      const expires_at = exp ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(exp) ? `${exp}T23:59:59Z` : exp) : null;
      if (expires_at && Number.isNaN(expires_at.getTime())) return bad('bad_input');
      d.grants.unshift({
        id: id(400 + d.grants.length), user_id: u.id, skill_id: skillId, expires_at: expires_at?.toISOString() || null, revoked_at: null,
        note: text(b.note, 300) || null, created_by: DEMO_ADMIN_EMAIL, created_at: nowIso(), email: u.email, skill_name: s?.name || null,
      });
      break;
    }
    case 'revoke': {
      const g = d.grants.find((x) => x.id === b.grantId);
      if (!g) return bad('not_found', 404);
      g.revoked_at = nowIso();
      break;
    }
    case 'payout': {
      const u = d.users.find((x) => x.id === b.creatorId);
      if (!u) return bad('not_found', 404);
      const s = String(b.amount ?? '').trim().replace(',', '.');
      const cents = /^\d{1,6}(\.\d{1,2})?$/.test(s) ? Math.round(Number(s) * 100) : 0;
      if (cents <= 0) return bad('bad_input');
      d.payouts.unshift({ id: id(500 + d.payouts.length), creator_id: u.id, amount_cents: cents, note: text(b.note, 300) || null, created_by: DEMO_ADMIN_EMAIL, created_at: nowIso(), email: u.email });
      break;
    }
    default:
      return bad('bad_input');
  }
  save(derive(d));
  return ok();
}
