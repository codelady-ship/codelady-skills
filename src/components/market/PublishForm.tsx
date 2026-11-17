'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Locale } from '@/i18n/config';
import { MARKET, errorText } from '@/i18n/market';
import { api, useMe } from '@/lib/market/client';
import { TRIAL_CHOICES, type Pricing } from '@/lib/market/types';
import { Notice, btnPrimary, inputCls } from './ui';

/** Creator form: describe the skill, paste its instructions (or a GitHub link), choose the price. */
export function PublishForm({ lang }: { lang: Locale }) {
  const m = MARKET[lang];
  const { loaded, user, config } = useMe();
  const [f, setF] = useState({ name: '', tagline: '', description: '', input_label: '', instructions: '', github: '', pricing: 'free' as Pricing, price: '', trial_days: 0 });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const set = (k: keyof typeof f, v: string | number) => setF((s) => ({ ...s, [k]: v }));

  if (!loaded) return <p className="text-ink-2">{m.loading}</p>;
  if (!user) {
    return (
      <Notice>
        {m.errors.login}{' '}
        <Link href={`/${lang}/signin?next=/${lang}/publish`} className="font-medium underline underline-offset-4">{m.signIn}</Link>
      </Notice>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setDone('');
    const r = await api<{ skill: { id: string } }>('skills', f);
    setBusy(false);
    if (!r.ok) return setError(errorText(lang, r.data.error));
    setDone(r.data.skill.id);
  }

  if (done) {
    return (
      <div className="max-w-[640px] space-y-4">
        <Notice tone="ok">{m.publishedOk}</Notice>
        <div className="flex flex-wrap gap-4">
          <Link href={`/${lang}/market#${done}`} className="underline underline-offset-4">{f.name}</Link>
          <Link href={`/${lang}/earnings`} className="underline underline-offset-4">{m.earnings}</Link>
        </div>
      </div>
    );
  }

  const field = (k: 'name' | 'tagline' | 'input_label' | 'github', label: string, opts: { required?: boolean; max: number; ph?: string; hint?: string; type?: string }) => (
    <div>
      <label htmlFor={`pub-${k}`} className="mb-2 block font-medium">{label}{opts.required && <span className="text-coral"> *</span>}</label>
      <input id={`pub-${k}`} type={opts.type || 'text'} required={opts.required} maxLength={opts.max} placeholder={opts.ph}
        value={f[k]} onChange={(e) => set(k, e.target.value)} className={inputCls} />
      {opts.hint && <p className="mt-1.5 text-sm text-ink-2">{opts.hint}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="max-w-[760px] space-y-6">
      {field('name', m.fName, { required: true, max: 80 })}
      {field('tagline', m.fTagline, { required: true, max: 160 })}
      <div>
        <label htmlFor="pub-desc" className="mb-2 block font-medium">{m.fDescription}</label>
        <textarea id="pub-desc" rows={4} maxLength={2000} value={f.description} onChange={(e) => set('description', e.target.value)} className={inputCls} />
      </div>
      {field('input_label', m.fInputLabel, { max: 120, ph: m.fInputLabelPh })}
      <div>
        <label htmlFor="pub-instr" className="mb-2 block font-medium">{m.fInstructions}</label>
        <textarea id="pub-instr" rows={10} maxLength={60000} value={f.instructions} onChange={(e) => set('instructions', e.target.value)} className={`${inputCls} font-mono text-[0.92rem]`} />
        <p className="mt-1.5 text-sm text-ink-2">{m.fInstructionsHint}</p>
      </div>
      {!f.instructions.trim() && field('github', m.fGithub, { max: 500, type: 'url', ph: 'https://github.com/…', hint: m.fGithubHint })}

      <fieldset className="space-y-3">
        <legend className="mb-2 font-medium">{m.fPricing}</legend>
        {([['free', m.pFree], ['one_time', m.pOneTime], ['monthly', m.pMonthly]] as const).map(([v, label]) => (
          <label key={v} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-line bg-card px-4">
            <input type="radio" name="pricing" value={v} checked={f.pricing === v} onChange={() => set('pricing', v)} />
            {label}
          </label>
        ))}
      </fieldset>

      {f.pricing !== 'free' && (
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="pub-price" className="mb-2 block font-medium">{m.fPrice}<span className="text-coral"> *</span></label>
            <input id="pub-price" inputMode="decimal" required value={f.price} onChange={(e) => set('price', e.target.value)} className={inputCls} placeholder="4.99" />
            <p className="mt-1.5 text-sm text-ink-2">{m.fPriceHint}</p>
          </div>
          <div>
            <label htmlFor="pub-trial" className="mb-2 block font-medium">{m.fTrial}</label>
            <select id="pub-trial" value={f.trial_days} onChange={(e) => set('trial_days', Number(e.target.value))} className={inputCls}>
              {TRIAL_CHOICES.map((n) => <option key={n} value={n}>{n ? m.trialDays(n) : m.trialNone}</option>)}
            </select>
          </div>
          <p className="text-sm text-ink-2 sm:col-span-2">{m.feeNote(config?.feePercent ?? 20)}</p>
        </div>
      )}

      {error && <Notice tone="error">{error}</Notice>}
      <button type="submit" disabled={busy} className={btnPrimary}>{busy ? m.loading : m.publishBtn}</button>
    </form>
  );
}
