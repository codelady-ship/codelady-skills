'use client';

import type { Field as F } from '@/skills/types';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';

const base =
  'w-full rounded-lg border-2 border-line bg-card px-4 py-3 text-[1.05rem] text-ink placeholder:text-ink-2/60 focus:border-teal focus:outline-none';

export function Field({ f, value, onChange, paste, lang }: { f: F; value: string; onChange: (v: string) => void; paste?: boolean; lang: Locale }) {
  const id = `f-${f.name}`;
  const label = (o: string) => f.optionLabels?.[f.options?.indexOf(o) ?? -1] || o;

  async function pasteText() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) onChange(t);
    } catch {
      document.getElementById(id)?.focus();
    }
  }

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-3">
        <label htmlFor={id} className="text-[1.05rem] font-medium">
          {f.label}
          {f.required && <span className="text-coral"> *</span>}
        </label>
        {paste && (
          <button type="button" onClick={pasteText} className="min-h-11 shrink-0 rounded-md border border-line px-3 text-sm hover:bg-paper-2">
            {UI[lang].paste}
          </button>
        )}
      </div>
      {f.type === 'textarea' ? (
        <textarea id={id} rows={f.rows || 4} className={`${base} resize-y leading-relaxed`} placeholder={f.placeholder}
          value={value} onChange={(e) => onChange(e.target.value)} required={f.required} />
      ) : f.type === 'select' ? (
        f.options && f.options.length <= 4 ? (
          <div role="radiogroup" aria-labelledby={id} className="grid gap-2 sm:grid-cols-2">
            <span id={id} className="sr-only">{f.label}</span>
            {f.options.map((o) => {
              const on = (value || f.options?.[0]) === o;
              return (
                <button key={o} type="button" role="radio" aria-checked={on} onClick={() => onChange(o)}
                  className={`min-h-12 rounded-lg border-2 px-4 text-left text-[1rem] ${on ? 'border-ink bg-ink text-paper' : 'border-line bg-card hover:bg-paper-2'}`}>
                  {label(o)}
                </button>
              );
            })}
          </div>
        ) : (
          <select id={id} className={`${base} min-h-12`} value={value || f.options?.[0]} onChange={(e) => onChange(e.target.value)}>
            {f.options?.map((o) => <option key={o} value={o}>{label(o)}</option>)}
          </select>
        )
      ) : (
        <input id={id} className={`${base} min-h-12`} placeholder={f.placeholder} value={value}
          onChange={(e) => onChange(e.target.value)} required={f.required} />
      )}
      {f.hint && <p className="mt-1.5 text-sm text-ink-2">{f.hint}</p>}
    </div>
  );
}
