/* Tiny no-framework test suite for the bridge's pure logic — the regression-prone bits
   (visa/language/region detection, the intern/senior title filters).
   Run:  node bridge/test.mjs      (exits non-zero if anything fails) */
import { detectVisa, detectLang, matchRegion, INTERN_RE, SENIOR_RE } from './server.mjs';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) pass++; else { fail++; console.log('  ✗ FAIL:', name); } };
const job = (o = {}) => ({ title: '', tags: [], description: '', location: '', remote: false, ...o });

/* ── detectVisa: keyword + negation guard ─────────────────────────── */
ok('visa: sponsorship phrase',        detectVisa(job({ description: 'We offer visa sponsorship and relocation help.' })) === true);
ok('visa: in tags',                   detectVisa(job({ tags: ['relocation package'] })) === true);
ok('visa: "will sponsor"',            detectVisa(job({ description: 'We will sponsor your work visa.' })) === true);
ok('visa: negation "do not sponsor"', detectVisa(job({ description: 'We do not offer visa sponsorship.' })) === false);
ok('visa: negation "no sponsorship"', detectVisa(job({ description: 'Sorry, no visa sponsorship available.' })) === false);
ok('visa: plain job (none)',          detectVisa(job({ description: 'Great team and free lunch.' })) === false);

/* ── detectLang: function-word density (>=6) ──────────────────────── */
ok('lang: german',  detectLang(job({ description: 'Wir suchen einen Mitarbeiter für die Stelle mit Erfahrung und guten Kenntnisse.' })) === 'de');
ok('lang: french',  detectLang(job({ description: 'Nous recherchons un développeur avec expérience pour le poste dans une entreprise.' })) === 'fr');
ok('lang: english', detectLang(job({ description: 'We are looking for a junior developer with some experience.' })) === 'en');
ok('lang: short non-EN stays en', detectLang(job({ title: 'Entwickler', description: 'Berlin' })) === 'en');

/* ── matchRegion: location string + remote flag ───────────────────── */
ok('region: gulf (Dubai)',     matchRegion(job({ location: 'Dubai, UAE' }), ['gulf']) === true);
ok('region: canada (Toronto)', matchRegion(job({ location: 'Toronto, ON' }), ['canada']) === true);
ok('region: uk (London)',      matchRegion(job({ location: 'London' }), ['uk']) === true);
ok('region: tunisia (Tunis)',  matchRegion(job({ location: 'Tunis' }), ['tunisia']) === true);
ok('region: gulf != Berlin',   matchRegion(job({ location: 'Berlin' }), ['gulf']) === false);
ok('region: remote via flag',  matchRegion(job({ location: '', remote: true }), ['remote']) === true);
ok('region: remote via word',  matchRegion(job({ location: 'Anywhere (Remote)' }), ['remote']) === true);
ok('region: multi (uk OR ca)', matchRegion(job({ location: 'Vancouver' }), ['uk', 'canada']) === true);

/* ── INTERN_RE / SENIOR_RE: word-boundary correctness (the old bug) ── */
ok('intern: "Junior Developer"',        INTERN_RE.test('Junior Developer') === true);
ok('intern: "Internship Program"',      INTERN_RE.test('Internship Program') === true);
ok('intern: "Graduate Engineer"',       INTERN_RE.test('Graduate Engineer') === true);
ok('intern: NOT "internal tools"',      INTERN_RE.test('internal tools engineer') === false);
ok('intern: NOT "International Sales"',  INTERN_RE.test('International Sales') === false);
ok('intern: NOT "Senior Engineer"',     INTERN_RE.test('Senior Engineer') === false);
ok('senior: "Senior Engineer"',         SENIOR_RE.test('Senior Engineer') === true);
ok('senior: "Lead Architect"',          SENIOR_RE.test('Lead Architect') === true);
ok('senior: NOT "Junior Developer"',    SENIOR_RE.test('Junior Developer') === false);

console.log(`\n  ${pass} passed, ${fail} failed\n`);
process.exit(fail ? 1 : 0);
