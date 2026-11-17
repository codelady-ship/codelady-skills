import { ok, fail, withMarket } from '@/server/market/http';
import { accessFor, builtinRow, publicSkill } from '@/server/market/service';
import { getSkill as getBuiltin } from '@/skills/registry';

/**
 * One skill with the visitor's access to it. id is a marketplace skill id, or
 * "builtin:<slug>" for one of the owner's built-in skills (free unless the admin priced it).
 */
export async function GET(request: Request, ctx: RouteContext<'/api/market/skills/[id]'>) {
  const { id } = await ctx.params;
  return withMarket(request, {}, async ({ store, user }) => {
    if (id.startsWith('builtin:')) {
      const slug = id.slice(8);
      if (!getBuiltin(slug)) return fail('not_found', 404);
      const row = await builtinRow(store, slug);
      if (!row || row.pricing === 'free') return ok({ skill: null, access: { allowed: true, via: 'free' }, user });
      const access = await accessFor(store, user, { ...row, status: row.status === 'hidden' ? 'hidden' : 'approved' });
      return ok({ skill: publicSkill(row), access, user });
    }
    const skill = await store.getSkill(id);
    if (!skill) return fail('not_found', 404);
    const access = await accessFor(store, user, skill);
    // Pending/hidden skills are invisible to everyone except their creator and the admin.
    if (!access.allowed && access.reason === 'not_listed') return fail('not_found', 404);
    return ok({ skill: publicSkill(skill), access, user });
  });
}
