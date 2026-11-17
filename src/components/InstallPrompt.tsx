'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useId, useState, useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { IS_DEMO, withBase } from '@/lib/base';

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

// Chrome can fire beforeinstallprompt before React hydrates, so it is caught as soon as
// this module loads. preventDefault() keeps Chrome's own mini bar away: we ask once, calmly.
let deferred: InstallEvent | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as InstallEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    save('install', 'done');
    emit();
  });
}
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => void listeners.delete(l);
};

function read(key: string) {
  try { return localStorage.getItem(key); } catch { return null; }
}
function save(key: string, value: string) {
  try { localStorage.setItem(key, value); } catch {}
}

/** Asks after the visitor has looked around a bit: second visit or 25 seconds on the site. */
const WAIT_MS = 25_000;

/**
 * "Add Codelady Skills to your computer / phone" card.
 * Chrome, Edge, Android: our card, then the browser's own install dialog.
 * iPhone and iPad Safari: the two steps, since Safari has no install dialog.
 * A small card at the bottom, never a modal. "Not now" hides it for good.
 */
export function InstallPrompt({ lang }: { lang: Locale }) {
  const t = UI[lang];
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const [mode, setMode] = useState<'prompt' | 'ios' | null>(null);
  const [device, setDevice] = useState<'phone' | 'computer'>('computer');
  const titleId = useId();
  // Only on the home page: on a tool page the card would sit on top of the form.
  const home = /^\/[a-z]{2}\/?$/.test(usePathname() || '');

  useEffect(() => {
    if (!IS_DEMO) navigator.serviceWorker?.register('/sw.js').catch(() => {});
  }, []);

  useEffect(() => {
    if (read('install') || window.matchMedia('(display-mode: standalone)').matches) return;
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) || (ua.includes('Macintosh') && navigator.maxTouchPoints > 1);
    const iosSafari = ios && /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
    if (!canPrompt && !iosSafari) return;

    const visits = Number(read('visits') || 0);
    const delay = visits >= 1 ? 2_000 : WAIT_MS;
    const timer = setTimeout(() => {
      setDevice(window.matchMedia('(pointer: coarse)').matches ? 'phone' : 'computer');
      setMode(canPrompt ? 'prompt' : 'ios');
    }, delay);
    return () => clearTimeout(timer);
  }, [canPrompt]);

  // Counts visits once per browser session.
  useEffect(() => {
    try {
      if (!sessionStorage.getItem('counted')) {
        sessionStorage.setItem('counted', '1');
        save('visits', String(Number(read('visits') || 0) + 1));
      }
    } catch {}
  }, []);

  if (!home || !mode || (mode === 'prompt' && !canPrompt)) return null;

  function dismiss() {
    save('install', 'no');
    setMode(null);
  }

  async function install() {
    const e = deferred;
    if (!e) return setMode(null);
    deferred = null;
    emit();
    await e.prompt();
    const { outcome } = await e.userChoice;
    save('install', outcome === 'accepted' ? 'done' : 'no');
    setMode(null);
  }

  return (
    <aside
      aria-labelledby={titleId}
      onKeyDown={(e) => { if (e.key === 'Escape') dismiss(); }}
      className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-50 mx-auto max-w-md rounded-2xl border-2 border-line bg-card p-4 shadow-xl shadow-ink/10 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:w-[24rem] sm:p-5"
    >
      <div className="flex items-start gap-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={withBase('/icons/icon-192.png')} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-xl" />
        <div className="min-w-0">
          <h2 id={titleId} className="text-[1.15rem] font-semibold leading-snug">{t.installTitle[device]}</h2>
          <p className="mt-1 text-[0.95rem] leading-relaxed text-ink-2">{mode === 'ios' ? t.iosText : t.installText[device]}</p>
        </div>
      </div>

      {mode === 'ios' && (
        <ol className="mt-3 space-y-2 border-t border-line pt-3 text-[0.95rem]">
          <li className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-2" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
              </svg>
            </span>
            {t.iosStep1}
          </li>
          <li className="flex items-center gap-3">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-paper-2" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <rect x="4" y="4" width="16" height="16" rx="3" />
                <path d="M12 8v8M8 12h8" />
              </svg>
            </span>
            {t.iosStep2}
          </li>
        </ol>
      )}

      <div className="mt-4 flex justify-end gap-2">
        {mode === 'ios' ? (
          <button type="button" onClick={dismiss} className="min-h-11 rounded-lg bg-ink px-5 font-medium text-paper hover:opacity-90">
            {t.gotIt}
          </button>
        ) : (
          <>
            <button type="button" onClick={dismiss} className="min-h-11 rounded-lg px-4 font-medium text-ink-2 hover:bg-paper-2 hover:text-ink">
              {t.notNow}
            </button>
            <button type="button" onClick={install} className="min-h-11 rounded-lg bg-ink px-5 font-medium text-paper hover:opacity-90">
              {t.installBtn}
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
