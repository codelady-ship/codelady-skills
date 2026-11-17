'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { MARKET, errorText } from '@/i18n/market';
import { api, useMe } from '@/lib/market/client';
import type { Payout, Sale, SkillRow } from '@/lib/market/types';
import { Notice, PageTitle, fmtDate, usd } from './ui';

type Data = {
  feePercent: number;
  totals: { gross: number; fee: number; net: number; paid: number; balance: number };
  skills: SkillRow[];
  sales: (Omit<Sale, 'buyer_id'> & { skill_name: string })[];
  payouts: Payout[];
};

export function Earnings({ lang }: { lang: Locale }) {
  const m = MARKET[lang];
  const { loaded, user } = useMe();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (user) api<Data>('earnings').then((r) => (r.ok ? setData(r.data) : setError(errorText(lang, r.data.error))));
  }, [user, lang]);

  if (!loaded) return <><PageTitle title={m.earningsTitle} /><p className="text-ink-2">{m.loading}</p></>;
  if (!user) return <><PageTitle title={m.earningsTitle} /><Notice>{m.errors.login} <Link href={`/${lang}/signin?next=/${lang}/earnings`} className="font-medium underline underline-offset-4">{m.signIn}</Link></Notice></>;
  if (error) return <><PageTitle title={m.earningsTitle} /><Notice tone="error">{error}</Notice></>;
  if (!data) return <><PageTitle title={m.earningsTitle} /><p className="text-ink-2">{m.loading}</p></>;

  const st = { pending: m.stPending, approved: m.stApproved, hidden: m.stHidden };
  const cards: [string, number][] = [[m.sGross, data.totals.gross], [m.sFee, data.totals.fee], [m.sNet, data.totals.net], [m.sPaid, data.totals.paid], [m.sBalance, data.totals.balance]];
  return (
    <>
      <PageTitle title={m.earningsTitle} lead={m.earningsLead(data.feePercent)} />
      <dl className="mb-10 grid max-w-[900px] grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {cards.map(([label, v]) => (
          <div key={label} className="rounded-lg border border-line bg-card p-4">
            <dt className="text-sm text-ink-2">{label}</dt>
            <dd className="break-anywhere mt-1 font-mono text-[1.2rem]">{usd(v)}</dd>
          </div>
        ))}
      </dl>

      <h2 className="mb-3 font-serif text-[1.4rem] font-semibold">{m.yourSkills}</h2>
      {data.skills.length === 0 ? (
        <p className="mb-10 text-ink-2">{m.noOwnSkills} <Link href={`/${lang}/publish`} className="underline underline-offset-4">{m.publish}</Link></p>
      ) : (
        <ul className="mb-10 max-w-[900px] divide-y divide-line border-y border-line">
          {data.skills.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
              <Link href={`/${lang}/market#${s.id}`} className="font-medium underline underline-offset-4">{s.name}</Link>
              <span className="text-sm text-ink-2">
                {s.pricing === 'free' ? m.free : `${usd(s.price_cents)}${s.pricing === 'monthly' ? ` ${m.perMonth}` : ''}`} · {st[s.status]}
              </span>
            </li>
          ))}
        </ul>
      )}

      <h2 className="mb-3 font-serif text-[1.4rem] font-semibold">{m.recentSales}</h2>
      {data.sales.length === 0 ? <p className="mb-10 text-ink-2">{m.noSales}</p> : (
        <div className="mb-10 max-w-[900px] overflow-x-auto">
          <table className="rtable w-full text-left text-[0.95rem]">
            <thead className="text-sm text-ink-2"><tr>
              <th className="py-2 pr-4">{m.colDate}</th><th className="py-2 pr-4">{m.colSkill}</th>
              <th className="py-2 pr-4">{m.sGross}</th><th className="py-2 pr-4">{m.sFee}</th><th className="py-2">{m.sNet}</th>
            </tr></thead>
            <tbody>
              {data.sales.map((s) => (
                <tr key={s.id} className={`border-t border-line ${s.refunded ? 'text-ink-2 line-through' : ''}`}>
                  <td className="py-2 pr-4 sm:whitespace-nowrap" data-label={m.colDate}>{fmtDate(s.created_at, lang)}</td>
                  <td className="py-2 pr-4" data-label={m.colSkill}>{s.skill_name}</td>
                  <td className="py-2 pr-4 font-mono" data-label={m.sGross}>{usd(s.gross_cents)}</td>
                  <td className="py-2 pr-4 font-mono" data-label={m.sFee}>{usd(s.fee_cents)}</td>
                  <td className="py-2 font-mono" data-label={m.sNet}>{usd(s.net_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data.payouts.length > 0 && (
        <>
          <h2 className="mb-3 font-serif text-[1.4rem] font-semibold">{m.payoutsList}</h2>
          <ul className="max-w-[900px] divide-y divide-line border-y border-line">
            {data.payouts.map((p) => (
              <li key={p.id} className="flex flex-wrap justify-between gap-x-3 gap-y-1 py-2"><span>{fmtDate(p.created_at, lang)}{p.note ? ` · ${p.note}` : ''}</span><span className="font-mono">{usd(p.amount_cents)}</span></li>
            ))}
          </ul>
        </>
      )}
    </>
  );
}
