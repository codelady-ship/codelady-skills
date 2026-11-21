'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { MARKET, errorText } from '@/i18n/market';
import { api, reloadMe, useMe } from '@/lib/market/client';
import { IS_DEMO } from '@/lib/base';
import { TRIAL_CHOICES, type Grant, type Payout, type Pricing, type Profile, type Sale, type SkillRow } from '@/lib/market/types';
import { Notice, PageTitle, btnPrimary, btnSmall, fmtDate, inputCls, usd } from './ui';

type Data = {
  users: (Profile & { purchases: number; trials: number })[];
  skills: (SkillRow & { creator_email: string })[];
  builtin: { slug: string; name: string; pricing: Pricing; price_cents: number; trial_days: number }[];
  sales: (Sale & { skill_name: string; buyer_email: string; creator_email: string })[];
  grants: (Grant & { email: string; skill_name: string | null })[];
  payouts: (Payout & { email: string })[];
  balances: { creator_id: string; email: string; net: number; paid: number; balance: number }[];
  grantable: { id: string; name: string }[];
};
// Static demo (GitHub Pages): the admin runs on sample data in the browser (src/demo/admin-sandbox.ts).
const DEMO_ADMIN = 'admin@mock.test';
type DemoText = { note: string; enter: string };
const DEMO_TEXT: Partial<Record<Locale, DemoText>> & { en: DemoText } = {
  az: { note: 'Demo rejimi — dəyişikliklər saxlanmır. Nümunə məlumatdır, yalnız bu tabda qalır.', enter: 'Demo admin kimi daxil ol' },
  en: { note: 'Demo mode — changes are not saved. Sample data, kept in this tab only.', enter: 'Sign in as demo admin' },
  ru: { note: 'Демо-режим — изменения не сохраняются. Пример данных, только в этой вкладке.', enter: 'Войти как демо-админ' },
  tr: { note: 'Demo modu — değişiklikler kaydedilmez. Örnek veriler, yalnızca bu sekmede.', enter: 'Demo yönetici olarak gir' },
};

type Tab = 'skills' | 'users' | 'sales' | 'grants' | 'payouts';

// Tables get the "rtable" class: on phones each row becomes a card and data-label names the column (globals.css).
const table = 'rtable w-full text-left text-[0.95rem]';
const th = 'py-2 pr-4 font-normal';
const td = 'py-2 pr-4 align-top';
const tdDate = `${td} sm:whitespace-nowrap`;
/** Small controls inside table rows: 44px tall, 16px text (no zoom on iPhone). */
const ctl = 'min-h-11 rounded-md border border-line bg-card px-2 text-base';

