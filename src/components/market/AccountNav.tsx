'use client';

import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import { MARKET } from '@/i18n/market';
import { signOut, useMe } from '@/lib/market/client';

/** Marketplace links and the account (sidebar group or phone chips). */
export function AccountNav({ lang, variant }: { lang: Locale; variant: 'side' | 'chips' }) {
  const m = MARKET[lang];
  const { user, config } = useMe();
  const signInOn = config && config.authMode !== 'none';
  const links: [string, string][] = [[`/${lang}/market`, m.market]];
  if (user) {
    links.push([`/${lang}/publish`, m.publish], [`/${lang}/purchases`, m.purchases], [`/${lang}/earnings`, m.earnings]);
    if (user.isAdmin) links.push([`/${lang}/admin`, m.admin]);
  } else if (signInOn) {
    links.push([`/${lang}/signin`, m.signIn]);
  }

  if (variant === 'chips') {
    return (
      <>
        {links.map(([href, label]) => (
          <Link key={href} href={href} className="flex min-h-11 shrink-0 items-center rounded-full border border-line bg-card px-3 text-sm">{label}</Link>
        ))}
      </>
    );
  }
  return (
    <div className="mb-5">
      <ul className="space-y-0.5">
        {links.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="flex min-h-11 items-center rounded-md px-2 py-1.5 text-[0.95rem] hover:bg-paper-2 lg:pointer-fine:min-h-0">{label}</Link>
          </li>
        ))}
      </ul>
      {user && (
        <div className="mt-2 px-2 text-[0.8rem] text-ink-2">
          <p className="break-anywhere" title={user.email}>{m.signedInAs(user.email)}</p>
          <button type="button" onClick={() => signOut().then(() => location.reload())} className="mt-1 min-h-11 underline underline-offset-4 hover:text-ink lg:pointer-fine:min-h-0">
            {m.signOut}
          </button>
        </div>
      )}
    </div>
  );
}
