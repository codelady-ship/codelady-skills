import { fail, ok, readBody, str, withMarket } from '@/server/market/http';
import { accessFor } from '@/server/market/service';
import { allow } from '@/server/rate';

/** Starts the free trial (no card): once per person per skill, for the length the creator chose. */
export async function POST(request: Request) {
  return withMarket(request, { user: 'required', write: true }, async ({ store, user }) => {
    if (!allow(request, 'trial')) return fail('rate_limit', 429);
    const b = await readBody(request);
    const id = str(b?.skillId, 80);
    const skill = id.startsWith('builtin:') ? await store.getBuiltinSkill(id.slice(8)) : await store.getSkill(id);
    if (!skill || skill.status === 'hidden' || (skill.status !== 'approved' && !skill.builtin_slug)) return fail('not_found', 404);
    if (skill.pricing === 'free' || skill.trial_days <= 0) return fail('no_trial', 400);
    const access = await accessFor(store, user, { ...skill, status: 'approved' });
    if (access.allowed) return fail('has_access', 409);
    if (!access.trialAvailable) return fail('trial_used', 409);
    const now = Date.now();
    const trial = await store.createTrial({
      user_id: user!.id, skill_id: skill.id,
      started_at: new Date(now).toISOString(), ends_at: new Date(now + skill.trial_days * 864e5).toISOString(),
    });
    if (!trial) return fail('trial_used', 409);
    return ok({ trial });
  });
}