/** Admin page. Every action is checked again on the server (ADMIN_EMAILS); this is only the UI. */
export function AdminView({ lang }: { lang: Locale }) {
  const m = MARKET[lang];
  const { loaded, user } = useMe();
  const [data, setData] = useState<Data | null>(null);
  const [tab, setTab] = useState<Tab>('skills');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null);

  const load = useCallback(() => {
    api<Data>('admin').then((r) => (r.ok ? setData(r.data) : setMsg({ tone: 'error', text: errorText(lang, r.data.error) })));
  }, [lang]);
  useEffect(() => { if (user?.isAdmin) load(); }, [user, load]);

  const demo = DEMO_TEXT[lang] || DEMO_TEXT.en;
  const [entering, setEntering] = useState(false);
  const enterDemo = useCallback(async () => {
    setEntering(true);
    await api('auth/mock', { email: DEMO_ADMIN });
    await reloadMe();
    setEntering(false);
  }, []);
  // /admin/?demo=1 (the portfolio's iframe) opens straight into the demo admin.
  useEffect(() => {
    if (IS_DEMO && loaded && !user?.isAdmin && new URLSearchParams(location.search).get('demo') === '1') {
      api('auth/mock', { email: DEMO_ADMIN }).then(() => reloadMe());
    }
  }, [loaded, user]);

  async function act(body: Record<string, unknown>) {
    setMsg(null);
    const r = await api('admin', body);
    setMsg(r.ok ? { tone: 'ok', text: m.saved } : { tone: 'error', text: errorText(lang, r.data.error) });
    if (r.ok) load();
    return r.ok;
  }

  if (!loaded || entering) return <p className="text-ink-2">{m.loading}</p>;
  if (IS_DEMO && !user?.isAdmin) {
    return (
      <div className="max-w-[520px] space-y-4">
        <Notice>{demo.note}</Notice>
        <button type="button" className={btnPrimary} onClick={enterDemo}>{demo.enter} · {DEMO_ADMIN}</button>
      </div>
    );
  }
  if (!user) return <Notice>{m.errors.login} <Link href={`/${lang}/signin?next=/${lang}/admin`} className="font-medium underline underline-offset-4">{m.signIn}</Link></Notice>;
  if (!user.isAdmin) return <Notice tone="error">{m.notAdmin}</Notice>;

  const tabs: [Tab, string][] = [['skills', m.tSkills], ['users', m.tUsers], ['sales', m.tSales], ['grants', m.tGrants], ['payouts', m.tPayouts]];
  return (
    <>
      <PageTitle title={m.adminTitle} />
      {IS_DEMO && <div className="mb-4 max-w-[900px]"><Notice>{demo.note}</Notice></div>}
      <div role="tablist" className="mb-6 flex flex-wrap gap-2">
        {tabs.map(([k, label]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`min-h-11 rounded-full border px-4 text-sm ${tab === k ? 'border-ink bg-ink text-paper' : 'border-line bg-card'}`}>{label}</button>
        ))}
      </div>
      {msg && <div className="mb-4 max-w-[900px]"><Notice tone={msg.tone}>{msg.text}</Notice></div>}
      {!data ? <p className="text-ink-2">{m.loading}</p> : (
        <div className="max-w-[1100px] overflow-x-auto">
          {tab === 'skills' && <SkillsTab lang={lang} data={data} act={act} />}
          {tab === 'users' && (
            <table className={table}>
              <thead className="text-sm text-ink-2"><tr><th className={th}>{m.colEmail}</th><th className={th}>{m.colJoined}</th><th className={th}>{m.colPurchases}</th><th className={th}>{m.colTrials}</th></tr></thead>
              <tbody>{data.users.map((u) => (
                <tr key={u.id} className="border-t border-line">
                  <td className={td} data-label={m.colEmail}>{u.email}</td><td className={tdDate} data-label={m.colJoined}>{fmtDate(u.created_at, lang)}</td>
                  <td className={td} data-label={m.colPurchases}>{u.purchases}</td><td className={td} data-label={m.colTrials}>{u.trials}</td>
                </tr>
              ))}</tbody>
            </table>
          )}
          {tab === 'sales' && <SalesTab lang={lang} data={data} />}
          {tab === 'grants' && <GrantsTab lang={lang} data={data} act={act} />}
          {tab === 'payouts' && <PayoutsTab lang={lang} data={data} act={act} />}
        </div>
      )}
    </>
  );
}

type TabProps = { lang: Locale; data: Data; act: (b: Record<string, unknown>) => Promise<boolean> };

function PriceEditor({ lang, pricing, cents, trial, onSave }: { lang: Locale; pricing: Pricing; cents: number; trial: number; onSave: (p: { pricing: Pricing; price: string; trial_days: number }) => void }) {
  const m = MARKET[lang];
  const [p, setP] = useState(pricing);
  const [price, setPrice] = useState(cents ? (cents / 100).toFixed(2) : '');
  const [t, setT] = useState(trial);
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select aria-label={m.fPricing} value={p} onChange={(e) => setP(e.target.value as Pricing)} className={ctl}>
        <option value="free">{m.pFree}</option><option value="one_time">{m.pOneTime}</option><option value="monthly">{m.pMonthly}</option>
      </select>
      {p !== 'free' && <>
        <input aria-label={m.fPrice} value={price} onChange={(e) => setPrice(e.target.value)} inputMode="decimal" placeholder="4.99" className={`${ctl} w-24`} />
        <select aria-label={m.fTrial} value={t} onChange={(e) => setT(Number(e.target.value))} className={ctl}>
          {TRIAL_CHOICES.map((n) => <option key={n} value={n}>{n ? m.trialDays(n) : m.trialNone}</option>)}
        </select>
      </>}
      <button type="button" className={btnSmall} onClick={() => onSave({ pricing: p, price, trial_days: p === 'free' ? 0 : t })}>{m.savePrice}</button>
    </div>
  );
}

