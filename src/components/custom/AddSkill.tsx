'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { addSkill, markFor, removeSkill, useMySkills, type MySkill } from '@/lib/my-skills';
import { SkillCard } from './SkillCard';

type Card = Omit<MySkill, 'id' | 'tone' | 'mark' | 'addedAt' | 'url'>;

const input =
  'w-full min-h-12 rounded-lg border-2 border-line bg-card px-4 py-3 text-[1.05rem] text-ink placeholder:text-ink-2/60 focus:border-teal focus:outline-none';

export function AddSkill({ lang }: { lang: Locale }) {
  const t = UI[lang];
  const mine = useMySkills();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<{ url: string; card: Card } | null>(null);
  const [savedId, setSavedId] = useState('');

  async function read(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(''); setPreview(null); setSavedId('');
    try {
      const res = await fetch('/api/skill-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, name, lang }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || t.importErrors[data.error] || t.importErrors.failed);
      setPreview(data);
      requestAnimationFrame(() => document.getElementById('preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.importErrors.failed);
    } finally {
      setBusy(false);
    }
  }

  function save() {
    if (!preview) return;
    const s = addSkill({ ...preview.card, name: name.trim() || preview.card.name, url: preview.url });
    setSavedId(s.id);
  }

  const shown = preview && { ...preview.card, name: name.trim() || preview.card.name };

  return (
    <div className="max-w-[760px]">
      <form onSubmit={read} className="space-y-6">
        <div>
          <label htmlFor="skill-url" className="mb-2 block text-[1.05rem] font-medium">
            {t.linkLabel}<span className="text-coral"> *</span>
          </label>
          <input id="skill-url" type="url" inputMode="url" required className={input} value={url}
            placeholder="https://github.com/…" onChange={(e) => setUrl(e.target.value)} />
          <p className="mt-1.5 text-sm text-ink-2">{t.linkHint}</p>
        </div>
        <div>
          <label htmlFor="skill-name" className="mb-2 block text-[1.05rem] font-medium">
            {t.nameLabel} <span className="text-ink-2">{t.optional}</span>
          </label>
          <input id="skill-name" className={input} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
          <p className="mt-1.5 text-sm text-ink-2">{t.nameHint}</p>
        </div>
        <button type="submit" disabled={busy || !url.trim()}
          className="min-h-14 w-full rounded-lg bg-ink px-6 text-[1.1rem] font-semibold text-paper hover:opacity-90 disabled:opacity-40 sm:w-auto">
          {busy ? t.reading : t.readBtn}
        </button>
        {error && <p role="alert" className="rounded-md border border-coral/40 bg-coral/10 px-4 py-3">{error}</p>}
      </form>

      {shown && preview && (
        <section id="preview" aria-live="polite" className="mt-10">
          <p className="mb-3 font-mono text-xs uppercase tracking-[0.12em] text-ink-2">{t.previewTitle}</p>
          <SkillCard lang={lang} skill={{ ...shown, tone: '#1f6f6c', mark: markFor(shown.name), url: preview.url }} />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            {savedId ? (
              <>
                <span className="font-medium text-teal">{t.saved}</span>
                <Link href={`/${lang}/my#${savedId}`} className="inline-flex min-h-12 items-center rounded-md bg-ink px-5 font-medium text-paper hover:opacity-90">
                  {t.openIt} →
                </Link>
              </>
            ) : (
              <button type="button" onClick={save} className="min-h-12 rounded-md bg-coral px-5 font-semibold text-white hover:opacity-90">
                {t.saveBtn}
              </button>
            )}
          </div>
        </section>
      )}

      <p className="mt-8 text-sm text-ink-2">{t.savedNote}</p>

      {mine.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-serif text-xl font-semibold">{t.mySkills}</h2>
          <ul className="divide-y divide-line rounded-lg border border-line bg-card">
            {mine.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <span aria-hidden className="grid h-8 w-8 place-items-center rounded-[6px] font-mono text-sm text-white" style={{ background: s.tone }}>{s.mark}</span>
                <span className="min-w-0 flex-1 font-medium">{s.name}</span>
                <Link href={`/${lang}/my#${s.id}`} className="inline-flex min-h-11 items-center rounded-md px-3 py-2 font-medium hover:bg-paper-2">{t.openIt}</Link>
                <button type="button" onClick={() => removeSkill(s.id)} className="min-h-11 rounded-md px-3 text-ink-2 hover:bg-paper-2 hover:text-ink">
                  {t.removeBtn}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
