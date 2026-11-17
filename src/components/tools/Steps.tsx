import { UI } from '@/i18n/ui';
import type { Locale } from '@/i18n/config';

export function Steps({ current, labels, lang }: { current: number; labels: string[]; lang: Locale }) {
  return (
    <ol className="mb-6 grid gap-2 sm:grid-cols-3" aria-label={UI[lang].stepsLabel}>
      {labels.map((l, i) => {
        const n = i + 1;
        const state = n < current ? 'done' : n === current ? 'now' : 'next';
        return (
          <li key={l} aria-current={state === 'now' ? 'step' : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[0.98rem] ${
              state === 'now' ? 'bg-ink text-paper' : state === 'done' ? 'bg-paper-2' : 'text-ink-2'
            }`}>
            <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full font-mono text-sm ${
              state === 'now' ? 'bg-paper text-ink' : state === 'done' ? 'bg-teal text-white' : 'border border-line'
            }`}>
              {state === 'done' ? '✓' : n}
            </span>
            <span className="leading-snug">{l}</span>
          </li>
        );
      })}
    </ol>
  );
}