function SkillsTab({ lang, data, act }: TabProps) {
  const m = MARKET[lang];
  const st = { pending: m.stPending, approved: m.stApproved, hidden: m.stHidden };
  return (
    <div className="space-y-10">
      <table className={table}>
        <thead className="text-sm text-ink-2"><tr><th className={th}>{m.colSkill}</th><th className={th}>{m.colCreator}</th><th className={th}>{m.colStatus}</th><th className={th}>{m.colPrice}</th></tr></thead>
        <tbody>{data.skills.map((s) => (
          <tr key={s.id} className="border-t border-line">
            <td className={td} data-label={m.colSkill}><Link href={`/${lang}/market#${s.id}`} className="underline underline-offset-4">{s.name}</Link><div className="text-sm text-ink-2">{s.tagline}</div></td>
            <td className={td} data-label={m.colCreator}>{s.creator_email}</td>
            <td className={td} data-label={m.colStatus}>
              <div className="mb-1">{st[s.status]}</div>
              <div className="flex flex-wrap gap-2">
                {s.status !== 'approved' && <button type="button" className={btnSmall} onClick={() => act({ action: 'status', skillId: s.id, status: 'approved' })}>{m.approve}</button>}
                {s.status !== 'hidden' && <button type="button" className={btnSmall} onClick={() => act({ action: 'status', skillId: s.id, status: 'hidden' })}>{m.hide}</button>}
              </div>
            </td>
            <td className={td} data-label={m.colPrice}><PriceEditor key={`${s.pricing}${s.price_cents}${s.trial_days}`} lang={lang} pricing={s.pricing} cents={s.price_cents} trial={s.trial_days}
              onSave={(p) => act({ action: 'price', skillId: s.id, ...p })} /></td>
          </tr>
        ))}</tbody>
      </table>

      <section>
        <h2 className="font-serif text-[1.3rem] font-semibold">{m.builtinTitle}</h2>
        <p className="mb-3 text-sm text-ink-2">{m.builtinNote}</p>
        <table className={table}>
          <tbody>{data.builtin.map((b) => (
            <tr key={b.slug} className="border-t border-line">
              <td className={td}><Link href={`/${lang}/skills/${b.slug}`} className="underline underline-offset-4">{b.name}</Link></td>
              <td className={td} data-label={m.colPrice}><PriceEditor key={`${b.pricing}${b.price_cents}${b.trial_days}`} lang={lang} pricing={b.pricing} cents={b.price_cents} trial={b.trial_days}
                onSave={(p) => act({ action: 'price', builtinSlug: b.slug, ...p })} /></td>
            </tr>
          ))}</tbody>
        </table>
      </section>
    </div>
  );
}

