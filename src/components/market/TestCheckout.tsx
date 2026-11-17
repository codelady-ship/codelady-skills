'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/config';
import { MARKET, errorText } from '@/i18n/market';
import { api } from '@/lib/market/client';
import type { SkillRow } from '@/lib/market/types';
import { Notice, PageTitle, PriceTag, btnPrimary, btnSecondary, usd } from './ui';
import { browserPath } from '@/lib/base';

const subscribeHash = (l: () => void) => {
  window.addEventListener('hashchange', l);
  return () => window.removeEventListener('hashchange', l);
};

/** Mock mode only: stands in for the Lemon Squeezy checkout page. #<skill id or builtin:slug> */
export function TestCheckout({ lang }: { lang: Locale }) {
  const m = MARKET[lang];
  const id = useSyncExternalStore(subscribeHash, () => decodeURIComponent(location.hash.slice(1)), () => '');
  const [skill, setSkill] = useState<SkillRow | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!id) return;
    api<{ skill: SkillRow }>(`skills/${encodeURIComponent(id)}`).then((r) => (r.ok && r.data.skill ? setSkill(r.data.skill) : setError(errorText(lang, r.data.error || 'not_found'))));
  }, [id, lang]);

  const back = () => (skill?.builtin_slug ? `/${lang}/skills/${skill.builtin_slug}` : `/${lang}/market#${skill?.id || ''}`);
  async function pay() {
    setBusy(true);
    const r = await api('mock-pay', { skillId: id });
    setBusy(false);
    if (!r.ok) return setError(errorText(lang, r.data.error));
    location.assign(browserPath(back()));
  }

  return (
    <>
      <PageTitle title={m.testCheckoutTitle} lead={m.testCheckoutLead} />
      {error && <Notice tone="error">{error}</Notice>}
      {skill && (
        <div className="max-w-[520px] space-y-4 rounded-lg border-2 border-dashed border-ink p-5">
          <p className="font-serif text-[1.3rem] font-semibold">{skill.name}</p>
          <p className="text-[1.1rem]">
            {usd(skill.price_cents)}{skill.pricing === 'monthly' ? ` ${m.perMonth}` : ''}{' '}
            <span className="text-ink-2">(<PriceTag lang={lang} pricing={skill.pricing} cents={skill.price_cents} />)</span>
          </p>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={busy} onClick={pay} className={btnPrimary}>{m.payTest(usd(skill.price_cents))}</button>
            <a href={back()} className={btnSecondary}>{m.cancel}</a>
          </div>
        </div>
      )}
    </>
  );
}
