import { parseUsd, TRIAL_CHOICES_SET, isUuid } from '@/server/market/validate';
import { fail, ok, readBody, str, withMarket } from '@/server/market/http';
import { forgetBuiltin } from '@/server/market/service';
import { SKILLS, getSkill as getBuiltin } from '@/skills/registry';
import type { Pricing, SkillStatus } from '@/lib/market/types';

// Admin API. withMarket({ user: 'admin' }) checks the signed-in email against ADMIN_EMAILS
// on the server for EVERY request; nothing the browser sends can make someone admin.

/** Everything the admin page shows. */
export async function GET(request: Request) {
  return withMarket(request, { user: 'admin' }, async ({ store }) => {
    const [profiles, skills, all, sales, payouts] = await Promise.all([
      store.listProfiles(), store.listSkills({ includeBuiltin: true }), store.listAll(), store.listSales({ limit: 500 }), store.listPayouts(),
    ]);
    const email = Object.fromEntries(profiles.map((p) => [p.id, p.email]));
    const count = (rows: { user_id: string }[], id: string) => rows.filter((r) => r.user_id === id).length;
    const users = profiles.map((p) => ({
      ...p,
      purchases: count(all.purchases, p.id) + count(all.subscriptions, p.id),
      trials: count(all.trials, p.id),
    }));
    // Creator balances: net of sales (not refunded) minus payouts already recorded.
    const balances = new Map<string, { creator_id: string; email: string; net: number; paid: number }>();
    for (const s of sales) {
      if (!s.creator_id || s.refunded) continue;
      const b = balances.get(s.creator_id) || { creator_id: s.creator_id, email: email[s.creator_id] || s.creator_id, net: 0, paid: 0 };
      b.net += s.net_cents;
      balances.set(s.creator_id, b);
    }
    for (const p of payouts) {
      const b = balances.get(p.creator_id) || { creator_id: p.creator_id, email: email[p.creator_id] || p.creator_id, net: 0, paid: 0 };
      b.paid += p.amount_cents;
      balances.set(p.creator_id, b);
    }
    const names = Object.fromEntries(skills.map((s) => [s.id, s.name]));
    return ok({
      users,
      skills: skills.filter((s) => !s.builtin_slug).map((s) => ({ ...s, creator_email: s.creator_id ? email[s.creator_id] || '' : '' })),
      builtin: SKILLS.filter((s) => s.kind === 'assistant').map((s) => {
        const row = skills.find((r) => r.builtin_slug === s.slug);
        return { slug: s.slug, name: s.name, pricing: row?.pricing || 'free', price_cents: row?.price_cents || 0, trial_days: row?.trial_days || 0 };
      }),
      sales: sales.map((s) => ({ ...s, skill_name: names[s.skill_id] || '', buyer_email: email[s.buyer_id] || '', creator_email: s.creator_id ? email[s.creator_id] || '' : '' })),
      grants: all.grants.map((g) => ({ ...g, email: email[g.user_id] || '', skill_name: g.skill_id ? names[g.skill_id] || g.skill_id : null })),
      payouts: payouts.map((p) => ({ ...p, email: email[p.creator_id] || '' })),
      balances: [...balances.values()].map((b) => ({ ...b, balance: b.net - b.paid })),
      grantable: skills.filter((s) => s.pricing !== 'free').map((s) => ({ id: s.id, name: s.name })),
    });
  });
}

/** One admin action: { action: 'status' | 'price' | 'grant' | 'revoke' | 'payout', … } */
export async function POST(request: Request) {
  return withMarket(request, { user: 'admin', write: true }, async ({ store, user }) => {
    const b = await readBody(request);
    if (!b) return fail('bad_input', 400);
    switch (b.action) {
      case 'status': {
        const status = b.status as SkillStatus;
        if (!isUuid(b.skillId) || !['pending', 'approved', 'hidden'].includes(status)) return fail('bad_input', 400);
        const s = await store.updateSkill(b.skillId, { status });
        return s ? ok({ skill: s }) : fail('not_found', 404);
      }
      case 'price': {
        const pricing = b.pricing as Pricing;
        if (!['free', 'one_time', 'monthly'].includes(pricing)) return fail('bad_input', 400);
        const price_cents = pricing === 'free' ? 0 : parseUsd(String(b.price ?? ''));
        if (price_cents === null) return fail('bad_price', 400);
        const trial_days = pricing === 'free' ? 0 : Number(b.trial_days) || 0;
        if (!TRIAL_CHOICES_SET.has(trial_days)) return fail('bad_input', 400);
        const patch = { pricing, price_cents, trial_days };
        if (typeof b.builtinSlug === 'string') {
          // The owner's own built-in skills: create their price row on first use.
          const builtin = getBuiltin(b.builtinSlug);
          if (!builtin || builtin.kind !== 'assistant') return fail('not_found', 404);
          const row = await store.getBuiltinSkill(builtin.slug);
          const saved = row
            ? await store.updateSkill(row.id, patch)
            : await store.createSkill({
                builtin_slug: builtin.slug, creator_id: null, creator_name: null, name: builtin.name, tagline: builtin.tagline,
                description: builtin.about, input_label: '', status: 'approved', source_url: null, ...patch,
              }, null);
          forgetBuiltin(builtin.slug);
          return ok({ skill: saved });
        }
        if (!isUuid(b.skillId)) return fail('bad_input', 400);
        const s = await store.updateSkill(b.skillId, patch);
        return s ? ok({ skill: s }) : fail('not_found', 404);
      }
      case 'grant': {
        const profile = await store.findProfileByEmail(str(b.email, 200));
        if (!profile) return fail('no_user', 404);
        const skillId = b.skillId === null || b.skillId === '' || b.skillId === 'all' ? null : b.skillId;
        if (skillId !== null && (!isUuid(skillId) || !(await store.getSkill(skillId)))) return fail('not_found', 404);
        const exp = str(b.expires, 30);
        const expires_at = exp ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(exp) ? `${exp}T23:59:59Z` : exp) : null;
        if (expires_at && Number.isNaN(expires_at.getTime())) return fail('bad_input', 400);
        const grant = await store.addGrant({
          user_id: profile.id, skill_id: skillId, expires_at: expires_at?.toISOString() || null,
          note: str(b.note, 300) || null, created_by: user!.email,
        });
        return ok({ grant });
      }
      case 'revoke': {
        if (!isUuid(b.grantId)) return fail('bad_input', 400);
        const g = await store.revokeGrant(b.grantId);
        return g ? ok({ grant: g }) : fail('not_found', 404);
      }
      case 'payout': {
        if (!isUuid(b.creatorId)) return fail('bad_input', 400);
        const s = String(b.amount ?? '').trim().replace(',', '.');
        const amount_cents = /^\d{1,6}(\.\d{1,2})?$/.test(s) ? Math.round(Number(s) * 100) : 0;
        if (amount_cents <= 0) return fail('bad_input', 400);
        if (!(await store.getProfile(b.creatorId))) return fail('not_found', 404);
        const payout = await store.addPayout({ creator_id: b.creatorId, amount_cents, note: str(b.note, 300) || null, created_by: user!.email });
        return ok({ payout });
      }
      default:
        return fail('bad_input', 400);
    }
  });
}
