'use client';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useRouter } from 'next/navigation';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { removeHistory, useHistory } from '@/lib/history';

const subscribeHash = (l: () => void) => {
  window.addEventListener('hashchange', l);
  return () => window.removeEventListener('hashchange', l);
};

/** /[lang]/history#<id>: one saved result, as it was. */
export function HistoryView({ lang }: { lang: Locale }) {
  const t = UI[lang];
  const router = useRouter();
  const id = useSyncExternalStore(subscribeHash, () => location.hash.slice(1), () => '');
  const item = useHistory().find((h) => h.id === id);
  const [copied, setCopied] = useState(false);

  if (!id) return null;
  if (!item) return <p className="max-w-[640px] rounded-lg bg-paper-2 p-5">{t.historyNotFound}</p>;

  async function copy() {
    await navigator.clipboard.writeText(item!.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="max-w-[760px]">
      <div className="mb-6 flex items-center gap-3">
        <span aria-hidden className="grid h-9 w-9 place-items-center rounded-[6px] font-mono text-sm text-white" style={{ background: item.tone }}>{item.mark}</span>
        <div className="min-w-0">
          <p className="text-sm text-ink-2">
            {item.skillName} · {new Date(item.at).toLocaleString(lang, { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
          <h1 className="line-clamp-2 font-serif text-[1.4rem] font-semibold leading-tight">{item.title || item.skillName}</h1>
        </div>
      </div>

      <section className="rounded-xl border-2 border-ink/80 bg-card p-5 md:p-7">
        {item.kind === 'voice' ? (
          <>
            <p className="mb-3 text-sm text-ink-2">{t.historyVoice}</p>
            <p lang="az" className="whitespace-pre-wrap leading-relaxed">{item.text}</p>
          </>
        ) : (
          <div className="prose-answer">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: (p) => <a {...p} target="_blank" rel="noopener noreferrer" /> }}>
              {item.text}
            </ReactMarkdown>
          </div>
        )}
        {item.sources.length > 0 && (
          <div className="mt-6 border-t border-line pt-4">
            <p className="mb-2 text-sm font-medium">{t.sources}</p>
            <ul className="space-y-1 text-sm">
              {item.sources.map((s) => (
                <li key={s.url}><a className="text-teal underline underline-offset-4" href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a></li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="button" onClick={copy} className="min-h-12 rounded-md bg-ink px-5 font-medium text-paper hover:opacity-90">
          {copied ? t.copied : t.copy}
        </button>
        <Link href={item.href} className="inline-flex min-h-12 items-center rounded-md border-2 border-line px-5 font-medium hover:bg-paper-2">
          {t.historyReopen} →
        </Link>
        <button type="button" onClick={() => { removeHistory(item.id); router.push(`/${lang}`); }}
          className="min-h-12 rounded-md px-3 font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
          {t.historyDelete}
        </button>
      </div>
    </div>
  );
}
