import Image from 'next/image';
import Link from 'next/link';
import type { Locale } from "@/i18n/config";
import logo from '../../public/logo.png';

export function Brand({ lang, className = '' }: { lang: Locale; className?: string }) {
  return (
    <Link href={`/${lang}`} className={`flex min-h-11 min-w-0 items-center gap-2.5 sm:gap-3 ${className}`}>
      <Image src={logo} alt="" width={44} height={44} priority className="h-10 w-10 shrink-0 rounded-[10px] sm:h-11 sm:w-11" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-[1.2rem] font-semibold tracking-tight sm:text-[1.3rem]">codelady</span>
        <span lang="en" className="mt-1 font-mono text-[0.75rem] uppercase tracking-[0.14em] text-ink-2">skills</span>
      </span>
    </Link>
  );
}
