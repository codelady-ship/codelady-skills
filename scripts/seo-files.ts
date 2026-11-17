// Writes robots.txt, sitemap.xml and llms.txt into the static export (out/).
// Run by scripts/build-demo.mjs after `next build`:
//   node --import ./tests/helpers/hooks.mjs scripts/seo-files.ts <outDir>
// (Next's robots/sitemap routes need force-static in an export, which the
// server build's cacheComponents does not allow, so the files are written here.)
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { DEFAULT_LOCALE, LOCALES } from '../src/i18n/config';
import { SKILLS } from '../src/skills/registry';
import { localizeSkill } from '../src/i18n/skills';
import { UI } from '../src/i18n/ui';
import { SITE_URL, languageAlternates, pageUrl } from '../src/lib/site';

const out = process.argv[2];
if (!out) throw new Error('usage: seo-files.ts <outDir>');

const PATHS = ['', '/library', '/market', ...SKILLS.map((s) => `/skills/${s.slug}`)];
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${PATHS.map((path) => `<url>
<loc>${esc(pageUrl(DEFAULT_LOCALE, path))}</loc>
${Object.entries(languageAlternates(path)).map(([l, href]) => `<xhtml:link rel="alternate" hreflang="${l}" href="${esc(href)}" />`).join('\n')}
<changefreq>weekly</changefreq>
<priority>${path === '' ? '1.0' : path.startsWith('/skills/') ? '0.8' : '0.5'}</priority>
</url>`).join('\n')}
</urlset>
`;

// On GitHub Pages crawlers read only the domain root's robots.txt; this copy
// documents the sitemap and becomes the real one on a root domain.
const robots = `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`;

const skills = SKILLS.map((s) => localizeSkill(s, 'en'));
const llms = `# Codelady Skills

> ${UI.en.metaDescription} Small, focused AI helpers by Antiqa Jalilova (Baku): each skill is a short form that turns a few answers into a ready result. This public build is a demo with sample answers.

Languages: ${LOCALES.join(', ')}. Every page exists in each language under /{lang}/.

## Skills

${skills.map((s) => `- [${s.name}](${pageUrl('en', `/skills/${s.slug}`)}): ${s.tagline}`).join('\n')}

## Other pages

- [Home](${pageUrl('en')}): all skills with what each one gives
- [Library](${pageUrl('en', '/library')}): ${UI.en.libraryLead}
- [Marketplace](${pageUrl('en', '/market')}): skills made by other people

## Source and machine-readable files

- [Source code (MIT)](https://github.com/codelady-ship/codelady-skills)
- [Sitemap](${SITE_URL}/sitemap.xml)
`;

writeFileSync(join(out, 'sitemap.xml'), sitemap);
writeFileSync(join(out, 'robots.txt'), robots);
writeFileSync(join(out, 'llms.txt'), llms);
console.log(`[seo-files] sitemap.xml (${PATHS.length} pages x ${LOCALES.length} languages), robots.txt, llms.txt`);
