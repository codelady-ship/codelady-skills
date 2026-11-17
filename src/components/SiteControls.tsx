'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { LOCALES, LOCALE_LABEL, LOCALE_NAME, type Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';

function remember(l: Locale) {
  document.cookie = `lang=${l}; path=/; max-age=31536000; samesite=lax`;
}

/** Language list (opens on click, scrolls) and the day/night button. */
export function SiteControls({ lang, className = '' }: { lang: Locale; className?: string }) {
  const t = UI[lang];
  const pathname = usePathname() || `/${lang}`;
  const rest = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '');
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const listId = useId();

  // Switching language rebuilds <html>, which drops the saved day/night choice: put it back.
  useEffect(() => {
    try {
      const saved = localStorage.getItem('theme');
      if (saved === 'dark' || saved === 'light') document.documentElement.dataset.theme = saved;
    } catch {}
  }, [lang]);

  // Close the list on a click outside it or on Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    // Bring the current language into view inside the scrolling list.
    box.current?.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest' });
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // The icon and its label follow the theme through CSS (globals.css), so nothing flips after loading.
  function toggleTheme() {
    const root = document.documentElement;
    const isDark = root.dataset.theme ? root.dataset.theme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = isDark ? 'light' : 'dark';
    try { localStorage.setItem('theme', root.dataset.theme); } catch {}
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div ref={box} className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`${t.chooseLanguage}: ${LOCALE_NAME[lang]}`}
          className="flex h-11 items-center gap-2 rounded-lg border border-line bg-card px-2.5 text-[0.95rem] hover:bg-paper-2 sm:px-3"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9c-2.6-2.6-3.8-5.6-3.8-9S9.4 5.6 12 3Z" />
          </svg>
          <span lang={lang} className="hidden sm:inline">{LOCALE_NAME[lang]}</span>
          <span aria-hidden className="font-mono text-[0.85rem] sm:hidden">{LOCALE_LABEL[lang]}</span>
          <span aria-hidden className={`hidden text-ink-2 transition sm:inline ${open ? 'rotate-180' : ''}`}>⌄</span>
        </button>

        {open && (
          <div
            id={listId}
            className="absolute right-0 top-13 z-40 w-56 lg:left-0 lg:right-auto overflow-hidden rounded-xl border border-line bg-card shadow-lg shadow-ink/10"
          >
            <p className="border-b border-line px-3 py-2 font-mono text-[0.75rem] uppercase tracking-[0.12em] text-ink-2">{t.chooseLanguage}</p>
            <ul className="max-h-72 overflow-y-auto overscroll-contain py-1">
              {LOCALES.map((l) => (
                <li key={l}>
                  <Link
                    href={`/${l}${rest}`}
                    hrefLang={l}
                    aria-current={l === lang ? 'true' : undefined}
                    onClick={() => { remember(l); setOpen(false); }}
                    className={`flex min-h-11 items-center justify-between gap-3 px-3 text-[0.98rem] hover:bg-paper-2 ${
                      l === lang ? 'font-semibold' : ''
                    }`}
                  >
                    <span lang={l}>{LOCALE_NAME[l]}</span>
                    <span className="font-mono text-[0.75rem] text-ink-2">{l === lang ? '✓' : LOCALE_LABEL[l]}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={toggleTheme}
        className="grid h-11 w-11 place-items-center rounded-lg border border-line bg-card text-ink hover:bg-paper-2"
      >
        <span className="theme-when-light">
          <span className="sr-only">{t.themeToDark}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
            <path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z" />
          </svg>
        </span>
        <span className="theme-when-dark">
          <span className="sr-only">{t.themeToLight}</span>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.2M12 19.3v2.2M2.5 12h2.2M19.3 12h2.2M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6" />
          </svg>
        </span>
      </button>
    </div>
  );
}
