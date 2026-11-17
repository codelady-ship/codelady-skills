import { marketConfig } from '@/server/market/config';
import { ok, withMarket } from '@/server/market/http';
import { publicSkill } from '@/server/market/service';

/** The signed-in creator's skills, sales (after the platform fee) and payouts received. */
export async function GET(request: Request) {
  return withMarket(request, { user: 'required' }, async ({ store, user }) => {
    const [skills, sales, payouts] = await Promise.all([
      store.listSkills({ creatorId: user!.id }),
      store.listSales({ creatorId: user!.id }),
      store.listPayouts({ creatorId: user!.id }),
    ]);
    const live = sales.filter((s) => !s.refunded);
    const sum = (k: 'gross_cents' | 'fee_cents' | 'net_cents') => live.reduce((n, s) => n + s[k], 0);
    const paid = payouts.reduce((n, p) => n + p.amount_cents, 0);
    const names = Object.fromEntries(skills.map((s) => [s.id, s.name]));
    return ok({
      feePercent: marketConfig().feePercent,
      totals: { gross: sum('gross_cents'), fee: sum('fee_cents'), net: sum('net_cents'), paid, balance: sum('net_cents') - paid },
      skills: skills.map(publicSkill),
      // Buyers stay anonymous to creators.
      sales: sales.map(({ buyer_id: _b, ...s }) => { void _b; return { ...s, skill_name: names[s.skill_id] || '' }; }),
      payouts,
    });
  });
}
