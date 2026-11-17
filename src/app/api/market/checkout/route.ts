import { hasLocale } from '@/i18n/config';
import { siteOrigin } from '@/server/market/config';
import { fail, ok, readBody, str, withMarket } from '@/server/market/http';
import { getPayments } from '@/server/market/pay';
import { accessFor } from '@/server/market/service';
import { allow } from '@/server/rate';

/** Starts a checkout for a paid skill (or a priced built-in) and returns the page to send the buyer to. */
export async function POST(request: Request) {
  return withMarket(request, { user: 'required', write: true }, async ({ store, user }) => {
    if (!allow(request, 'checkout')) return fail('rate_limit', 429);
    const b = await readBody(request);
    const lang = hasLocale(str(b?.lang, 5)) ? str(b?.lang, 5) : 'en';
    const id = str(b?.skillId, 80);
    const skill = id.startsWith('builtin:') ? await store.getBuiltinSkill(id.slice(8)) : await store.getSkill(id);
    // Only skills on sale: approved marketplace skills, or built-ins the admin priced and didn't hide.
    if (!skill || skill.status === 'hidden' || (skill.status !== 'approved' && !skill.builtin_slug)) return fail('not_found', 404);
    if (skill.pricing === 'free') return fail('bad_input', 400);
    const access = await accessFor(store, user, { ...skill, status: 'approved' });
    if (access.allowed) return fail('has_access', 409);
    const pay = getPayments();
    if (!pay) return fail('not_configured', 503);
    const back = skill.builtin_slug ? `/${lang}/skills/${skill.builtin_slug}` : `/${lang}/market#${skill.id}`;
    const { url } = await pay.createCheckout({ user: user!, skill, successUrl: `${siteOrigin(request)}${back}` });
    return ok({ url });
  });
}
