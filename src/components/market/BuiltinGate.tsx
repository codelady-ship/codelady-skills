'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';
import { api } from '@/lib/market/client';
import type { AccessInfo, SkillRow } from '@/lib/market/types';
import { AccessBox } from './AccessBox';
import { PriceTag } from './ui';

/**
 * Wraps a built-in skill's tool. Free built-ins (the normal case) render the tool unchanged.
 * When the admin has priced one, visitors without access see the price and Buy / Trial instead.
 * /api/run/[slug] enforces the same rule on the server.
 */
export function BuiltinGate({ lang, slug, children }: { lang: Locale; slug: string; children: React.ReactNode }) {
  const [state, setState] = useState<{ skill: SkillRow | null; access: AccessInfo } | null>(null);
  const load = useCallback(() => {
    api<{ skill: SkillRow | null; access: AccessInfo }>(`skills/builtin:${slug}`).then((r) => {
      // Marketplace not set up or unreachable: behave exactly as before.
      setState(r.ok ? r.data : { skill: null, access: { allowed: true, via: 'free' } });
    });
  }, [slug]);
  useEffect(load, [load]);

  const skill = state?.skill;
  if (!skill || skill.pricing === 'free') return <>{children}</>;
  return (
    <>
      <p className="mb-3 flex flex-wrap items-center gap-3">
        <PriceTag lang={lang} pricing={skill.pricing} cents={skill.price_cents} className="text-[1.1rem] font-semibold" />
        {skill.trial_days > 0 && <span className="rounded-full bg-paper-2 px-2 py-0.5 text-sm">{MARKET[lang].trialBadge(skill.trial_days)}</span>}
      </p>
      <div className="mb-8"><AccessBox lang={lang} id={`builtin:${slug}`} skill={skill} access={state!.access} onChange={load} /></div>
      {state!.access.allowed && children}
    </>
  );
}
