'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { MARKET, errorText } from '@/i18n/market';
import { api, useMe } from '@/lib/market/client';
import { Notice, fmtDate } from './ui';

type Row = { kind: 'purchase' | 'subscription' | 'trial' | 'grant'; skill_id: string | null; date: string; until: string | null; status: 'active' | 'ended' | 'refunded' };
type Data = { rows: Row[]; skills: Record<string, { name: string; builtin_slug: string | null }> };

export function Purchases({ lang }: { lang: Locale }) {
  const m = MARKET[lang];
  const { loaded, user } = useMe();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    if (user) api<Data>('purchases').then((r) => (r.ok ? setData(r.data) : setError(errorText(lang, r.data.error))));
  }, [user, lang]);

  if (!loaded) return <p className="text-ink-2">{m.loading}</p>;
  if (!user) return <Notice>{m.errors.login} <Link href={`/${lang}/signin?next=/${lang}/purchases`} className="font-medium underline underline-offset-4">{m.signIn}</Link></Notice>;
  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <p className="text-ink-2">{m.loading}</p>;
  if (!data.rows.length) return <p className="text-ink-2">{m.purchasesEmpty} <Link href={`/${lang}/market`} className="underline underline-offset-4">{m.market}</Link></p>;

  const kind = { purchase: m.typePurchase, subscription: m.typeSubscription, trial: m.typeTrial, grant: m.typeGrant };
  const status = { active: m.stActive, ended: m.stEnded, refunded: m.stRefunded };
  const link = (id: string | null) => {
    if (!id) return m.allSkills;
    const s = data.skills[id];
    if (!s) return '—';
    return <Link className="underline underline-offset-4" href={s.builtin_slug ? `/${lang}/skills/${s.builtin_slug}` : `/${lang}/market#${id}`}>{s.name}</Link>;
  };
  return (
    <div className="max-w-[900px] space-y-4">
      <div className="overflow-x-auto">
        <table className="rtable w-full text-left text-[0.95rem]">
          <thead className="text-sm text-ink-2"><tr>
            <th className="py-2 pr-4">{m.colSkill}</th><th className="py-2 pr-4">{m.colType}</th><th className="py-2 pr-4">{m.colStatus}</th>
            <th className="py-2 pr-4">{m.colDate}</th><th className="py-2">{m.colUntil}</th>
          </tr></thead>
          <tbody>
            {data.rows.map((r, i) => (
              <tr key={i} className="border-t border-line">
                <td className="py-2 pr-4" data-label={m.colSkill}>{link(r.skill_id)}</td>
                <td className="py-2 pr-4" data-label={m.colType}>{kind[r.kind]}</td>
                <td className="py-2 pr-4" data-label={m.colStatus}>{status[r.status]}</td>
                <td className="py-2 pr-4 sm:whitespace-nowrap" data-label={m.colDate}>{fmtDate(r.date, lang)}</td>
                <td className="py-2" data-label={m.colUntil}>{r.kind === 'purchase' ? '—' : r.until ? fmtDate(r.until, lang) : m.never}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.rows.some((r) => r.kind === 'subscription') && <p className="text-sm text-ink-2">{m.manageSub}</p>}
    </div>
  );
}
