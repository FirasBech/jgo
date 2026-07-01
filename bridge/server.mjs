/* ══════════════════════════════════════════════════════════════════
   J.GO — local bridge that lets the app call Claude, either via your own
   Anthropic API key or the Claude Code CLI subscription.

   It shells out to `claude -p` (headless print mode), which draws from
   whatever auth Claude Code is logged in with — i.e. your Pro/Max plan.

   Run:   node server.mjs        (or double-click start-bridge.cmd)
   Then keep this window open while you use the dashboard.
   ══════════════════════════════════════════════════════════════════ */

import http from 'node:http';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync, readdirSync, unlinkSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import os from 'node:os';

const __dirname  = path.dirname(fileURLToPath(import.meta.url));
const BACKUP_DIR = path.join(__dirname, 'backups');
const STATIC_DIR = path.join(__dirname, '..');   // the dashboard folder (index.html, app.js, style.css...)
const BRIDGE_DIR = __dirname;                     // never served: holds server source + disk backups
const MIME = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml', '.png':'image/png', '.ico':'image/x-icon', '.webmanifest':'application/manifest+json' };

// Load a .env file (project root or bridge dir) into process.env. Zero dependency.
// Real environment variables always take precedence over the file.
for (const envPath of [path.join(STATIC_DIR, '.env'), path.join(__dirname, '.env')]) {
  try {
    if (!existsSync(envPath)) continue;
    for (const raw of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      const s = raw.trim();
      if (!s || s.startsWith('#')) continue;
      const m = /^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(s);
      if (!m) continue;
      let v = m[2].trim();
      if ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'"))) v = v.slice(1, -1);
      if (process.env[m[1]] === undefined) process.env[m[1]] = v;
    }
  } catch {}
}

const PORT  = process.env.BRIDGE_PORT ? Number(process.env.BRIDGE_PORT) : 8787;
const HOST  = process.env.BRIDGE_HOST || '127.0.0.1';   // set 0.0.0.0 to reach it on your LAN (e.g. a phone)
const MODEL = process.env.CLAUDE_MODEL || '';           // optional default model alias: haiku | sonnet | opus
const BUILD = 13;                                       // bumped on protocol change so the app can flag a stale bridge

// AI mode: if ANTHROPIC_API_KEY is set, the bridge calls the Anthropic API (bring your own key).
// Otherwise it shells out to the `claude` CLI (Claude Code subscription, no key needed).
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY || '';

// Adzuna - optional keyed aggregator for real on-site jobs (UK, Canada, US, DE, NL...).
// Free key at https://developer.adzuna.com. Off until both vars are set.
const ADZUNA_ID  = process.env.ADZUNA_APP_ID  || '';
const ADZUNA_KEY = process.env.ADZUNA_APP_KEY || '';
const ADZUNA_COUNTRIES = (process.env.ADZUNA_COUNTRIES || 'gb,us,ca').split(',').map(s => s.trim()).filter(Boolean);

/* ── Locate a working `claude` binary ──────────────────────────── */
function resolveClaude() {
  const candidates = [];
  if (process.env.CLAUDE_BIN) candidates.push(process.env.CLAUDE_BIN);

  const appdata = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  const pkgBin = ['@anthropic-ai', 'claude-code', 'bin', 'claude.exe'];

  if (process.platform === 'win32') {
    candidates.push(path.join(appdata, 'npm', 'node_modules', ...pkgBin));
    candidates.push(path.join(process.env.ProgramFiles || 'C:\\Program Files', 'nodejs', 'node_modules', ...pkgBin));
  }
  // Unix-style global installs
  candidates.push(path.join(os.homedir(), '.npm-global', 'lib', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude'));
  candidates.push('/usr/local/lib/node_modules/@anthropic-ai/claude-code/bin/claude');

  for (const c of candidates) {
    try { if (c && existsSync(c)) return { bin: c, shell: false }; } catch {}
  }
  // Last resort: rely on PATH (needs a shell to resolve .cmd shims on Windows)
  return { bin: 'claude', shell: true };
}

const CLAUDE = resolveClaude();

// Models the front-end may request per call. Cheap/fast (haiku) is used for trivial
// text ops (tone/length transforms, single-line CV bullets, ATS hints, JSON repair);
// the strong default is left untouched for tailoring / audits / matching.
const ALLOWED_MODELS = new Set(['haiku', 'sonnet', 'opus', 'claude-haiku-4-5-20251001', 'claude-sonnet-4-6', 'claude-opus-4-8']);

/* ── Run a prompt through claude -p (prompt via stdin) ──────────── */
// Options:
//   model — optional, allowlisted per-request model (else env default)
//   web   — when true, pre-authorise the WebSearch/WebFetch tools so Claude can
//           research live data non-interactively (no permission prompt to hang on).
// If the request includes a model/web and claude rejects it (older CLI, plan can't use
// it, tools unavailable), we retry ONCE plain so an extra can never break the feature.
function runClaude(prompt, { model = '', web = false } = {}) {
  const spawnOnce = (useModel, useWeb) => new Promise((resolve, reject) => {
    const args = ['-p'];
    if (useModel) args.push('--model', useModel);
    // Pre-authorising these read-only tools lets headless `claude -p` use them without
    // an interactive permission prompt (which would deadlock — stdin is closed).
    if (useWeb) args.push('--allowedTools', 'WebSearch', 'WebFetch');

    let child;
    try {
      child = spawn(CLAUDE.bin, args, { shell: CLAUDE.shell });
    } catch (e) { return reject(e); }

    let out = '', err = '';
    const ms = useWeb ? 300000 : 180000;   // web research is slower → allow up to 5 min
    const timer = setTimeout(() => { try { child.kill(); } catch {} reject(new Error(`Claude timed out (${ms / 1000}s)`)); }, ms);

    child.stdout.on('data', d => out += d);
    child.stderr.on('data', d => err += d);
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code === 0) resolve(out.trim());
      else reject(new Error((err.trim() || `claude exited with code ${code}`).slice(0, 500)));
    });

    child.stdin.write(prompt);
    child.stdin.end();
  });

  const chosen = (model && ALLOWED_MODELS.has(model)) ? model : MODEL;   // per-request wins, else env default
  return spawnOnce(chosen, web).catch(err => {
    if (chosen || web) { console.log(`  (model="${chosen}" web=${web} failed - retrying plain)`); return spawnOnce('', false); }
    throw err;
  });
}

