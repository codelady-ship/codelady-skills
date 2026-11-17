'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import type { Skill } from '@/skills/types';
import { Field } from './Field';
import { Steps } from './Steps';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { addHistory, titleFrom } from '@/lib/history';

type Result = { text: string; engine: string; sources: { title: string; url: string }[] };

/** endpoint/extraBody: used by skills visitors add themselves (they run through /api/run-custom). */
export function AssistantTool({ skill, lang, endpoint, extraBody, href }: {
  skill: Omit<Skill, 'buildRequest'>;
  lang: Locale;
  endpoint?: string;
  extraBody?: Record<string, unknown>;
  /** Where this tool lives, for the history list (defaults to the built-in skill page) */
  href?: string;
}) {
  const t = UI[lang];
  const submitLabel = skill.submitLabel || t.send;
  const fields = skill.fields || [];
  const main = fields.filter((f) => !f.optional);
  const extra = fields.filter((f) => f.optional);
  const blank = () => Object.fromEntries(fields.map((f) => [f.name, f.type === 'select' ? f.options?.[0] || '' : '']));

  const [values, setValues] = useState<Record<string, string>>(blank);
  const [showExtra, setShowExtra] = useState(false);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!busy) return;
    const t = setInterval(() => setTick((n) => n + 1), 4000);
    return () => clearInterval(t);
  }, [busy]);

  const set = (name: string, v: string) => setValues((s) => ({ ...s, [name]: v }));
  const filled = main.filter((f) => f.required).every((f) => values[f.name]?.trim());
  const step = result ? 3 : filled ? 2 : 1;

  function useExample() {
    if (!skill.example) return;
    setValues({ ...blank(), ...skill.example });
    setResult(null); setError('');
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setTick(0); setError(''); setResult(null);
    try {
      const res = await fetch(endpoint || `/api/run/${skill.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ values, lang, ...extraBody }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.genericError);
      setResult(data);
      {
        addHistory({
          lang, href: href || `/${lang}/skills/${skill.slug}`, skillName: skill.name, tone: skill.tone, mark: skill.mark,
          title: titleFrom(values), kind: 'answer', text: data.text, sources: data.sources || [],
        });
      }
      requestAnimationFrame(() => document.getElementById('answer')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.genericError);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  function restart() {
    setValues(blank()); setResult(null); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="max-w-[760px]">
      <Steps
        current={step}
        labels={[t.stepFill, t.stepPress(submitLabel), t.stepGet]}
        lang={lang}
      />

      {skill.example && !result && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-lg bg-paper-2 px-4 py-3">
          <span className="text-[1rem]">{t.tryExampleQ}</span>
          <button type="button" onClick={useExample}
            className="min-h-11 rounded-md border-2 border-ink px-4 font-medium hover:bg-card">
            {t.tryExample}
          </button>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        {main.map((f, i) => (
          <Field key={f.name} lang={lang} f={f} value={values[f.name] || ''} onChange={(v) => set(f.name, v)} paste={i === 0 && f.type === 'textarea'} />
        ))}

        {extra.length > 0 && (
          <div className="rounded-lg border border-line">
            <button type="button" onClick={() => setShowExtra((s) => !s)} aria-expanded={showExtra}
              className="flex min-h-12 w-full items-center justify-between px-4 text-left text-[1rem]">
              <span>{t.optionalMore} <span className="text-ink-2">{t.optional}</span></span>
              <span aria-hidden className={`transition ${showExtra ? 'rotate-180' : ''}`}>⌄</span>
            </button>
            {showExtra && (
              <div className="space-y-6 border-t border-line p-4">
                {extra.map((f) => <Field key={f.name} lang={lang} f={f} value={values[f.name] || ''} onChange={(v) => set(f.name, v)} />)}
              </div>
            )}
          </div>
        )}

        <div className="sticky bottom-0 -mx-4 bg-paper/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0">
          <button
            type="submit"
            disabled={busy || !filled}
            className="min-h-14 w-full rounded-lg bg-ink px-6 text-[1.1rem] font-semibold text-paper hover:opacity-90 disabled:opacity-40 sm:w-auto"
          >
            {busy ? t.waiting[tick % t.waiting.length] : submitLabel}
          </button>
          {!filled && !busy && <p className="mt-2 text-sm text-ink-2">{t.fillRequired}</p>}
          {busy && <p className="mt-2 text-sm text-ink-2">{t.waitNote}</p>}
        </div>

        {error && <p role="alert" className="rounded-md border border-coral/40 bg-coral/10 px-4 py-3">{error}</p>}
      </form>

      {result && (
        <section id="answer" aria-live="polite" className="mt-10 rounded-xl border-2 border-ink/80 bg-card p-5 md:p-7">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.12em] text-ink-2">{t.result}</p>
          <div className="prose-answer">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}>
              {result.text}
            </ReactMarkdown>
          </div>
          {result.sources.length > 0 && (
            <div className="mt-6 border-t border-line pt-4">
              <p className="mb-2 text-sm font-medium">{t.sources}</p>
              <ul className="space-y-1 text-sm">
                {result.sources.map((s) => (
                  <li key={s.url}>
                    <a className="text-teal underline underline-offset-4" href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {skill.footnote && <p className="mt-6 text-sm text-ink-2">{skill.footnote}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button onClick={copy} className="min-h-12 rounded-md bg-ink px-5 font-medium text-paper hover:opacity-90">
              {copied ? t.copied : t.copy}
            </button>
            <button onClick={restart} className="min-h-12 rounded-md border-2 border-line px-5 font-medium hover:bg-paper-2">
              {t.restart}
            </button>
            <Link href={`/${lang}`} className="inline-flex min-h-12 items-center rounded-md px-3 font-medium text-ink-2 hover:text-ink">
              {t.otherTool}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
