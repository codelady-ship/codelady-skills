'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { clearHistory, useHistory, type HistoryItem } from '@/lib/history';

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function List({ lang, onPick }: { lang: Locale; onPick?: () => void }) {
  const t = UI[lang];
  const items = useHistory();
  if (!items.length) return <p className="px-1 text-[0.95rem] leading-relaxed text-ink-2">{t.historyEmpty}</p>;

  const today = startOfToday();
  const groups: [string, HistoryItem[]][] = [
    [t.historyToday, items.filter((h) => h.at >= today)],
    [t.historyEarlier, items.filter((h) => h.at < today)],
  ];
  const time = (at: number) =>
    new Date(at).toLocaleString(lang, at >= today ? { hour: '2-digit', minute: '2-digit' } : { day: 'numeric', month: 'short' });

  return (
    <>
      {groups.map(([label, list]) =>
        list.length ? (
          <div key={label} className="mb-4">
            <p className="mb-1.5 px-1 text-[0.8rem] text-ink-2">{label}</p>
            <ul className="space-y-0.5">
              {list.map((h) => (
                <li key={h.id}>
                  <Link href={`/${lang}/history#${h.id}`} onClick={onPick}
                    className="flex gap-2.5 rounded-md px-2 py-2 hover:bg-paper-2">
                    <span aria-hidden className="mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-[6px] font-mono text-[0.75rem] text-white"
                      style={{ background: h.tone }}>
                      {h.mark}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-[0.93rem]">{h.title || h.skillName}</span>
                      <span className="block truncate text-[0.78rem] text-ink-2">{h.skillName} · {time(h.at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null,
      )}
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-line px-1 pt-3 text-[0.8rem] text-ink-2">
        <span>{t.historyNote}</span>
        <button type="button" onClick={clearHistory} className="shrink-0 underline underline-offset-4 hover:text-ink">{t.historyClear}</button>
      </div>
    </>
  );
}

/** Right column on wide screens, like a chat app's list of past conversations. */
export function HistoryPanel({ lang }: { lang: Locale }) {
  const t = UI[lang];
  return (
    <aside aria-label={t.historyTitle} className="hidden w-64 shrink-0 xl:block">
      <div className="sticky top-8 max-h-[calc(100dvh-4rem)] overflow-y-auto pr-1">
        <p className="mb-3 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-2">{t.historyTitle}</p>
        <List lang={lang} />
      </div>
    </aside>
  );
}

/** Button + slide-in drawer for screens without the right column. */
export function HistoryButton({ lang }: { lang: Locale }) {
  const t = UI[lang];
  const [open, setOpen] = useState(false);
  const count = useHistory().length;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-expanded={open}
        className="flex h-11 min-w-11 shrink-0 items-center justify-center gap-2 rounded-lg border border-line bg-card px-3 text-[0.95rem] hover:bg-paper-2 xl:hidden">
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 7v5l3 2" />
        </svg>
        <span className="hidden sm:inline">{t.historyButton}</span>
        {count > 0 && <span className="rounded-full bg-ink px-1.5 font-mono text-[0.75rem] text-paper">{count}</span>}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 xl:hidden" role="dialog" aria-modal="true" aria-label={t.historyTitle}>
          <button type="button" aria-label={t.close} onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/30" />
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col bg-paper shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <p className="font-semibold">{t.historyTitle}</p>
              <button type="button" onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-md hover:bg-paper-2" aria-label={t.close}>✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              <List lang={lang} onPick={() => setOpen(false)} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
