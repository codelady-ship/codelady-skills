'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Locale } from '@/i18n/config';
import { MARKET, errorText } from '@/i18n/market';
import { api, useCurrency } from '@/lib/market/client';
import type { AccessInfo, SkillRow } from '@/lib/market/types';
import { Notice, btnPrimary, btnSecondary, fmtDate } from './ui';

/**
 * What the visitor may do with a paid skill: run it (with how/until when), or buy / start the
 * trial / sign in. Only a display: the run API checks access again on the server.
 */
export function AccessBox({ lang, id, skill, access, onChange }: {
  lang: Locale;
  /** marketplace skill id or "builtin:<slug>" */
  id: string;
  skill: SkillRow;
  access: AccessInfo;
  onChange: () => void;
}) {
  const m = MARKET[lang];
  const { format } = useCurrency();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const statusNote = skill.status === 'pending' ? m.pendingNote : skill.status === 'hidden' && !skill.builtin_slug ? m.hiddenNote : '';

  if (access.allowed) {
    if (access.via === 'free') return statusNote ? <Notice>{statusNote}</Notice> : null;
    const via = {
      creator: m.viaCreator, admin: m.viaAdmin, purchase: m.viaPurchase, subscription: m.viaSubscription,
      trial: m.viaTrial, grant: m.viaGrant, free: '',
    }[access.via || 'free'];
    return (
      <div className="space-y-3">
        {statusNote && <Notice>{statusNote}</Notice>}
        <Notice tone="ok">{via}{access.until ? ` · ${m.until(fmtDate(access.until, lang))}` : ''}</Notice>
      </div>
    );
  }

  const price = format(skill.price_cents, lang);
  async function go(path: 'checkout' | 'trial') {
    setBusy(true); setError('');
    const r = await api<{ url?: string }>(path, { skillId: id, lang });
    setBusy(false);
    if (!r.ok) return setError(errorText(lang, r.data.error));
    if (path === 'checkout' && r.data.url) location.assign(r.data.url);
    else onChange();
  }

  const here = typeof location === 'undefined' ? '' : location.pathname + location.hash;
  return (
    <div className="max-w-[760px] space-y-4 rounded-lg border-2 border-ink p-5">
      <p className="text-[1.05rem]">{m.lockedLead}</p>
      {access.reason === 'login' ? (
        <Link href={`/${lang}/signin?next=${encodeURIComponent(here)}`} className={btnPrimary}>{m.signInToBuy}</Link>
      ) : (
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => go('checkout')} className={btnPrimary}>
            {skill.pricing === 'monthly' ? m.subscribe(price.text) : m.buy(price.text)}
          </button>
          {access.trialAvailable && skill.trial_days > 0 && (
            <button type="button" disabled={busy} onClick={() => go('trial')} className={btnSecondary}>{m.startTrial(skill.trial_days)}</button>
          )}
        </div>
      )}
      {price.approx && <p className="text-sm text-ink-2">{price.usd} · {m.chargedNote}</p>}
      {access.reason === 'payment' && (
        <p className="text-sm text-ink-2">
          {m.afterPay}{' '}
          <button type="button" onClick={onChange} className="underline underline-offset-4 hover:text-ink">{m.checkAgain}</button>
        </p>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
