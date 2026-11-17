'use client';

import { useState } from 'react';
import type { Locale } from '@/i18n/config';
import { MARKET, errorText } from '@/i18n/market';
import { api, reloadMe, useMe } from '@/lib/market/client';
import { Notice, btnPrimary, btnSecondary, inputCls } from './ui';
import { browserPath } from '@/lib/base';

const MOCK = { buyer: 'buyer@mock.test', creator: 'creator@mock.test', admin: 'admin@mock.test' };

/** Google button, or test accounts in mock mode. ?next=… is where to go afterwards. */
export function SignIn({ lang }: { lang: Locale }) {
  const m = MARKET[lang];
  const { loaded, user, config } = useMe();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const next = () => {
    const n = new URLSearchParams(location.search).get('next') || '';
    return /^\/(?![/\\])/.test(n) ? n : `/${lang}/market`;
  };

  async function mock(addr: string) {
    setError('');
    const r = await api('auth/mock', { email: addr });
    if (!r.ok) return setError(errorText(lang, r.data.error));
    await reloadMe();
    location.assign(browserPath(next()));
  }

  if (!loaded) return <p className="text-ink-2">{m.loading}</p>;
  if (user) return <Notice tone="ok">{m.signedInAs(user.email)}</Notice>;
  if (!config || config.authMode === 'none') return <Notice>{m.signInNotSet}</Notice>;

  if (config.authMode === 'google') {
    return (
      <a href={`/api/market/auth/google?next=${encodeURIComponent(typeof location === 'undefined' ? `/${lang}/market` : next())}`}
        className={`${btnPrimary} gap-3`}>
        <span aria-hidden className="grid h-6 w-6 place-items-center rounded-full bg-paper font-bold text-ink">G</span>
        {m.google}
      </a>
    );
  }

  return (
    <div className="max-w-[520px] space-y-5">
      <Notice>{m.mockNote}</Notice>
      <div className="flex flex-col gap-3">
        <button type="button" className={btnPrimary} onClick={() => mock(MOCK.buyer)}>{m.mockBuyer} · {MOCK.buyer}</button>
        <button type="button" className={btnSecondary} onClick={() => mock(MOCK.creator)}>{m.mockCreator} · {MOCK.creator}</button>
        <button type="button" className={btnSecondary} onClick={() => mock(MOCK.admin)}>{m.mockAdmin} · {MOCK.admin}</button>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); mock(email); }} className="space-y-2">
        <label htmlFor="mock-email" className="block font-medium">{m.mockOther}</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id="mock-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="someone@mock.test" />
          <button className={btnSecondary}>{m.mockGo}</button>
        </div>
      </form>
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}
