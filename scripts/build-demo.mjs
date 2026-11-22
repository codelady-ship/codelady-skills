// Builds the static demo (no server, no keys) into out/ for GitHub Pages.
//   npm run build:demo                       → base path /codelady-skills
//   BASE_PATH= npm run build:demo            → served from the domain root
// The API routes and the language proxy need a server, so they are moved aside during
// the build and put back afterwards; the browser answers /api/* with sample data
// (src/demo/mock-api.ts). No skill instructions (SKILL.md) are read or bundled.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const base = process.env.BASE_PATH ?? '/codelady-skills';
const stash = join(root, '.demo-stash');
const aside = ['src/app/api', 'src/proxy.ts'];

if (existsSync(stash)) {
  console.error('[build-demo] .demo-stash exists: a previous run did not finish. Move its contents back to src/ first.');
  process.exit(1);
}
mkdirSync(stash);
const moved = [];
let status = 1;
try {
  for (const rel of aside) {
    const from = join(root, rel);
    if (!existsSync(from)) continue;
    const to = join(stash, rel.replace(/\//g, '__'));
    renameSync(from, to);
    moved.push([to, from]);
  }
  rmSync(join(root, '.next'), { recursive: true, force: true });
  const next = join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
  const run = spawnSync(process.execPath, [next, 'build'], {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NEXT_PUBLIC_DEMO: '1', NEXT_PUBLIC_BASE_PATH: base, NEXT_TELEMETRY_DISABLED: '1' },
  });
  status = run.status ?? 1;
} finally {
  for (const [to, from] of moved.reverse()) renameSync(to, from);
  rmSync(stash, { recursive: true, force: true });
}
if (status !== 0) process.exit(status);

// The root has no page (the proxy used to pick the language): send visitors to theirs.
const out = join(root, 'out');
const LOCALES = ['az', 'en', 'ru', 'tr', 'de', 'fr', 'es', 'it', 'pt', 'pl', 'uk', 'kk', 'uz', 'ka'];
writeFileSync(join(out, 'index.html'), `<!doctype html><html lang="az"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><meta name="darkreader-lock"><title>Codelady Skills (demo)</title>
<script>(function(){var L=${JSON.stringify(LOCALES)},c='az';try{var m=document.cookie.match(/(?:^|; )lang=([a-z]+)/),s=m&&m[1];if(L.indexOf(s)>=0)c=s;else{var n=(navigator.languages||[navigator.language||'']);for(var i=0;i<n.length;i++){var x=String(n[i]).toLowerCase().split('-')[0];if(L.indexOf(x)>=0){c=x;break}}}}catch(e){}location.replace('${base}/'+c+'/')})()</script>
<noscript><meta http-equiv="refresh" content="0;url=${base}/az/"></noscript></head>
<body><a href="${base}/az/">Codelady Skills</a></body></html>
`);
writeFileSync(join(out, '.nojekyll'), '');

// robots.txt, sitemap.xml and llms.txt with absolute URLs under the base path (scripts/seo-files.ts).
const seo = spawnSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', '--import', './tests/helpers/hooks.mjs', 'scripts/seo-files.ts', out], {
  cwd: root,
  stdio: 'inherit',
  env: { ...process.env, NEXT_PUBLIC_DEMO: '1', NEXT_PUBLIC_BASE_PATH: base },
});
if (seo.status !== 0) process.exit(seo.status ?? 1);

// The export writes segment payloads as folders (__next.$d$lang/skills/$d$slug/__PAGE__.txt),
// but the router prefetches them as one dotted file name (__next.$d$lang.skills.$d$slug.__PAGE__.txt).
// A plain static host has no rewrite, so put a copy under the dotted name too.
let flat = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (!statSync(p).isDirectory()) continue;
    if (name.startsWith('__next.')) {
      const files = (function list(d, rel) {
        return readdirSync(d).flatMap((n) => statSync(join(d, n)).isDirectory() ? list(join(d, n), [...rel, n]) : [[join(d, n), [...rel, n]]]);
      })(p, []);
      for (const [file, rel] of files) { copyFileSync(file, join(dir, [name, ...rel].join('.'))); flat++; }
    } else walk(p);
  }
}
walk(out);
console.log(`[build-demo] ${flat} prefetch payloads copied to dotted names`);
console.log(`[build-demo] out/ ready (base path "${base}")`);
