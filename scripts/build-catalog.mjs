// Builds src/skills/catalog.json: every SKILL.md in the PUBLIC repos of the
// owners below (own repos and forks). Private repos are paid products and are
// never scanned. Uses the logged-in `gh` CLI.
// Run: node scripts/build-catalog.mjs
import { execFile } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OWNERS = ['codelady-ship', 'texnoera-jt334'];
// Already on the site.
const SKIP_REPOS = new Set(['scholarship-visa-scam-checker', 'azerbaijani-voiceover-studio']);
const MAX_ENTRIES = 1500;
const CONCURRENCY = 3;
const PERMISSIVE = new Set(['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause', 'BSD-3-Clause-Clear', '0BSD', 'ISC', 'CC0-1.0', 'Unlicense', 'CC-BY-4.0']);
// Folder names that hold dependencies, test fixtures or example/template placeholders.
const EXCLUDED_DIRS = /^(node_modules|fixtures|__fixtures__|test-fixtures|testdata|test|tests|__tests__|__mocks__|template|templates|_template|skill-template|skill_template|example|examples|example-skill|example-skills|\.git)$/i;

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, 'src', 'skills', 'catalog.json');

// ---------- gh helpers ----------
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ghRaw(args) {
  return new Promise((resolve, reject) => {
    execFile('gh', args, { maxBuffer: 256 * 1024 * 1024, windowsHide: true }, (err, stdout, stderr) => {
      if (err) { err.stderr = String(stderr || ''); err.stdout = String(stdout || ''); reject(err); }
      else resolve(stdout);
    });
  });
}

/** Runs gh, retries 5xx/network errors, returns null on 404/409 (missing or empty repo). */
async function gh(args, { json = true } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      const out = await ghRaw(args);
      return json ? JSON.parse(out) : out;
    } catch (err) {
      const msg = `${err.stderr} ${err.stdout}`;
      if (/HTTP 404|Not Found|HTTP 409|Git Repository is empty/i.test(msg)) return null;
      const retryable = /HTTP 5\d\d|Bad Gateway|unexpected end of JSON|timeout|ECONNRESET|secondary rate limit|HTTP 403.*rate/i.test(msg);
      if (retryable && attempt < 4) { await sleep(2000 * (attempt + 1)); continue; }
      throw new Error(`gh ${args.join(' ')} failed: ${msg.trim().slice(0, 300)}`);
    }
  }
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) { const k = i++; results[k] = await fn(items[k], k); }
  }));
  return results;
}

// ---------- licence ----------
const licenceCache = new Map();
async function repoLicence(fullName) {
  if (licenceCache.has(fullName)) return licenceCache.get(fullName);
  const r = await gh(['api', `repos/${fullName}`]);
  const id = r?.license?.spdx_id ?? null;
  const val = id && id !== 'NOASSERTION' ? id : (id === 'NOASSERTION' ? 'NOASSERTION' : null);
  licenceCache.set(fullName, val);
  return val;
}

// ---------- tree ----------
const isExcludedPath = (path) => path.split('/').slice(0, -1).some((seg) => EXCLUDED_DIRS.test(seg));

async function listSkillPaths(full, branch, warnings) {
  const tree = await gh(['api', `repos/${full}/git/trees/${encodeURIComponent(branch)}?recursive=1`]);
  if (!tree || !Array.isArray(tree.tree)) return [];
  if (!tree.truncated) {
    return tree.tree.filter((t) => t.type === 'blob' && t.path.endsWith('SKILL.md') && !isExcludedPath(t.path)).map((t) => t.path);
  }
  // Truncated: walk folder by folder, skipping excluded folders.
  warnings.push(`${full}: tree truncated, walked folder by folder`);
  const found = [];
  const queue = [{ sha: branch, prefix: '' }];
  while (queue.length) {
    const { sha, prefix } = queue.shift();
    const t = await gh(['api', `repos/${full}/git/trees/${encodeURIComponent(sha)}`]);
    for (const e of t?.tree ?? []) {
      const p = prefix + e.path;
      if (e.type === 'tree' && !EXCLUDED_DIRS.test(e.path)) queue.push({ sha: e.sha, prefix: p + '/' });
      else if (e.type === 'blob' && p.endsWith('SKILL.md')) found.push(p);
    }
  }
  return found;
}

