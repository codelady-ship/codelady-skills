'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Skill } from '@/skills/types';
import { Steps } from './Steps';
import type { Locale } from '@/i18n/config';
import { UI, PRESET_TEXT } from '@/i18n/ui';
import { addHistory } from '@/lib/history';
import { withBase } from '@/lib/base';

// Browser helpers shared with the Codelady Səs project (public/voice/*.js).
type Preset = { id: string; person: string; nativeGender: 'f' | 'm'; name: { az: string; en?: string }; desc: { az: string; en?: string } };
type Prepared = { text: string; changes: { kind: string; from: string; to: string }[]; emphasis: string[] };
type Decoded = { kind: string };
declare global {
  interface Window {
    CL_DATA?: { presets: Preset[] };
    CL_NORMALIZE?: { prepare: (t: string) => Prepared };
    CL_AUDIO?: {
      decode: (r: Response, f: string) => Promise<Decoded>;
      join: (p: Decoded[], gapMs: number) => Decoded;
      toBlob: (a: Decoded) => Blob;
      chunk: (t: string, max: number) => string[];
    };
  }
}

function loadScripts(srcs: string[]) {
  return srcs.reduce<Promise<void>>(
    (p, src) =>
      p.then(
        () =>
          new Promise<void>((res, rej) => {
            if (document.querySelector(`script[data-src="${src}"]`)) return res();
            const s = document.createElement('script');
            s.src = src; s.dataset.src = src; s.onload = () => res(); s.onerror = () => rej(new Error(src));
            document.head.appendChild(s);
          }),
      ),
    Promise.resolve(),
  );
}

const MAX = 1500;

const EXAMPLE = 'Salam! Xaricdə pulsuz oxumaq istəyirsən? 15 dekabra qədər müraciət et. Qeydiyyat 0 AZN-dir.';
const FIRST = ['semimi', 'reel', 'xeber', 'nagil'];

