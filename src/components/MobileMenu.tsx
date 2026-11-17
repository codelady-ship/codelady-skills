'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Phones and tablets: a menu button that opens the sidebar's links in a drawer from the left.
 * Any link click inside closes it.
 */
export function MobileMenu({ label, closeLabel, children }: { label: string; closeLabel: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeBtn.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-expanded={open} aria-label={label}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-card hover:bg-paper-2 lg:hidden">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={label}>
          <button type="button" aria-label={closeLabel} tabIndex={-1} onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/30" />
          <div className="absolute inset-y-0 left-0 flex w-[min(22rem,88vw)] flex-col bg-paper shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-2">
              <p className="font-semibold">{label}</p>
              <button ref={closeBtn} type="button" onClick={() => setOpen(false)} className="grid h-11 w-11 place-items-center rounded-md hover:bg-paper-2" aria-label={closeLabel}>✕</button>
            </div>
            <nav aria-label={label} className="flex-1 overflow-y-auto overscroll-contain p-3"
              onClick={(e) => { if ((e.target as HTMLElement).closest('a')) setOpen(false); }}>
              {children}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
