import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { IBM_Plex_Sans, IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google';
import { SiteFooter } from '@/components/SiteFooter';
import { InstallPrompt } from '@/components/InstallPrompt';
import { LOCALES, hasLocale } from '@/i18n/config';
import { UI } from '@/i18n/ui';
import '../globals.css';
import { withBase, IS_DEMO } from '@/lib/base';
import { OG_IMAGE, SITE_URL } from '@/lib/site';
import { DemoMode } from '@/demo/DemoMode';

const plex = IBM_Plex_Sans({ variable: '--font-plex', subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500', '600'] });
const plexMono = IBM_Plex_Mono({ variable: '--font-plex-mono', subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '500'] });
const serif = Source_Serif_4({ variable: '--font-serif4', subsets: ['latin', 'latin-ext', 'cyrillic'], weight: ['400', '600'] });

export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<'/[lang]'>): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  return {
    metadataBase: new URL(`${SITE_URL}/`),
    title: { default: UI[lang].metaTitle, template: '%s · Codelady Skills' },
    description: UI[lang].metaDescription,
    // Pages without their own Open Graph block still get the site card.
    openGraph: { type: 'website', siteName: 'Codelady Skills', images: [OG_IMAGE] },
    twitter: { card: 'summary_large_image', images: [OG_IMAGE.url] },
    manifest: withBase(`/${lang}/manifest.webmanifest`),
    appleWebApp: { capable: true, title: 'Codelady', statusBarStyle: 'default' },
  };
}

// Sets the saved day/night choice before the first paint, so the page doesn't flash.
const THEME_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='dark'||t==='light')document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children, params }: LayoutProps<'/[lang]'>) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  return (
    <html lang={lang} suppressHydrationWarning className={`${plex.variable} ${plexMono.variable} ${serif.variable}`}>
      <head>
        <meta name="darkreader-lock" />
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh flex flex-col">
        {IS_DEMO && <DemoMode lang={lang} />}
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:bg-card focus:px-3 focus:py-2">
          {UI[lang].skipToMain}
        </a>
        <div className="flex-1">{children}</div>
        <SiteFooter lang={lang} />
        <InstallPrompt lang={lang} />
      </body>
    </html>
  );
}
