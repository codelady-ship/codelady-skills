'use client';

import type { Locale } from '@/i18n/config';
import { IS_DEMO } from '@/lib/base';
import { installDemoApi } from './mock-api';

// Runs when the module loads, before any component asks /api/* for data.
if (IS_DEMO && typeof window !== 'undefined') installDemoApi();

const TEXT: Partial<Record<Locale, string>> & { en: string } = {
  az: 'Demo versiya: cavablar nümunədir, AI və ödəniş qoşulmayıb. Ödənişli skill-lərin mətni bu açıq versiyada yoxdur.',
  en: 'Demo version: answers are samples, no AI or payments are connected. Paid skill content is not part of this public build.',
  ru: 'Демо-версия: ответы — примеры, ИИ и оплата не подключены. Платные навыки в эту открытую версию не входят.',
  tr: 'Demo sürüm: yanıtlar örnektir, yapay zekâ ve ödeme bağlı değil. Ücretli skill içerikleri bu açık sürümde yok.',
};

/** Thin strip at the top of every page of the static demo. */
export function DemoMode({ lang }: { lang: Locale }) {
  return (
    <div role="note" className="bg-ink px-4 py-2 text-center text-sm text-paper">
      <strong className="mr-1 rounded bg-paper px-1.5 py-0.5 font-mono text-xs text-ink">DEMO</strong> {TEXT[lang] || TEXT.en}{' '}
      <a href="https://github.com/codelady-ship/codelady-skills" className="inline-flex min-h-11 items-center px-1 align-middle underline underline-offset-4" target="_blank" rel="noopener noreferrer">GitHub</a>
    </div>
  );
}