/* ── Anthropic API path (used when ANTHROPIC_API_KEY is set) ─────── */
const API_MODELS = { haiku: 'claude-haiku-4-5-20251001', sonnet: 'claude-sonnet-4-6', opus: 'claude-opus-4-8' };
async function runViaAPI(prompt, model) {
  const id = API_MODELS[model] || API_MODELS[MODEL] || process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6';
  const r = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: id, max_tokens: 4096, messages: [{ role: 'user', content: prompt }] }),
  });
  if (!r.ok) throw new Error('Anthropic API ' + r.status + ': ' + (await r.text().catch(() => '')).slice(0, 300));
  const j = await r.json();
  return (j.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
}

// Choose the AI backend: the Anthropic API if a key is set (bring your own), else the
// `claude` CLI (Claude Code subscription). Web research only works in CLI mode.
function generate(prompt, { model = '', web = false } = {}) {
  return ANTHROPIC_KEY ? runViaAPI(prompt, model) : runClaude(prompt, { model, web });
}

/* ══════════════════════════════════════════════════════════════════
   Live Job Feed — proxy free public job APIs (no key, no CORS issues).
   Sources: Remotive · RemoteOK · Arbeitnow · Jobicy · The Muse · Himalayas.
   All normalised to one shape. Visa-sponsorship / relocation help is
   keyword-detected across every source (see VISA_RE below).
   ══════════════════════════════════════════════════════════════════ */

