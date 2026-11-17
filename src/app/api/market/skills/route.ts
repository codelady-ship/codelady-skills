import { parseUsd, TRIAL_CHOICES_SET } from '@/server/market/validate';
import { fail, ok, readBody, str, withMarket } from '@/server/market/http';
import { publicSkill } from '@/server/market/service';
import { allow } from '@/server/rate';
import { instructions as readInstructions, parseGithub, readRepo } from '@/server/github-skill';
import type { Pricing } from '@/lib/market/types';

/** Approved marketplace skills, newest first. Public. */
export async function GET(request: Request) {
  return withMarket(request, {}, async ({ store }) => ok({ skills: (await store.listSkills({ status: 'approved' })).map(publicSkill) }));
}

/**
 * Publish a skill (signed-in creators). It starts as "pending" until the admin approves it.
 * Instructions come from the pasted text or are read once from a public GitHub link.
 */
export async function POST(request: Request) {
  return withMarket(request, { user: 'required', write: true }, async ({ store, user }) => {
    if (!allow(request, 'publish')) return fail('rate_limit', 429);
    const b = await readBody(request);
    if (!b) return fail('bad_input', 400);
    const name = str(b.name, 80), tagline = str(b.tagline, 160), description = str(b.description, 2000), input_label = str(b.input_label, 120);
    const pricing = (['free', 'one_time', 'monthly'] as const).includes(b.pricing as Pricing) ? (b.pricing as Pricing) : null;
    if (name.length < 2 || !pricing) return fail('bad_input', 400);
    const price_cents = pricing === 'free' ? 0 : parseUsd(String(b.price ?? ''));
    if (price_cents === null) return fail('bad_price', 400);
    const trial_days = pricing === 'free' ? 0 : Number(b.trial_days) || 0;
    if (!TRIAL_CHOICES_SET.has(trial_days)) return fail('bad_input', 400);

    let text = typeof b.instructions === 'string' ? b.instructions.trim() : '';
    let source_url: string | null = null;
    if (text.length > 60000) return fail('bad_input', 400);
    const gh = str(b.github, 500);
    if (!text && gh) {
      const src = parseGithub(gh);
      if (!src) return fail('github_failed', 400);
      const files = await readRepo(src);
      if (files === 'not_found' || files === 'too_big') return fail('github_failed', 400);
      text = readInstructions(files).slice(0, 60000);
      source_url = src.url;
    }
    if (text.length < 20) return fail('need_instructions', 400);

    const profile = await store.ensureProfile({ id: user!.id, email: user!.email });
    const skill = await store.createSkill({
      builtin_slug: null, creator_id: user!.id, creator_name: profile.display_name || user!.email.split('@')[0],
      name, tagline, description, input_label, pricing, price_cents, trial_days,
      status: 'pending', source_url,
    }, text);
    return ok({ skill: publicSkill(skill) });
  });
}