// ---------- frontmatter ----------
let yamlLoad = null;
try { yamlLoad = (await import('js-yaml')).load; } catch {
  try { const y = await import('yaml'); yamlLoad = y.parse; } catch { /* fallback below */ }
}

function simpleYaml(src) {
  const out = {};
  const lines = src.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    let [, key, val] = m;
    if (/^[>|][+-]?$/.test(val) || val === '') {
      const block = [];
      while (i + 1 < lines.length && (/^\s+/.test(lines[i + 1]) || lines[i + 1].trim() === '')) block.push(lines[++i].trim());
      val = block.join(' ');
    } else {
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1]) && !/^\s*-\s/.test(lines[i + 1])) val += ' ' + lines[++i].trim();
      val = val.replace(/^(['"])([\s\S]*)\1$/, '$2');
    }
    out[key] = val;
  }
  return out;
}

function parseFrontmatter(text) {
  const m = /^﻿?---\r?\n([\s\S]*?)\r?\n---\s*(\r?\n|$)/.exec(text);
  if (!m) return null;
  const src = m[1].replace(/\r/g, '');
  if (yamlLoad) { try { const d = yamlLoad(src); if (d && typeof d === 'object') return d; } catch { /* fall through */ } }
  return simpleYaml(src);
}

const collapse = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
const PLACEHOLDER = /\{\{|\}\}|<[a-z_ -]+>|\[(your|skill|insert|todo|name|description)[^\]]*\]|^todo\b|^tbd$|your[-_ ]skill[-_ ]name|^my[-_ ]skill$|^skill[-_ ]name$|^example[-_ ]skill$|^template[-_ ]?skill$|replace (this|with)|a clear description of|description of what this skill does|brief description|^description$|^name$/i;
const isPlaceholder = (s) => !s || PLACEHOLDER.test(s);

// ---------- category ----------
const CATEGORY_RULES = [
  ['Video', /video|remotion|montage|ffmpeg|youtube|tiktok|reel|animation|gsap|motion|film|subtitle|caption/],
  ['Design', /design|ui[-_ ]?ux|\bui\b|figma|css|tailwind|typograph|color|brand|layout|icon|three\.?js|3d|frontend[-_ ]design|taste|impeccable|canvas|illustrat|logo|react[-_ ]bits/],
  ['Marketing', /marketing|seo|\bads?\b|copywrit|social|linkedin|instagram|twitter|campaign|growth|launch|email|newsletter|sales|cro\b|pricing|influencer|brand voice|outreach|lead/],
  ['Writing', /writ|blog|article|docs?\b|documentation|edit(or|ing)|story|content|translat|prose|grammar|readme|proofread/],
  ['Data', /data|analytic|sql|csv|excel|xlsx|spreadsheet|chart|dashboard|statistic|graph|pandas|bigquery|warehouse|metrics|research/],
  ['Productivity', /productiv|task|todo|calendar|meeting|notes?\b|plan|workflow|project[-_ ]manage|pdf|docx|pptx|slides|office|email triage|memory|knowledge|search|browser|automation|agent[-_ ]reach/],
  ['Coding', /code|coding|dev|program|test|debug|refactor|git|github|api|backend|frontend|react|next\.?js|typescript|python|java|rust|go\b|deploy|docker|kubernetes|ci\b|cli|sdk|mcp|security|review|architect|database|spec|playwright|tdd|lint|build/],
];
function guessCategory(repo, dir, name, description) {
  const primary = `${repo} ${dir} ${name}`.toLowerCase();
  for (const [cat, re] of CATEGORY_RULES) if (re.test(primary)) return cat;
  const secondary = description.toLowerCase();
  for (const [cat, re] of CATEGORY_RULES) if (re.test(secondary)) return cat;
  return 'Other';
}