function decodeEntities(s) {
  return String(s || '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&rsquo;|&apos;/gi, "'").trim();
}

function stripHtml(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<\/(p|div|h\d|ul|ol|tr)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>').replace(/&quot;/gi, '"').replace(/&#39;|&rsquo;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();
}

async function fetchJSON(url, { timeout = 9000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 CareerDashboard', 'Accept': 'application/json', ...headers } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.json();
  } finally { clearTimeout(t); }
}

async function fetchText(url, { timeout = 9000, headers = {} } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeout);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 CareerDashboard', 'Accept': 'application/rss+xml, text/xml, */*', ...headers } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return await r.text();
  } finally { clearTimeout(t); }
}

// Minimal RSS <item> parser (no XML dependency) for feeds like We Work Remotely.
// Pulls a fixed set of fields and HTML-entity-decodes each (CDATA-safe).
function parseRssItems(xml) {
  const items = [];
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = itemRe.exec(xml))) {
    const block = m[1];
    const field = tag => {
      const r = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i'));
      return r ? decodeEntities(r[1].replace(/^\s*<!\[CDATA\[|\]\]>\s*$/g, '').trim()) : '';
    };
    items.push({
      title: field('title'), link: field('link'), description: field('description'),
      region: field('region'), category: field('category'), pubDate: field('pubDate'),
    });
  }
  return items;
}

/* Small in-memory cache so repeated searches / source toggles don't re-hit the
   upstream APIs every time. RemoteOK & Arbeitnow return their whole board (cached
   once); Remotive runs a server-side search so it's cached per query. */
const JOBS_TTL = 8 * 60 * 1000;
const _jobsCache = new Map();
async function cached(key, fn) {
  const hit = _jobsCache.get(key);
  if (hit && Date.now() - hit.at < JOBS_TTL) return { data: hit.data, hit: true };
  const data = await fn();
  _jobsCache.set(key, { at: Date.now(), data });
  return { data, hit: false };
}

/* In-memory cache for /ai responses so re-opening the same generation doesn't re-spend
   quota (or an API call). Keyed on model+prompt. Web-research calls are never cached
   (must stay live); the front-end's "Regenerate" sends fresh:true. LRU + TTL. */
const AI_TTL = 30 * 60 * 1000;
const AI_MAX = 60;
const _aiCache = new Map();   // key → { at, text }
function aiCacheGet(k) {
  const h = _aiCache.get(k);
  if (h && Date.now() - h.at < AI_TTL) { _aiCache.delete(k); _aiCache.set(k, h); return h.text; }   // bump to MRU
  if (h) _aiCache.delete(k);
  return null;
}
function aiCacheSet(k, text) {
  _aiCache.set(k, { at: Date.now(), text });
  while (_aiCache.size > AI_MAX) _aiCache.delete(_aiCache.keys().next().value);   // evict oldest
}

function fmtSalary(min, max) {
  const k = n => '$' + Math.round(Number(n) / 1000) + 'k';
  if (min && max) return `${k(min)}–${k(max)}`;
  if (min) return `${k(min)}+`;
  if (max) return `≤ ${k(max)}`;
  return '';
}

async function fromRemotive(q) {
  const u = 'https://remotive.com/api/remote-jobs?limit=120' + (q ? '&search=' + encodeURIComponent(q) : '');
  const j = await fetchJSON(u);
  return (j.jobs || []).map(o => ({
    source: 'Remotive', title: o.title, company: o.company_name,
    location: o.candidate_required_location || 'Remote', url: o.url, remote: true,
    salary: o.salary || '',
    tags: [o.category, o.job_type, ...(o.tags || [])].filter(Boolean).slice(0, 6),
    date: (o.publication_date || '').slice(0, 10),
    description: stripHtml(o.description).slice(0, 4000),
  }));
}

async function fromRemoteOK() {
  const j = await fetchJSON('https://remoteok.com/api');
  return (Array.isArray(j) ? j.slice(1) : []).map(o => ({
    source: 'RemoteOK', title: o.position, company: o.company,
    location: o.location || 'Remote', url: o.url || o.apply_url, remote: true,
    salary: fmtSalary(o.salary_min, o.salary_max),
    tags: (o.tags || []).slice(0, 6),
    date: (o.date || '').slice(0, 10),
    description: stripHtml(o.description).slice(0, 4000),
  }));
}

async function fromArbeitnow() {
  // Pull the first 2 pages (~200 listings) instead of just one.
  const pages = await Promise.all([1, 2].map(p =>
    fetchJSON('https://www.arbeitnow.com/api/job-board-api?page=' + p).catch(() => ({ data: [] }))));
  const data = pages.flatMap(j => j.data || []);
  return data.map(o => ({
    source: 'Arbeitnow', title: o.title, company: o.company_name,
    location: o.location || (o.remote ? 'Remote' : ''), url: o.url, remote: !!o.remote,
    salary: '',
    tags: [...(o.job_types || []), ...(o.tags || [])].filter(Boolean).slice(0, 6),
    date: o.created_at ? new Date(o.created_at * 1000).toISOString().slice(0, 10) : '',
    description: stripHtml(o.description).slice(0, 4000),
  }));
}

async function fromJobicy(q) {
  // Jobicy exposes an explicit jobLevel (Junior/Senior/…) and keyword search via ?tag=.
  const u = 'https://jobicy.com/api/v2/remote-jobs?count=50' + (q ? '&tag=' + encodeURIComponent(q) : '');
  const j = await fetchJSON(u);
  return (j.jobs || []).map(o => ({
    source: 'Jobicy', title: o.jobTitle, company: o.companyName,
    location: o.jobGeo || 'Remote', url: o.url, remote: true,
    salary: fmtSalary(o.annualSalaryMin, o.annualSalaryMax),
    // jobLevel goes into tags so the senior filter / junior boost can read it.
    tags: [...(o.jobIndustry || []), ...(o.jobType || []), o.jobLevel].filter(Boolean).slice(0, 6),
    date: (o.pubDate || '').slice(0, 10),
    description: stripHtml(o.jobDescription || o.jobExcerpt).slice(0, 4000),
  }));
}

// Coerce an API field that may be an array of strings OR of {name}/{title} objects into clean strings.
const names = a => (Array.isArray(a) ? a : a ? [a] : []).map(x => typeof x === 'string' ? x : (x && (x.name || x.title))).filter(Boolean);

async function fromTheMuse() {
  // Real worldwide companies (on-site + remote). The single best source for jobs that
  // actually relocate / sponsor a visa, since it's not remote-only like the others.
  const cats = ['Software Engineering', 'Data Science', 'Computer and IT', 'Engineering', 'IT'];
  const catQ = cats.map(c => '&category=' + encodeURIComponent(c)).join('');
  // The Muse paginates ~20 results/page — pull 5 pages (~100) since it's our only
  // on-site / relocation source (the others are remote-only).
  const pages = await Promise.all([1, 2, 3, 4, 5].map(p =>
    fetchJSON(`https://www.themuse.com/api/public/jobs?page=${p}${catQ}`).catch(() => ({ results: [] }))));
  const results = pages.flatMap(j => j.results || []);
  return results.map(o => {
    const loc = (o.locations || []).map(l => l.name).join(' · ');
    return {
      source: 'The Muse', title: o.name, company: (o.company || {}).name,
      location: loc || 'Flexible', url: (o.refs || {}).landing_page, remote: /remote|flexible/i.test(loc),
      salary: '',
      tags: [...names(o.levels), ...names(o.categories)].slice(0, 6),
      date: (o.publication_date || '').slice(0, 10),
      description: stripHtml(o.contents).slice(0, 4000),
    };
  });
}

async function fromHimalayas(q) {
  // Remote board with real salary data and seniority. ?search= is best-effort; the
  // keyword ranker below covers it if the API ignores the param.
  const u = 'https://himalayas.app/jobs/api?limit=100' + (q ? '&search=' + encodeURIComponent(q) : '');
  const j = await fetchJSON(u);
  return (j.jobs || []).map(o => {
    const yearly = !o.salaryPeriod || /year|annual/i.test(o.salaryPeriod);
    return {
      source: 'Himalayas', title: o.title, company: o.companyName,
      location: names(o.locationRestrictions).join(' · ') || 'Remote',
      url: o.applicationLink || o.guid, remote: true,
      salary: yearly && (o.minSalary > 2000 || o.maxSalary > 2000) ? fmtSalary(o.minSalary, o.maxSalary) : '',
      tags: [...names(o.seniority), ...names(o.categories), o.employmentType].filter(Boolean).slice(0, 6),
      date: o.pubDate ? new Date(o.pubDate * 1000).toISOString().slice(0, 10) : '',
      description: stripHtml(o.description || o.excerpt).slice(0, 4000),
    };
  });
}

// Adzuna — REAL on-site listings (UK, Canada, US, DE, NL…), unlike the remote-only boards
// above. Optional: returns nothing until ADZUNA_APP_ID + ADZUNA_APP_KEY are set (free key).
// Queries each configured country (default gb,ca) and filters to IT jobs server-side.
async function fromAdzuna(q) {
  if (!ADZUNA_ID || !ADZUNA_KEY) return [];
  const what = encodeURIComponent(q || '');   // no query → all IT jobs (category scopes it); never hard-code a field
  const perCountry = await Promise.all(ADZUNA_COUNTRIES.map(cc =>
    fetchJSON(`https://api.adzuna.com/v1/api/jobs/${cc}/search/1?app_id=${ADZUNA_ID}&app_key=${ADZUNA_KEY}`
      + `&results_per_page=50&what=${what}&category=it-jobs&content-type=application/json`)
      .then(j => (j.results || []).map(o => {
        const loc = (o.location || {}).display_name || cc.toUpperCase();
        return {
          source: 'Adzuna', title: o.title, company: (o.company || {}).display_name,
          location: loc, url: o.redirect_url, remote: /remote/i.test(loc),
          salary: '',   // Adzuna salaries are local-currency numbers — skip rather than mislabel as $
          tags: [(o.category || {}).label, o.contract_time, o.contract_type].filter(Boolean).slice(0, 6),
          date: (o.created || '').slice(0, 10),
          description: stripHtml(o.description).slice(0, 4000),
        };
      }))
      .catch(() => [])));
  return perCountry.flat();
}

// WorkingNomads — a large curated remote-jobs board (JSON, whole board, no key).
async function fromWorkingNomads() {
  const j = await fetchJSON('https://www.workingnomads.com/api/exposed_jobs/');
  const arr = Array.isArray(j) ? j : (j.jobs || []);
  return arr.map(o => ({
    source: 'WorkingNomads', title: o.title, company: o.company_name,
    location: o.location || 'Remote', url: o.url, remote: true,
    salary: '',
    tags: [o.category_name, ...String(o.tags || '').split(',').map(s => s.trim())].filter(Boolean).slice(0, 6),
    date: (o.pub_date || '').slice(0, 10),
    description: stripHtml(o.description).slice(0, 4000),
  }));
}

// We Work Remotely — top-tier remote board, RSS only. Title is "Company: Role"; pull the
// tech category feeds (whole board, no key). region → location, category → tag.
async function fromWeWorkRemotely() {
  const feeds = [
    'https://weworkremotely.com/categories/remote-programming-jobs.rss',
    'https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss',
  ];
  const xmls = await Promise.all(feeds.map(u => fetchText(u).catch(() => '')));
  const items = xmls.flatMap(parseRssItems);
  return items.map(o => {
    const ci = o.title.indexOf(':');
    const company = ci > 0 ? o.title.slice(0, ci).trim() : '';
    const title = ci > 0 ? o.title.slice(ci + 1).trim() : o.title;
    return {
      source: 'We Work Remotely', title, company,
      location: o.region || 'Remote', url: o.link, remote: true,
      salary: '',
      tags: [o.category].filter(Boolean).slice(0, 6),
      date: o.pubDate && !isNaN(new Date(o.pubDate)) ? new Date(o.pubDate).toISOString().slice(0, 10) : '',
      description: stripHtml(o.description).slice(0, 4000),
    };
  });
}

const SOURCE_FETCHERS = { remotive: fromRemotive, remoteok: fromRemoteOK, arbeitnow: fromArbeitnow, jobicy: fromJobicy, themuse: fromTheMuse, himalayas: fromHimalayas, adzuna: fromAdzuna, workingnomads: fromWorkingNomads, weworkremotely: fromWeWorkRemotely };

// Visa-sponsorship / relocation help — keyword-detected from title+tags+description because
// no source exposes a reliable boolean anymore (Arbeitnow dropped its visa_sponsorship field).
// The negation guard stops "we do NOT offer visa sponsorship" / "no sponsorship" from matching.
const VISA_RE = /\b(?:visa\s+sponsor\w*|sponsor\w*\s+(?:your\s+|a\s+|the\s+)?(?:work\s+)?visa|will\s+sponsor|we\s+(?:can\s+|will\s+|do\s+)?sponsor|able\s+to\s+sponsor|sponsorship\s+(?:is\s+)?(?:available|provided|offered|possible)|work\s+(?:permit|visa)|skilled[\s-]?worker\s+visa|blue\s+card|relocation\s+(?:package|assistance|support|bonus|help|provided|offered|reimbursement)|help\s+(?:you\s+)?relocate|we'?ll\s+relocate|fully\s+sponsored)\b/i;
const NO_VISA_RE = /\b(?:no|not|cannot|can'?t|unable\s+to|won'?t|will\s+not|do(?:es)?\s+not|don'?t|without|aren'?t\s+able|are\s+not\s+able)\b[^.!?\n]{0,40}\bsponsor/i;
export function detectVisa(j) {
  const txt = (j.title + ' ' + j.tags.join(' ') + ' ' + j.description).toLowerCase();
  return VISA_RE.test(txt) && !NO_VISA_RE.test(txt);
}
// NOTE: both-sided \b so "intern" does NOT match "internal / internet / international"
// (the old /\bintern/ let senior jobs through the intern filter).
export const INTERN_RE = /\b(?:intern(?:ship)?s?|stagiaire|stage|junior|jr|entry[ -]?level|graduate|trainee|d[ée]butant|apprenti|working\s+student|werkstudent)\b/i;
// Titles that are clearly NOT junior — dropped when "intern/junior only" is on.
export const SENIOR_RE = /\b(?:senior|sr|lead|principal|staff|manager|head\s+of|director|vp|chief|expert|architect|confirm[ée]|exp[ée]riment[ée]|s[ée]nior)\b/i;

// Rough language detection so the user can hide postings written in a language they don't read.
// English is assumed unless there's a strong German/French function-word signal.
const DE_WORDS = /\b(?:und|oder|der|die|das|den|dem|für|mit|wir|sie|ist|sind|eine|einen|einem|werden|haben|wird|bei|auch|als|aus|nicht|sich|deine|deinem|unser|unsere|kenntnisse|erfahrung|aufgaben|stelle|mitarbeiter|bewerbung|gehalt|zum|zur|sowie)\b/gi;
const FR_WORDS = /\b(?:et|ou|le|la|les|des|une|pour|avec|nous|vous|votre|notre|vos|nos|être|sont|dans|sur|aux|que|qui|pas|compétences|expérience|poste|entreprise|stage|candidature|salaire|missions|profil)\b/gi;
export function detectLang(j) {
  const txt = (j.title + ' ' + j.description).toLowerCase();
  const de = (txt.match(DE_WORDS) || []).length;
  const fr = (txt.match(FR_WORDS) || []).length;
  if (de >= 6 && de >= fr) return 'de';
  if (fr >= 6 && fr > de) return 'fr';
  return 'en';
}

// Region matching against the job location string ("remote" also reads the remote flag).
const REGION_RE = {
  gulf:        /\b(?:uae|dubai|abu\s?dhabi|sharjah|qatar|doha|saudi|riyadh|jeddah|dammam|oman|muscat|bahrain|manama|kuwait|emirates|middle\s?east|mena|gcc)\b/i,
  ireland:     /\b(?:ireland|dublin|cork|galway|limerick)\b/i,
  uk:          /\b(?:united\s?kingdom|\buk\b|london|england|scotland|wales|manchester|birmingham|glasgow|edinburgh|leeds|bristol)\b/i,
  canada:      /\b(?:canada|toronto|vancouver|montr[ée]al|ottawa|calgary|ontario|quebec|alberta|british\s?columbia)\b/i,
  usa:         /\b(?:united\s?states|\busa\b|\bu\.?s\.?\b|america|california|texas|new\s?york|seattle|boston|chicago|atlanta|florida|virginia)\b/i,
  germany:     /\b(?:germany|deutschland|berlin|munich|m[üu]nchen|hamburg|frankfurt|cologne|k[öo]ln|stuttgart|dresden|d[üu]sseldorf|leipzig)\b/i,
  netherlands: /\b(?:netherlands|holland|amsterdam|rotterdam|utrecht|eindhoven|the\s?hague|den\s?haag)\b/i,
  europe:      /\b(?:europe|european|\beu\b|emea)\b/i,
  tunisia:     /\b(?:tunisia|tunisie|tunis|sfax|sousse|kairouan|bizerte|gab[eè]s|k[eé]bili|monastir|nabeul|ariana|ben\s?arous|maghreb)\b/i,
};
export function matchRegion(j, regions) {
  return regions.some(r => {
    if (r === 'remote') return j.remote === true || /\b(?:remote|worldwide|anywhere|global)\b/i.test(j.location || '');
    const re = REGION_RE[r];
    return re ? re.test(j.location || '') : false;
  });
}

async function getJobs({ q = '', sources = ['remotive', 'remoteok', 'arbeitnow', 'jobicy', 'themuse', 'himalayas', 'adzuna'], intern = false, visa = false, english = false, regions = [] } = {}) {
  const wanted = sources.filter(s => SOURCE_FETCHERS[s]);
  const results = await Promise.allSettled(wanted.map(s => {
    // Remotive & Jobicy search server-side → cache per query; the others return the whole board → cache once.
    const perQuery = s === 'remotive' || s === 'jobicy' || s === 'adzuna';   // these search server-side → cache per query
    const key = perQuery ? `${s}:${q.toLowerCase().trim()}` : s;
    const fn  = perQuery ? () => SOURCE_FETCHERS[s](q) : SOURCE_FETCHERS[s];
    return cached(key, fn);
  }));
  let jobs = [];
  const errors = [];
  let allHit = wanted.length > 0;
  results.forEach((r, i) => {
    if (r.status === 'fulfilled') { jobs.push(...r.value.data); allHit = allHit && r.value.hit; }
    else { errors.push(`${wanted[i]}: ${r.reason?.message || r.reason}`); allHit = false; }
  });

  // clean text + de-dupe. Key on normalised title+company so the SAME role coming from
  // several sources (different URLs) collapses to one entry. When a dup is found, keep the
  // richer listing — prefer one that has a salary, then the longer description.
  const normKey = s => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
  const richness = j => (j.salary ? 1e7 : 0) + (j.description || '').length;
  const byKey = new Map();
  jobs.forEach(j => {
    if (!j.title || !j.company || !j.url) return;
    j.title = decodeEntities(j.title);
    j.company = decodeEntities(j.company);
    j.location = decodeEntities(j.location);
    j.tags = (j.tags || []).map(decodeEntities);
    const key = normKey(j.title) + '|' + normKey(j.company);
    const prev = byKey.get(key);
    if (!prev || richness(j) > richness(prev)) byKey.set(key, j);
  });
  jobs = [...byKey.values()];

  // Flag visa-sponsorship / relocation help (keyword-detected) so the front-end can badge
  // and filter on it — the key signal for a candidate who may need to relocate abroad.
  jobs.forEach(j => { j.visa = detectVisa(j); j.lang = detectLang(j); });

  // keyword filter / ranking (Remotive already searched server-side; this also covers the other sources)
  // Title/tags/company matches weigh far more than description matches, so a job that merely
  // mentions a term deep in its description doesn't outrank one that's actually about it.
  const terms = q.toLowerCase().split(/[\s,]+/).filter(t => t.length > 1);
  jobs.forEach(j => {
    const strong = (j.title + ' ' + j.company + ' ' + j.tags.join(' ')).toLowerCase();
    const weak = j.description.toLowerCase();
    j._strong = terms.reduce((n, t) => n + (strong.includes(t) ? 1 : 0), 0);
    const weakHits = terms.reduce((n, t) => n + (weak.includes(t) ? 1 : 0), 0);
    j._q = j._strong * 3 + weakHits;                              // pure keyword relevance
    const juniorTitle = INTERN_RE.test(j.title) || INTERN_RE.test(j.tags.join(' '));
    j._score = j._q + (intern && juniorTitle ? 5 : 0);            // sort score (juniors first)
  });
  if (terms.length) {
    // Prefer title/tags/company matches, but don't starve the feed: when that pool is
    // thin (< 30), top it up with description-only matches. The _score sort below keeps
    // the real (title-matched) jobs on top, so loose description hits just fill the tail
    // instead of being dropped — fixing the "too few jobs" problem on multi-word queries.
    const strong = jobs.filter(j => j._strong > 0);
    const weak   = jobs.filter(j => j._strong === 0 && j._q > 0);
    jobs = strong.length >= 30 ? strong : strong.concat(weak);
  }

  if (intern) {
    // "Junior-friendly": drop clearly-senior roles (these remote boards rarely use the word
    // "intern", so requiring it returns almost nothing). Explicit intern/junior titles are
    // boosted above, so they surface first; mid/neutral roles remain, senior ones are removed.
    jobs = jobs.filter(j => !SENIOR_RE.test(j.title) && !SENIOR_RE.test(j.tags.join(' ')));
  }

  // Keep only roles that mention visa sponsorship / relocation help (for relocating abroad).
  if (visa) jobs = jobs.filter(j => j.visa);

  // Language: hide postings the user can't read (e.g. German/French) — keep only English.
  if (english) jobs = jobs.filter(j => j.lang === 'en');

  // Region/country: keep only jobs whose location matches one of the selected regions.
  if (regions.length) jobs = jobs.filter(j => matchRegion(j, regions));

  jobs.sort((a, b) => (b._score || 0) - (a._score || 0) || String(b.date).localeCompare(String(a.date)));
  jobs.forEach(j => { delete j._score; delete j._strong; delete j._q; });
  return { jobs: jobs.slice(0, 150), errors, cached: allHit };
}

/* ── HTTP server ───────────────────────────────────────────────── */
// Only reflect CORS for origins we trust, so a random website open in the same
// browser can't read /jobs, spend the Claude quota via /ai, or pull /backup.
// Trusted: file:// (double-click index.html → Origin "null"), and the bridge's
// own host:port whether reached as localhost, 127.0.0.1, or a LAN IP (phone).
// Anything else gets no Allow-Origin header → the browser blocks the response.
function allowedOrigin(req) {
  const o = req.headers.origin;
  if (!o) return '';                 // no Origin (curl, same-origin GET) — nothing to reflect
  if (o === 'null') return 'null';   // file:// page
  try {
    const u = new URL(o);
    if (u.port === String(PORT) && /^(localhost|127\.0\.0\.1|(\d{1,3}\.){3}\d{1,3})$/.test(u.hostname)) return o;
  } catch {}
  return '';
}
function cors(req, res) {
  const o = allowedOrigin(req);
  if (o) {
    res.setHeader('Access-Control-Allow-Origin', o);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
}

const server = http.createServer((req, res) => {
  cors(req, res);

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

  if (req.method === 'GET' && req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, service: 'claude-bridge', version: BUILD, bin: CLAUDE.bin }));
    return;
  }

  // Silent disk backup of the whole dashboard state → bridge/backups/career-backup-YYYY-MM-DD.json
  if (req.method === 'POST' && req.url === '/backup') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 8e6) req.destroy(); });
    req.on('end', () => {
      try {
        const { data } = JSON.parse(body || '{}');
        if (!data) throw new Error('no data');
        if (!existsSync(BACKUP_DIR)) mkdirSync(BACKUP_DIR, { recursive: true });
        const file = `career-backup-${new Date().toISOString().slice(0, 10)}.json`;
        writeFileSync(path.join(BACKUP_DIR, file), JSON.stringify(data, null, 2));
        // keep only the 10 most recent snapshots
        const old = readdirSync(BACKUP_DIR).filter(f => f.startsWith('career-backup-')).sort();
        old.slice(0, -10).forEach(f => { try { unlinkSync(path.join(BACKUP_DIR, f)); } catch {} });
        console.log(`✓ backup saved: ${file}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, file }));
      } catch (e) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
      }
    });
    return;
  }

  if (req.method === 'GET' && req.url.startsWith('/jobs')) {
    (async () => {
      const t0 = Date.now();
      try {
        const u = new URL(req.url, `http://localhost:${PORT}`);
        const q = u.searchParams.get('q') || '';
        const intern = u.searchParams.get('intern') === '1';
        const visa = u.searchParams.get('visa') === '1';
        const english = u.searchParams.get('english') === '1';
        const regions = (u.searchParams.get('regions') || '').split(',').map(s => s.trim()).filter(Boolean);
        const sources = (u.searchParams.get('sources') || 'remotive,remoteok,arbeitnow,jobicy,themuse,himalayas,adzuna,workingnomads,weworkremotely').split(',').map(s => s.trim()).filter(Boolean);
        process.stdout.write(`→ jobs q="${q}" intern=${intern} visa=${visa} english=${english} regions=[${regions}]… `);
        const { jobs, errors, cached: wasCached } = await getJobs({ q, sources, intern, visa, english, regions });
        console.log(`${jobs.length} jobs in ${((Date.now() - t0) / 1000).toFixed(1)}s${wasCached ? ' (cache)' : ''}${errors.length ? ' (' + errors.join('; ') + ')' : ''}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, jobs, errors, cached: wasCached }));
      } catch (e) {
        console.log('JOBS ERROR:', e.message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e.message || e), jobs: [] }));
      }
    })();
    return;
  }

  if (req.method === 'POST' && req.url === '/ai') {
    let body = '';
    req.on('data', c => { body += c; if (body.length > 2e6) req.destroy(); });
    req.on('end', async () => {
      const t0 = Date.now();
      try {
        const { prompt, model, web, fresh } = JSON.parse(body || '{}');
        if (!prompt || String(prompt).trim().length < 2) throw new Error('empty prompt');
        const useModel = (typeof model === 'string' && ALLOWED_MODELS.has(model)) ? model : '';
        const useWeb = web === true || web === '1';
        // Serve from cache unless this is a web call or an explicit regenerate.
        const cacheKey = useModel + '|' + prompt;
        if (!useWeb && fresh !== true) {
          const cachedText = aiCacheGet(cacheKey);
          if (cachedText != null) {
            console.log(`→ prompt (${prompt.length} chars${useModel ? ', ' + useModel : ''}) — cache hit`);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, text: cachedText, cached: true }));
            return;
          }
        }
        process.stdout.write(`→ prompt (${prompt.length} chars${useModel ? ', ' + useModel : ''}${useWeb ? ', web' : ''})… `);
        const text = await generate(String(prompt), { model: useModel, web: useWeb });
        if (!useWeb) aiCacheSet(cacheKey, text);   // cache non-web responses for reuse
        console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, text }));
      } catch (e) {
        console.log('ERROR:', e.message);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: String(e.message || e) }));
      }
    });
    return;
  }

  // ── Static file serving: the dashboard itself (so it runs at http://localhost:PORT) ──
  if (req.method === 'GET') {
    try {
      const clean = decodeURIComponent((req.url.split('?')[0]));
      const rel = clean === '/' ? 'index.html' : clean.replace(/^\/+/, '');
      const full = path.resolve(STATIC_DIR, rel);
      // Path-traversal guard: must stay strictly inside the dashboard folder
      // (boundary-safe — startsWith(STATIC_DIR) alone would also match a sibling
      //  like "…/dashboard-old"), and must never expose the bridge/ folder, which
      // holds the server source and disk backups of personal data.
      const inDashboard = full === STATIC_DIR || full.startsWith(STATIC_DIR + path.sep);
      const inBridge    = full === BRIDGE_DIR || full.startsWith(BRIDGE_DIR + path.sep);
      if (!inDashboard || inBridge) { res.writeHead(403); res.end('Forbidden'); return; }
      if (existsSync(full) && statSync(full).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[path.extname(full).toLowerCase()] || 'application/octet-stream' });
        res.end(readFileSync(full));
        return;
      }
    } catch {}
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

// Only bind the port when run directly (`node server.mjs`) — NOT when imported by tests.
const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  server.listen(PORT, HOST, () => {
    const aiMode = ANTHROPIC_KEY ? 'Anthropic API (your ANTHROPIC_API_KEY)' : `Claude CLI subscription (${CLAUDE.bin})`;
    console.log('\n  J.GO - local bridge');
    console.log(`  Dashboard : http://localhost:${PORT}   (open this; enables install + phone)`);
    console.log(`  Endpoints : POST /ai   GET /jobs   POST /backup   GET /health`);
    console.log(`  AI        : ${aiMode}`);
    console.log(`  Adzuna    : ${ADZUNA_ID && ADZUNA_KEY ? `on (on-site jobs from ${ADZUNA_COUNTRIES.join(', ')})` : 'off (set ADZUNA_APP_ID + ADZUNA_APP_KEY for on-site jobs)'}`);
    if (HOST === '0.0.0.0') console.log(`  LAN       : reachable on your network at http://<this-pc-ip>:${PORT}  (exposes the bridge - trusted networks only)`);
    console.log(`  Keep this window open. Press Ctrl+C to stop.\n`);
  });

  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') console.error(`\n  ⚠ Port ${PORT} already in use. The bridge may already be running.\n`);
    else console.error('\n  Server error:', e.message, '\n');
    process.exit(1);
  });
}
