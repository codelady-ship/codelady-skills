import { grantLive, subscriptionLive } from '@/lib/market/access';
import { ok, withMarket } from '@/server/market/http';

/** Everything the signed-in user bought, subscribed to, tried or was given. */
export async function GET(request: Request) {
  return withMarket(request, { user: 'required' }, async ({ store, user }) => {
    const ent = await store.userEntitlements(user!.id);
    const ids = new Set([...ent.purchases, ...ent.subscriptions, ...ent.trials, ...ent.grants].map((r) => r.skill_id).filter(Boolean) as string[]);
    const skills = Object.fromEntries(
      (await Promise.all([...ids].map((id) => store.getSkill(id)))).filter(Boolean).map((s) => [s!.id, { name: s!.name, builtin_slug: s!.builtin_slug }]),
    );
    const now = Date.now();
    type Row = { kind: 'purchase' | 'subscription' | 'trial' | 'grant'; skill_id: string | null; date: string; until: string | null; status: 'active' | 'ended' | 'refunded' };
    const rows: Row[] = [
      ...ent.purchases.map((p): Row => ({ kind: 'purchase', skill_id: p.skill_id, date: p.created_at, until: null, status: p.status === 'paid' ? 'active' : 'refunded' })),
      ...ent.subscriptions.map((s): Row => ({ kind: 'subscription', skill_id: s.skill_id, date: s.created_at, until: s.current_period_end, status: subscriptionLive(s, now) ? 'active' : 'ended' })),
      ...ent.trials.map((t): Row => ({ kind: 'trial', skill_id: t.skill_id, date: t.started_at, until: t.ends_at, status: Date.parse(t.ends_at) > now ? 'active' : 'ended' })),
      ...ent.grants.map((g): Row => ({ kind: 'grant', skill_id: g.skill_id, date: g.created_at, until: g.expires_at, status: grantLive(g, now) ? 'active' : 'ended' })),
    ].sort((a, b) => b.date.localeCompare(a.date));
    return ok({ rows, skills });
  });
}