function SalesTab({ lang, data }: { lang: Locale; data: Data }) {
  const m = MARKET[lang];
  const live = data.sales.filter((s) => !s.refunded);
  const sum = (k: 'gross_cents' | 'fee_cents' | 'net_cents') => usd(live.reduce((n, s) => n + s[k], 0));
  return (
    <>
      <p className="mb-4 leading-relaxed">{m.totals}: {m.sGross} <b className="font-mono font-medium">{sum('gross_cents')}</b> · {m.sFee} <b className="font-mono font-medium">{sum('fee_cents')}</b> · {m.sNet} <b className="font-mono font-medium">{sum('net_cents')}</b></p>
      {data.sales.length === 0 ? <p className="text-ink-2">{m.noSales}</p> : (
        <table className={table}>
          <thead className="text-sm text-ink-2"><tr><th className={th}>{m.colDate}</th><th className={th}>{m.colSkill}</th><th className={th}>{m.colBuyer}</th><th className={th}>{m.colCreator}</th><th className={th}>{m.sGross}</th><th className={th}>{m.sFee}</th><th className={th}>{m.sNet}</th></tr></thead>
          <tbody>{data.sales.map((s) => (
            <tr key={s.id} className={`border-t border-line ${s.refunded ? 'text-ink-2 line-through' : ''}`}>
              <td className={tdDate} data-label={m.colDate}>{fmtDate(s.created_at, lang)}</td><td className={td} data-label={m.colSkill}>{s.skill_name}</td>
              <td className={td} data-label={m.colBuyer}>{s.buyer_email}</td><td className={td} data-label={m.colCreator}>{s.creator_email || '—'}</td>
              <td className={`${td} font-mono`} data-label={m.sGross}>{usd(s.gross_cents)}</td><td className={`${td} font-mono`} data-label={m.sFee}>{usd(s.fee_cents)}</td>
              <td className={`${td} font-mono`} data-label={m.sNet}>{usd(s.net_cents)}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </>
  );
}

function GrantsTab({ lang, data, act }: TabProps) {
  const m = MARKET[lang];
  const blank = { email: '', skillId: 'all', expires: '', note: '' };
  const [f, setF] = useState(blank);
  const [now] = useState(() => Date.now());
  return (
    <div className="space-y-8">
      <form className="grid max-w-[900px] gap-3 sm:grid-cols-2" onSubmit={async (e) => { e.preventDefault(); if (await act({ action: 'grant', ...f })) setF(blank); }}>
        <label className="space-y-1"><span className="text-sm">{m.grantEmail}</span>
          <input type="email" required value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} className={inputCls} /></label>
        <label className="space-y-1"><span className="text-sm">{m.grantSkill}</span>
          <select value={f.skillId} onChange={(e) => setF({ ...f, skillId: e.target.value })} className={inputCls}>
            <option value="all">{m.allSkills}</option>
            {data.grantable.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select></label>
        <label className="space-y-1"><span className="text-sm">{m.grantExpires}</span>
          <input type="date" value={f.expires} onChange={(e) => setF({ ...f, expires: e.target.value })} className={inputCls} /></label>
        <label className="space-y-1"><span className="text-sm">{m.grantNote}</span>
          <input value={f.note} maxLength={300} onChange={(e) => setF({ ...f, note: e.target.value })} className={inputCls} /></label>
        <div className="sm:col-span-2"><button className={btnPrimary}>{m.grantBtn}</button></div>
      </form>
      <table className={table}>
        <thead className="text-sm text-ink-2"><tr><th className={th}>{m.colEmail}</th><th className={th}>{m.grantSkill}</th><th className={th}>{m.colUntil}</th><th className={th}>{m.colStatus}</th><th className={th}></th></tr></thead>
        <tbody>{data.grants.map((g) => {
          const ended = !!g.revoked_at || (!!g.expires_at && Date.parse(g.expires_at) <= now);
          return (
            <tr key={g.id} className="border-t border-line">
              <td className={td} data-label={m.colEmail}>{g.email}{g.note && <div className="text-sm text-ink-2">{g.note}</div>}</td>
              <td className={td} data-label={m.grantSkill}>{g.skill_name || m.allSkills}</td>
              <td className={td} data-label={m.colUntil}>{g.expires_at ? fmtDate(g.expires_at, lang) : m.never}</td>
              <td className={td} data-label={m.colStatus}>{g.revoked_at ? m.revoked : ended ? m.stEnded : m.stActive}</td>
              <td className={td}>{!ended && <button type="button" className={btnSmall} onClick={() => act({ action: 'revoke', grantId: g.id })}>{m.revoke}</button>}</td>
            </tr>
          );
        })}</tbody>
      </table>
    </div>
  );
}

function PayoutsTab({ lang, data, act }: TabProps) {
  const m = MARKET[lang];
  const [amounts, setAmounts] = useState<Record<string, string>>({});
  return (
    <div className="space-y-8">
      <p className="text-sm text-ink-2">{m.payoutHint}</p>
      <table className={table}>
        <thead className="text-sm text-ink-2"><tr><th className={th}>{m.colCreator}</th><th className={th}>{m.sNet}</th><th className={th}>{m.sPaid}</th><th className={th}>{m.sBalance}</th><th className={th}></th></tr></thead>
        <tbody>{data.balances.map((b) => (
          <tr key={b.creator_id} className="border-t border-line">
            <td className={td} data-label={m.colCreator}>{b.email}</td><td className={`${td} font-mono`} data-label={m.sNet}>{usd(b.net)}</td>
            <td className={`${td} font-mono`} data-label={m.sPaid}>{usd(b.paid)}</td><td className={`${td} font-mono font-medium`} data-label={m.sBalance}>{usd(b.balance)}</td>
            <td className={td}>
              <form className="flex flex-wrap gap-2" onSubmit={async (e) => {
                e.preventDefault();
                if (await act({ action: 'payout', creatorId: b.creator_id, amount: amounts[b.creator_id] ?? (b.balance / 100).toFixed(2) })) setAmounts({ ...amounts, [b.creator_id]: '' });
              }}>
                <input aria-label={m.colAmount} inputMode="decimal" value={amounts[b.creator_id] ?? (b.balance > 0 ? (b.balance / 100).toFixed(2) : '')}
                  onChange={(e) => setAmounts({ ...amounts, [b.creator_id]: e.target.value })} className={`${ctl} w-28`} />
                <button className={btnSmall}>{m.recordPayout}</button>
              </form>
            </td>
          </tr>
        ))}</tbody>
      </table>
      {data.payouts.length > 0 && (
        <table className={table}>
          <thead className="text-sm text-ink-2"><tr><th className={th}>{m.colDate}</th><th className={th}>{m.colCreator}</th><th className={th}>{m.colAmount}</th><th className={th}>{m.grantNote}</th></tr></thead>
          <tbody>{data.payouts.map((p) => (
            <tr key={p.id} className="border-t border-line">
              <td className={tdDate} data-label={m.colDate}>{fmtDate(p.created_at, lang)}</td><td className={td} data-label={m.colCreator}>{p.email}</td>
              <td className={`${td} font-mono`} data-label={m.colAmount}>{usd(p.amount_cents)}</td><td className={td} data-label={m.grantNote}>{p.note || ''}</td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}
