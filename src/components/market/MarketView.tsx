'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/config';
import { MARKET, errorText } from '@/i18n/market';
import { UI } from '@/i18n/ui';
import { api } from '@/lib/market/client';
import { markFor } from '@/lib/my-skills';
import type { AccessInfo, SkillRow } from '@/lib/market/types';
import { AssistantTool } from '@/components/tools/AssistantTool';
import { AccessBox } from './AccessBox';
import { CurrencyPicker, Notice, PageTitle, PriceTag } from './ui';

const TONES = ['#9A3412', '#166534', '#1E40AF', '#86198F', '#0F766E', '#B45309', '#4338CA', '#BE123C'];
const toneFor = (id: string) => TONES[[...id].reduce((n, c) => n + c.charCodeAt(0), 0) % TONES.length];

const subscribeHash = (l: () => void) => {
  window.addEventListener('hashchange', l);
  return () => window.removeEventListener('hashchange', l);
};

/** /[lang]/market: the list, or one skill when the address ends in #<id>. */
export function MarketView({ lang }: { lang: Locale }) {
  const id = useSyncExternalStore(subscribeHash, () => decodeURIComponent(location.hash.slice(1)), () => '');
  return id ? <SkillDetail key={id} lang={lang} id={id} /> : <SkillList lang={lang} />;
}

function Mark({ s, size }: { s: Pick<SkillRow, 'id' | 'name'>; size: number }) {
  return (
    <span aria-hidden className="inline-grid shrink-0 place-items-center rounded-[6px] font-mono font-medium text-white"
      style={{ width: size, height: size, background: toneFor(s.id), fontSize: size * 0.38 }}>
      {markFor(s.name)}
    </span>
  );
}

function SkillList({ lang }: { lang: Locale }) {
  const m = MARKET[lang];
  const [skills, setSkills] = useState<SkillRow[] | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    api<{ skills: SkillRow[] }>('skills').then((r) => (r.ok ? setSkills(r.data.skills) : setError(errorText(lang, r.data.error))));
  }, [lang]);

  return (
    <>
      <PageTitle title={m.marketTitle} lead={m.marketLead} />
      <div className="mb-6"><CurrencyPicker lang={lang} /></div>
      {error && <Notice tone="error">{error}</Notice>}
      {!skills && !error && <p className="text-ink-2">{m.loading}</p>}
      {skills?.length === 0 && <p className="text-ink-2">{m.marketEmpty}</p>}
      <ul className="grid max-w-[980px] gap-4 sm:grid-cols-2">
        {skills?.map((s) => (
          <li key={s.id}>
            <a href={`#${s.id}`} className="flex h-full flex-col gap-3 rounded-lg border border-line bg-card p-5 hover:border-ink">
              <div className="flex items-center gap-3">
                <Mark s={s} size={30} />
                <span className="font-serif text-[1.25rem] font-semibold leading-tight">{s.name}</span>
              </div>
              <p className="flex-1 text-ink-2">{s.tagline}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <PriceTag lang={lang} pricing={s.pricing} cents={s.price_cents} className="font-semibold" />
                {s.trial_days > 0 && <span className="rounded-full bg-paper-2 px-2 py-0.5">{m.trialBadge(s.trial_days)}</span>}
                {s.creator_name && <span className="text-ink-2">{m.by(s.creator_name)}</span>}
              </div>
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}

function SkillDetail({ lang, id }: { lang: Locale; id: string }) {
  const m = MARKET[lang];
  const t = UI[lang];
  const [data, setData] = useState<{ skill: SkillRow; access: AccessInfo } | null>(null);
  const [error, setError] = useState('');
  const load = useCallback(() => {
    api<{ skill: SkillRow; access: AccessInfo }>(`skills/${encodeURIComponent(id)}`).then((r) => {
      if (r.ok) setData(r.data); else setError(r.status === 404 ? m.skillMissing : errorText(lang, r.data.error));
    });
  }, [id, lang, m.skillMissing]);
  useEffect(load, [load]);

  const back = <Link href={`/${lang}/market`} className="mb-4 inline-flex min-h-11 items-center text-ink-2 underline underline-offset-4 hover:text-ink">{m.backToList}</Link>;
  if (error) return <>{back}<Notice tone="error">{error}</Notice></>;
  if (!data) return <>{back}<p className="text-ink-2">{m.loading}</p></>;
  const { skill, access } = data;

  return (
    <>
      {back}
      <div className="mb-6 max-w-[720px]">
        <div className="mb-3 flex items-center gap-3">
          <Mark s={skill} size={30} />
          {skill.creator_name && <span className="text-sm text-ink-2">{m.by(skill.creator_name)}</span>}
        </div>
        <h1 className="font-serif text-[2rem] font-semibold leading-tight">{skill.name}</h1>
        <p className="mt-2 text-[1.05rem] text-ink-2">{skill.tagline}</p>
        {skill.description && <p className="mt-4 whitespace-pre-line leading-relaxed">{skill.description}</p>}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <PriceTag lang={lang} pricing={skill.pricing} cents={skill.price_cents} className="text-[1.15rem] font-semibold" />
          {skill.trial_days > 0 && <span className="rounded-full bg-paper-2 px-2 py-0.5 text-sm">{m.trialBadge(skill.trial_days)}</span>}
        </div>
        {skill.pricing !== 'free' && <div className="mt-3"><CurrencyPicker lang={lang} /></div>}
      </div>

      <div className="mb-8"><AccessBox lang={lang} id={skill.id} skill={skill} access={access} onChange={load} /></div>

      {access.allowed && (
        <AssistantTool
          lang={lang}
          endpoint={`/api/market/run/${skill.id}`}
          href={`/${lang}/market#${skill.id}`}
          skill={{
            slug: `market-${skill.id}`, name: skill.name, tagline: skill.tagline, ask: skill.name, about: skill.description,
            gives: [], group: 'İş', kind: 'assistant', access: skill.pricing === 'free' ? 'free' : 'pro',
            tone: toneFor(skill.id), mark: markFor(skill.name), submitLabel: t.runBtn,
            fields: [{ name: 'request', label: skill.input_label || t.yourRequest, type: 'textarea', required: true, rows: 6, placeholder: t.yourRequestPh }],
          }}
        />
      )}
    </>
  );
}
