'use client';

import { useState, useSyncExternalStore } from 'react';
import type { Locale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import { withBase } from '@/lib/base';

export type InstallSource = { repo: string; ref: string; dir?: string; folder: string };

const noop = () => () => {};

type Tab = 'code' | 'app' | 'text';

function CopyButton({ text, label, done, fail }: { text: string | (() => Promise<string> | string); label: string; done: string; fail: string }) {
  const [state, setState] = useState<'idle' | 'ok' | 'fail'>('idle');
  async function copy() {
    try {
      await navigator.clipboard.writeText(typeof text === 'string' ? text : await text());
      setState('ok');
    } catch {
      setState('fail');
    }
    setTimeout(() => setState('idle'), 2200);
  }
  return (
    <div>
      <button type="button" onClick={copy} className="min-h-12 rounded-md bg-ink px-5 font-medium text-paper hover:opacity-90">
        {state === 'ok' ? done : label}
      </button>
      {state === 'fail' && <p role="alert" className="mt-2 text-sm text-coral">{fail}</p>}
    </div>
  );
}

/** Shell command that puts the skill folder into ~/.claude/skills */
function command(src: InstallSource, os: 'win' | 'mac') {
  const url = `https://github.com/${src.repo}.git`;
  if (os === 'mac') {
    return src.dir
      ? `git clone --depth 1 ${url} /tmp/cl-skill && mkdir -p ~/.claude/skills && cp -r /tmp/cl-skill/${src.dir} ~/.claude/skills/${src.folder} && rm -rf /tmp/cl-skill`
      : `git clone --depth 1 ${url} ~/.claude/skills/${src.folder}`;
  }
  const target = `"$env:USERPROFILE\\.claude\\skills\\${src.folder}"`;
  return src.dir
    ? `git clone --depth 1 ${url} "$env:TEMP\\cl-skill"; New-Item -ItemType Directory -Force "$env:USERPROFILE\\.claude\\skills" | Out-Null; Copy-Item -Recurse "$env:TEMP\\cl-skill\\${src.dir.replace(/\//g, '\\')}" ${target}; Remove-Item -Recurse -Force "$env:TEMP\\cl-skill"`
    : `git clone --depth 1 ${url} ${target}`;
}

/**
 * "Add it to your own Claude": install command for Claude Code, ZIP steps for the
 * Claude app, or the SKILL.md text to paste anywhere. Paid skills link to Agensi.
 */
export function OwnClaudePanel({ lang, source, agensiUrl }: { lang: Locale; source?: InstallSource; agensiUrl?: string }) {
  const t = UI[lang];
  const [tab, setTab] = useState<Tab>('code');
  // The visitor's system picks the first command; the buttons switch it.
  const autoOs = useSyncExternalStore<'win' | 'mac'>(noop, () => (/Windows/i.test(navigator.userAgent) ? 'win' : 'mac'), () => 'win');
  const [picked, setOs] = useState<'win' | 'mac' | null>(null);
  const os = picked ?? autoOs;

  if (!source && !agensiUrl) return null;

  const box = 'mt-12 max-w-[760px] rounded-xl border-2 border-line bg-card p-5 md:p-7';
  const heading = (
    <div className="mb-4 flex items-center gap-3">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={withBase('/icons/icon-192.png')} alt="" width={32} height={32} className="h-8 w-8 rounded-lg" />
      <h2 className="font-serif text-[1.4rem] font-semibold leading-tight">{t.ownHeading}</h2>
    </div>
  );

  if (!source) {
    return (
      <section className={box}>
        {heading}
        <p className="leading-relaxed text-ink-2">{t.ownPaidLead}</p>
        <a href={agensiUrl} target="_blank" rel="noopener noreferrer"
          className="mt-5 inline-flex min-h-12 items-center rounded-md bg-ink px-5 font-medium text-paper hover:opacity-90">
          {t.ownPaidBtn} →
        </a>
      </section>
    );
  }

  const base = `https://github.com/${source.repo}`;
  const rawUrl = `https://raw.githubusercontent.com/${source.repo}/${source.ref}/${source.dir ? `${source.dir}/` : ''}SKILL.md`;
  const zipUrl = `${base}/archive/refs/heads/${source.ref}.zip`;
  const tabs: [Tab, string][] = [['code', t.ownTabCode], ['app', t.ownTabApp], ['text', t.ownTabText]];
  const cmd = command(source, os);

  return (
    <section className={box}>
      {heading}
      <p className="mb-5 leading-relaxed text-ink-2">{t.ownLead}</p>

      <div role="tablist" className="mb-5 grid grid-cols-3 gap-1 rounded-lg bg-paper-2 p-1">
        {tabs.map(([id, label]) => (
          <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}
            className={`min-h-11 rounded-md px-2 text-[0.95rem] font-medium leading-tight ${tab === id ? 'bg-card text-ink shadow-sm' : 'text-ink-2 hover:text-ink'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'code' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {(['win', 'mac'] as const).map((o) => (
              <button key={o} type="button" aria-pressed={os === o} onClick={() => setOs(o)}
                className={`min-h-11 rounded-md border px-3 text-sm ${os === o ? 'border-ink bg-ink text-paper' : 'border-line hover:bg-paper-2'}`}>
                {o === 'win' ? t.ownWindows : t.ownMac}
              </button>
            ))}
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-lg bg-paper-2 p-4 font-mono text-[0.85rem] leading-relaxed" lang="en">{cmd}</pre>
          <p className="text-[0.95rem] text-ink-2">{t.ownCodeHint}</p>
          <CopyButton text={cmd} label={t.ownCopyCmd} done={t.copied} fail={t.ownCopyFail} />
        </div>
      )}

      {tab === 'app' && (
        <div className="space-y-4">
          {source.dir ? (
            <p className="rounded-lg bg-paper-2 p-4 leading-relaxed">{t.ownNoZip}</p>
          ) : (
            <>
              <ol className="space-y-3">
                {t.ownAppSteps.map((step, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink font-mono text-sm text-paper">{i + 1}</span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
              <a href={zipUrl} className="inline-flex min-h-12 items-center rounded-md bg-ink px-5 font-medium text-paper hover:opacity-90">
                {t.ownZip} ↓
              </a>
            </>
          )}
        </div>
      )}

      {tab === 'text' && (
        <div className="space-y-4">
          <p className="leading-relaxed">{t.ownTextLead}</p>
          <CopyButton
            label={t.ownCopyText}
            done={t.copied}
            fail={t.ownCopyFail}
            text={async () => {
              const res = await fetch(rawUrl);
              if (!res.ok) throw new Error(String(res.status));
              return res.text();
            }}
          />
        </div>
      )}

      <p className="mt-6 text-sm text-ink-2">
        {t.ownSource}:{' '}
        <a href={source.dir ? `${base}/tree/${source.ref}/${source.dir}` : base} target="_blank" rel="noopener noreferrer"
          className="break-all text-teal underline underline-offset-4">
          github.com/{source.repo}{source.dir ? `/${source.dir}` : ''}
        </a>
      </p>
    </section>
  );
}