export function VoiceTool({ skill, lang }: { skill: Omit<Skill, 'buildRequest'>; lang: Locale }) {
  const t = UI[lang];
  const presetText = (p: Preset): [string, string] =>
    PRESET_TEXT[lang]?.[p.id] || (lang === 'az' ? [p.name.az, p.desc.az] : [p.name.en || p.name.az, p.desc.en || p.desc.az]);
  const [ready, setReady] = useState(false);
  const [text, setText] = useState('');
  const [prepared, setPrepared] = useState<Prepared | null>(null);
  const [gender, setGender] = useState<'f' | 'm'>('f');
  const [preset, setPreset] = useState('semimi');
  const [speed, setSpeed] = useState(1);
  const [allStyles, setAllStyles] = useState(false);
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [audio, setAudio] = useState<{ url: string; mock: boolean } | null>(null);

  useEffect(() => {
    loadScripts(['/voice/data.js', '/voice/normalize.js', '/voice/audio.js'].map(withBase))
      .then(() => setReady(true))
      .catch(() => setError(t.vLoadFail));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presets = useMemo(() => (ready ? window.CL_DATA?.presets || [] : []), [ready]);
  const shown = allStyles ? presets : presets.filter((p) => FIRST.includes(p.id) || p.id === preset);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const step = audio ? 3 : text.trim() ? 2 : 1;

  async function pasteText() {
    try {
      const t = await navigator.clipboard.readText();
      if (t) { setText(t); setPrepared(null); setAudio(null); }
    } catch {
      document.getElementById('vt')?.focus();
    }
  }

  async function speak() {
    const A = window.CL_AUDIO;
    if (!A || !text.trim()) return;
    setError(''); setAudio(null);
    let src = text.trim();
    let prep = prepared;
    if (!prep && window.CL_NORMALIZE) {
      prep = window.CL_NORMALIZE.prepare(src);
      setPrepared(prep);
      setText(prep.text);
      src = prep.text.trim();
    }
    const parts = A.chunk(src, MAX);
    const out: Decoded[] = [];
    let mock = false;
    try {
      for (let i = 0; i < parts.length; i++) {
        setBusy(parts.length > 1 ? t.vBusyPart(i + 1, parts.length) : t.vBusy);
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: parts[i], presetId: preset, gender, speed, emphasis: prep?.emphasis || [] }),
        });
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(t.vErrors[e.error] || e.message || t.vErrors.generic);
        }
        if (res.headers.get('X-Engine') === 'mock') mock = true;
        out.push(await A.decode(res, res.headers.get('X-Audio-Format') || 'wav'));
      }
      const blob = A.toBlob(A.join(out, 250));
      setAudio({ url: URL.createObjectURL(blob), mock });
      {
        addHistory({
          lang, href: `/${lang}/skills/${skill.slug}`, skillName: skill.name, tone: skill.tone, mark: skill.mark,
          title: src.split(/\s+/).slice(0, 12).join(' '), kind: 'voice', text: src, sources: [],
        });
      }
      requestAnimationFrame(() => document.getElementById('audio-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : t.vErrors.generic);
    } finally {
      setBusy('');
    }
  }

  const big = (on: boolean) =>
    `min-h-12 rounded-lg border-2 px-4 text-left transition-colors ${on ? 'border-ink bg-ink text-paper' : 'border-line bg-card hover:bg-paper-2'}`;

  return (
    <div className="max-w-[760px]">
      <Steps current={step} labels={[t.vStepText, t.vStepVoice, t.vStepListen]} lang={lang} />

      {/* 1. text */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label htmlFor="vt" className="text-[1.15rem] font-semibold">{t.vTextLabel}</label>
          <div className="flex gap-2">
            <button type="button" onClick={pasteText} className="min-h-11 rounded-md border border-line px-3 text-sm hover:bg-paper-2">{t.paste}</button>
            <button type="button" onClick={() => { setText(EXAMPLE); setPrepared(null); setAudio(null); }}
              className="min-h-11 rounded-md border border-line px-3 text-sm hover:bg-paper-2">{t.vExample}</button>
          </div>
        </div>
        <textarea
          id="vt" rows={7} value={text} maxLength={5000}
          onChange={(e) => { setText(e.target.value); setPrepared(null); }}
          lang="az"
          placeholder={t.vPlaceholder}
          className="w-full resize-y rounded-lg border-2 border-line bg-card px-4 py-3 text-[1.1rem] leading-relaxed focus:border-teal focus:outline-none"
        />
        <p className="text-sm text-ink-2">{t.vCount(words, Math.max(words ? 1 : 0, Math.round(words / 2.2)))}{t.vAzOnly && <> · {t.vAzOnly}</>}</p>
      </section>

      {/* 2. voice */}
      <section className="mt-8 space-y-4">
        <h2 className="text-[1.15rem] font-semibold">{t.vVoiceLabel}</h2>
        <div className="grid grid-cols-2 gap-3">
          <button type="button" className={big(gender === 'f')} onClick={() => setGender('f')}>{t.vFemale}</button>
          <button type="button" className={big(gender === 'm')} onClick={() => setGender('m')}>{t.vMale}</button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {shown.map((p) => (
            <button key={p.id} type="button" className={`${big(preset === p.id)} py-2.5`}
              onClick={() => { setPreset(p.id); setGender(p.nativeGender); }}>
              <span className="font-semibold">{presetText(p)[0]}</span>
              <span className={`block text-sm ${preset === p.id ? 'text-paper/75' : 'text-ink-2'}`}>{presetText(p)[1]}</span>
            </button>
          ))}
          {!ready && <p className="text-ink-2">{t.vLoading}</p>}
        </div>
        {ready && presets.length > FIRST.length && (
          <button type="button" onClick={() => setAllStyles((s) => !s)} className="min-h-11 text-[1rem] font-medium text-teal underline underline-offset-4">
            {allStyles ? t.vFewer : t.vAllStyles(presets.length)}
          </button>
        )}
        <details className="rounded-lg border border-line px-4 py-1">
          <summary className="flex min-h-11 cursor-pointer items-center gap-1 text-[1rem]">{t.vSpeed} <span className="text-ink-2">{t.optional}</span></summary>
          <div className="mb-3 mt-1 flex min-h-11 items-center gap-4">
            <input type="range" min={0.8} max={1.2} step={0.05} value={speed} aria-label={t.vSpeed}
              onChange={(e) => setSpeed(Number(e.target.value))} className="h-11 w-full accent-[var(--coral)]" />
            <span className="w-14 font-mono text-sm">{speed.toFixed(2)}×</span>
          </div>
        </details>
      </section>

      <div className="sticky bottom-0 -mx-4 mt-8 bg-paper/95 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:bg-transparent sm:px-0 sm:py-0">
        <button onClick={speak} disabled={!ready || !text.trim() || !!busy}
          className="min-h-14 w-full rounded-lg bg-coral px-6 text-[1.15rem] font-semibold text-white hover:opacity-90 disabled:opacity-40 sm:w-auto">
          {busy || t.vSpeak}
        </button>
        {!text.trim() && <p className="mt-2 text-sm text-ink-2">{t.vNeedText}</p>}
      </div>

      {error && <p role="alert" className="mt-4 rounded-md border border-coral/40 bg-coral/10 px-4 py-3">{error}</p>}

      {/* 3. result */}
      {audio && (
        <section id="audio-result" className="mt-8 rounded-xl border-2 border-ink/80 bg-card p-5">
          <h2 className="mb-3 text-[1.15rem] font-semibold">{t.vListen}</h2>
          {audio.mock && <p className="mb-3 text-sm text-ink-2">{t.vMock}</p>}
          <audio controls src={audio.url} className="w-full" />
          <div className="mt-4 flex flex-wrap gap-3">
            <a href={audio.url} download="seslendirme.wav" className="inline-flex min-h-12 items-center rounded-md bg-ink px-5 font-medium text-paper hover:opacity-90">
              {t.vDownload}
            </a>
            <button onClick={() => { setText(''); setPrepared(null); setAudio(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              className="min-h-12 rounded-md border-2 border-line px-5 font-medium hover:bg-paper-2">
              {t.vNew}
            </button>
          </div>
          {prepared && prepared.changes.length > 0 && (
            <details className="mt-5 text-sm">
              <summary className="cursor-pointer">{t.vChanges(prepared.changes.length)}</summary>
              <ul className="mt-2 max-h-40 space-y-1 overflow-auto font-mono text-[0.82rem]">
                {prepared.changes.slice(0, 40).map((c, i) => (
                  <li key={i}><span className="text-ink-2 line-through">{c.from}</span> → {c.to}</li>
                ))}
              </ul>
            </details>
          )}
          {skill.footnote && <p className="mt-4 text-xs text-ink-2">{skill.footnote}</p>}
        </section>
      )}
    </div>
  );
}