// ---------- main ----------
const warnings = [];
const repos = [];
for (const owner of OWNERS) {
  const list = await gh(['repo', 'list', owner, '--limit', '300', '--json', 'name,isFork,visibility,parent,licenseInfo,defaultBranchRef']);
  for (const r of list ?? []) {
    if (r.visibility !== 'PUBLIC') continue; // private = paid products
    if (SKIP_REPOS.has(r.name)) continue;
    const branch = r.defaultBranchRef?.name;
    if (!branch) { warnings.push(`${owner}/${r.name}: empty repo, skipped`); continue; }
    repos.push({
      owner, name: r.name, full: `${owner}/${r.name}`, branch,
      upstream: r.isFork && r.parent ? `${r.parent.owner.login}/${r.parent.name}` : null,
    });
  }
}
console.log(`[catalog] ${repos.length} public repos to scan`);

// Licence: repo first, then the parent repo for forks.
await mapLimit(repos, CONCURRENCY, async (r) => {
  let lic = await repoLicence(r.full);
  if ((!lic || lic === 'NOASSERTION') && r.upstream) {
    const up = await repoLicence(r.upstream);
    if (up && (up !== 'NOASSERTION' || !lic)) lic = up;
  }
  r.license = lic;
});

// SKILL.md paths per repo.
await mapLimit(repos, CONCURRENCY, async (r) => {
  r.paths = await listSkillPaths(r.full, r.branch, warnings);
  if (r.paths.length) console.log(`[catalog] ${r.full}: ${r.paths.length} SKILL.md`);
});

const skills = [];
const seen = new Set();
const ids = new Set();
const stats = { noFrontmatter: 0, noDescription: 0, placeholder: 0, duplicate: 0, fetchFailed: 0 };
let capped = false;

// Smallest repos first, so the cap trims the huge aggregator repos, not the focused ones.
const scanOrder = [...repos].sort((a, b) => a.paths.length - b.paths.length);
for (const r of scanOrder) {
  if (capped) break;
  if (!r.paths.length) continue;
  const docs = await mapLimit(r.paths, CONCURRENCY, async (path) => {
    const c = await gh(['api', `repos/${r.full}/contents/${path.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(r.branch)}`]);
    if (!c || typeof c.content !== 'string') return { path, text: null };
    return { path, text: Buffer.from(c.content, 'base64').toString('utf8') };
  });
  for (const { path, text } of docs) {
    if (text == null) { stats.fetchFailed++; continue; }
    const fm = parseFrontmatter(text);
    if (!fm) { stats.noFrontmatter++; continue; }
    const name = collapse(fm.name);
    let description = collapse(typeof fm.description === 'string' ? fm.description : Array.isArray(fm.description) ? fm.description.join(' ') : fm.description);
    if (!description) { stats.noDescription++; continue; }
    if (!name || isPlaceholder(name) || isPlaceholder(description)) { stats.placeholder++; continue; }
    const key = `${name.toLowerCase()}\u0000${description.toLowerCase()}`;
    if (seen.has(key)) { stats.duplicate++; continue; }
    seen.add(key);
    if (description.length > 300) description = description.slice(0, 299).trimEnd() + '…';

    const dir = path.includes('/') ? path.slice(0, path.lastIndexOf('/')) : '';
    let id = `${r.owner}--${r.name}--${dir ? dir.replace(/\//g, '-') : 'root'}`.toLowerCase().replace(/[^a-z0-9._-]+/g, '-').replace(/-{3,}/g, '--');
    for (let n = 2; ids.has(id); n++) id = `${id.replace(/-\d+$/, '')}-${n}`;
    ids.add(id);

    const license = r.license && r.license !== 'NOASSERTION' ? r.license : null;
    skills.push({
      id, name, description,
      repo: r.full, ref: r.branch, dir,
      upstream: r.upstream,
      license,
      runnable: !!license && PERMISSIVE.has(license),
      category: guessCategory(r.name, dir, name, description),
    });
    if (skills.length >= MAX_ENTRIES) { capped = true; warnings.push(`capped at ${MAX_ENTRIES} entries while reading ${r.full}`); break; }
  }
}

skills.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, JSON.stringify({ generatedAt: new Date().toISOString(), count: skills.length, skills }, null, 2) + '\n');

const byCat = {};
for (const s of skills) byCat[s.category] = (byCat[s.category] || 0) + 1;
console.log(`[catalog] wrote ${skills.length} skills to src/skills/catalog.json`);
console.log('[catalog] per category:', byCat);
console.log('[catalog] skipped:', stats);
for (const w of warnings) console.warn('[catalog] note:', w);
