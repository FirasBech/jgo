/* ══════════════════════════════════════════════════════════════════
   J.GO — app.js
   Single-file SPA: Store · TagEngine · Router · Views · Export
   ══════════════════════════════════════════════════════════════════ */

'use strict';

/* ── Default data (sample profile — replace it in Profile & CV, or clear via Settings) ── */
const DEFAULT = {
  tags: [
    { key: 'name',   label: 'Full name',   value: 'Sam Rivera' },
    { key: 'email',  label: 'Email',       value: 'sam.rivera@example.com' },
    { key: 'city',   label: 'Location',    value: 'Remote' },
    { key: 'school', label: 'School',      value: 'State University' },
    { key: 'degree', label: 'Degree',      value: 'BSc Computer Science' },
    { key: 'focus',  label: 'Focus',       value: 'Software & Cloud' },
    { key: 'skills', label: 'Core skills', value: 'JavaScript, Python, Linux, Docker, AWS, SQL' },
    { key: 'lang',   label: 'Languages',   value: 'English (fluent)' },
  ],

  cv: {
    personal: {
      name: 'Sam Rivera',
      title: 'Junior Software Engineer',
      location: 'Remote',
      email: 'sam.rivera@example.com',
      phone: '',
      linkedin: '',
      github: '',
      photo: '',
    },
    summary: 'Junior software engineer comfortable across the stack, with hands-on experience in web development, cloud, and automation. This is sample data — open "Profile & Tags" and "CV Builder" to replace it with your own.',
    education: [
      { id: 'edu1', degree: 'BSc Computer Science', school: 'State University', location: '', years: '2021 - 2024',
        description: 'Coursework: algorithms, data structures, databases, networks, operating systems, and web development.' },
    ],
    skills: [
      { id: 'sk1', category: 'Languages', items: [
        { id: 'ski_1a', text: 'JavaScript' }, { id: 'ski_1b', text: 'TypeScript' },
        { id: 'ski_1c', text: 'Python' }, { id: 'ski_1d', text: 'SQL' },
      ]},
      { id: 'sk2', category: 'Web & Backend', items: [
        { id: 'ski_2a', text: 'React' }, { id: 'ski_2b', text: 'Node.js' },
        { id: 'ski_2c', text: 'REST APIs' }, { id: 'ski_2d', text: 'PostgreSQL' },
      ]},
      { id: 'sk3', category: 'Cloud & DevOps', items: [
        { id: 'ski_3a', text: 'AWS' }, { id: 'ski_3b', text: 'Docker' },
        { id: 'ski_3c', text: 'Linux' }, { id: 'ski_3d', text: 'Git' },
      ]},
    ],
    projects: [
      { id: 'pr1', title: 'Portfolio + Blog', tech: 'React, Node.js, PostgreSQL', year: '2024',
        description: 'Full-stack web app with authentication, a REST API, and an automated deploy to a cloud host.' },
      { id: 'pr2', title: 'CLI Automation Tool', tech: 'Python', year: '2023',
        description: 'Command-line tool that automates a repetitive data task; packaged with unit tests.' },
    ],
    languages: [
      { id: 'l1', language: 'English', level: 'Fluent' },
    ],
    experience: [
      { id: 'exp1', company: 'Open Source', position: 'Contributor', period: '2023 - Present', location: '',
        description: 'Contributed bug fixes and small features to community projects and reviewed pull requests.' },
    ],
    certifications: [
      { id: 'c1', name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', year: '2024' },
    ],
    achievements: [
      { id: 'a1', text: 'Shipped a full-stack side project used by a small group of real users.' },
    ],
    interests: 'Web development, cloud, automation, open source',
    hidden: [],
    hiddenEntries: [],
    order: ['summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'achievements', 'languages', 'interests'],
  },

  settings: {
    cvAccent: '#1e3a5f',
    cvFont:   'Georgia',
    theme:    'light',
  },

  applications: [],

  letters: [],
};

/* status pipeline for the job tracker */
const APP_STATUSES = [
  { key: 'wishlist',  label: 'Wishlist',  color: '#6c757d' },
  { key: 'applied',   label: 'Applied',   color: '#2a6fb0' },
  { key: 'interview', label: 'Interview', color: '#f0a500' },
  { key: 'offer',     label: 'Offer',     color: '#27ae60' },
  { key: 'rejected',  label: 'Rejected',  color: '#e74c3c' },
];
// Localized status label (APP_STATUSES.label stays as a stable English fallback / DB key).
function statusLabel(key) { return t('status.' + key); }

const DEFAULT_LETTER_PARAS = [
  'I am writing to apply for the [role] at [Company]. I am a junior software engineer with hands-on experience across web development, cloud, and automation, and I would be glad to contribute to your team.',
  'In recent projects I have built full-stack web applications (React, Node.js, PostgreSQL), automated repetitive tasks in Python, and deployed services with Docker and AWS. I am comfortable taking a problem from idea to a tested, shipped solution.',
  'I am drawn to [Company] because [reason]. I would welcome the chance to apply my skills here and keep learning alongside your engineers.',
  'Thank you for considering my application. My CV is attached, and I would be happy to talk further at your convenience.',
];

/* ── Store (localStorage) ──────────────────────────────────────── */
const Store = (() => {
  const KEY = 'career_dash_v1';
  let _data = null;

  function _clone(o) { return JSON.parse(JSON.stringify(o)); }

  function init() {
    try {
      const raw = localStorage.getItem(KEY);
      _data = raw ? JSON.parse(raw) : _clone(DEFAULT);
    } catch { _data = _clone(DEFAULT); }
    _migrate();
  }

  // Backfill keys added in later versions so old saved data keeps working
  function _migrate() {
    if (!_data.settings)     _data.settings = _clone(DEFAULT.settings);
    if (!_data.applications) _data.applications = [];
    if (!Array.isArray(_data.tags)) _data.tags = _clone(DEFAULT.tags);   // profile @-tags (used by profileEnrich + Profile view)
    // Proactive Radar: saved searches + seen-jobs memory for "new since last visit".
    if (!_data.radar)        _data.radar = { saved: [], seen: {}, newCount: 0, autoMatch: false };
    if (!_data.radar.saved)  _data.radar.saved = [];
    if (!_data.radar.seen)   _data.radar.seen = {};
    if (_data.radar.english === undefined) _data.radar.english = false;
    if (!_data.radar.regions) _data.radar.regions = [];
    if (_data.radar.lastQuery === undefined) _data.radar.lastQuery = '';   // remembers the last search
    if (!_data.cv)           _data.cv = _clone(DEFAULT.cv);
    // Normalize core CV shape so a partial/imported profile can't crash the builder, ATS or audit.
    if (!_data.cv.personal)                 _data.cv.personal  = _clone(DEFAULT.cv.personal);
    if (!Array.isArray(_data.cv.education)) _data.cv.education  = _clone(DEFAULT.cv.education);
    if (!Array.isArray(_data.cv.skills))    _data.cv.skills     = _clone(DEFAULT.cv.skills);
    if (!Array.isArray(_data.cv.projects))  _data.cv.projects   = [];
    if (!Array.isArray(_data.cv.languages)) _data.cv.languages  = _clone(DEFAULT.cv.languages);
    if (_data.cv.summary === undefined)      _data.cv.summary = DEFAULT.cv.summary;
    if (!_data.cv.certifications) _data.cv.certifications = [];
    if (!_data.cv.achievements)   _data.cv.achievements = [];
    if (!_data.cv.order)          _data.cv.order = _clone(DEFAULT.cv.order);
    if (!_data.cv.hidden)         _data.cv.hidden = [];
    // ensure any new default sections appear in order
    DEFAULT.cv.order.forEach(s => { if (!_data.cv.order.includes(s)) _data.cv.order.push(s); });
    if (_data.settings.cvAccent === undefined) _data.settings.cvAccent = DEFAULT.settings.cvAccent;
    if (_data.settings.cvFont === undefined)   _data.settings.cvFont = DEFAULT.settings.cvFont;
    if (_data.settings.theme === undefined)    _data.settings.theme = 'light';
    if (_data.settings.lang === undefined)     _data.settings.lang = 'en';
    if (_data.settings.lastBackup === undefined) _data.settings.lastBackup = '';
    if (!_data.cv.experience) _data.cv.experience = [];
    if (_data.cv.personal.photo === undefined) _data.cv.personal.photo = '';
    if (!_data.cv.hiddenEntries) _data.cv.hiddenEntries = [];
    // convert legacy string skill items → chip arrays
    (_data.cv.skills || []).forEach(sk => {
      if (typeof sk.items === 'string') {
        sk.items = sk.items.split(',').map(t => t.trim()).filter(Boolean).map(t => ({ id: uid(), text: t, hidden: false }));
      } else if (Array.isArray(sk.items)) {
        sk.items.forEach(i => { if (i.hidden === undefined) i.hidden = false; });
      }
    });
    // backfill extra application fields + normalize legacy dd/mm/yyyy dates to ISO
    (_data.applications || []).forEach(a => {
      if (!a.jd)              a.jd = '';
      if (!a.contact)         a.contact = '';
      if (!a.remote)          a.remote = '';
      if (!a.salary)          a.salary = '';
      if (!a.tailoredSummary) a.tailoredSummary = '';
      if (!a.tailoredLetter)  a.tailoredLetter = '';
      if (!a.followUpDate)    a.followUpDate = '';
      if (a.date)             a.date = normalizeDate(a.date) || a.date;
      if (a.followUpDate)     a.followUpDate = normalizeDate(a.followUpDate) || a.followUpDate;
    });
  }

  // Roll back to the previous good state if migrating an imported object throws,
  // so a malformed backup can never corrupt the live in-memory session.
  function replaceAll(obj) {
    const prev = _data;
    try { _data = obj; _migrate(); save(); }
    catch (e) { _data = prev; throw e; }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(_data));
      return true;
    } catch (e) {
      console.error('Store.save failed:', e);
      // Most likely QuotaExceededError (e.g. a large base64 CV photo pushing past ~5MB).
      if (typeof toast === 'function') toast(t('store.full'), 5000);
      return false;
    }
  }

  function get() { return _data; }

  function reset() {
    localStorage.removeItem(KEY);
    _data = _clone(DEFAULT);
  }

  return { init, save, get, reset, replaceAll };
})();

/* ── Utilities ─────────────────────────────────────────────────── */
function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function esc(s) { return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function debounce(fn, ms) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; }
function todayISO() { return new Date().toISOString().slice(0, 10); }

// Coerce any stored date to ISO yyyy-mm-dd. Handles ISO, fr-FR dd/mm/yyyy, and Date-parsable strings.
function normalizeDate(s) {
  if (!s) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const fr = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s);
  if (fr) return `${fr[3]}-${fr[2].padStart(2,'0')}-${fr[1].padStart(2,'0')}`;
  const d = new Date(s);
  return isNaN(d) ? '' : d.toISOString().slice(0, 10);
}

function fmtDate(iso) {
  if (!iso) return '';
  const norm = normalizeDate(iso);
  if (!norm) return String(iso);          // unparseable → show raw rather than "undefined/…"
  const [y, m, d] = norm.split('-');
  return `${d}/${m}/${y}`;
}

let _toastTimer;
function toast(msg, ms = 2200) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/* ── i18n (FR / EN) ────────────────────────────────────────────── */
let _lang = 'fr';
const I18N = {
  fr: {
    // ── Shell (static HTML) ──
    'brand.role': 'Career Manager',
    'nav.dashboard': 'Dashboard', 'nav.profile': 'Profil & Tags', 'nav.cv': 'CV Builder',
    'nav.letters': 'Lettres', 'nav.ats': 'ATS Analyzer', 'nav.tracker': 'Job Tracker',
    'nav.apply': 'Quick Apply', 'nav.radar': 'Job Radar', 'nav.insights': 'Insights',
    'footer.backup': '⬇ Backup', 'footer.restore': '⬆ Restore', 'footer.reset': '⚠ Réinitialiser',
    'footer.themeTitle': 'Basculer dark/light', 'footer.backupTitle': 'Télécharger une sauvegarde JSON',
    'footer.restoreTitle': 'Restaurer depuis un fichier', 'footer.langTitle': 'Changer de langue (FR/EN)',
    'ai.promptLabel': 'Prompt à copier dans Claude :', 'ai.copyPrompt': '📋 Copier le prompt',
    'ai.help': "Collez-le dans Claude (claude.ai ou Claude Code), puis collez la réponse ci-dessous et cliquez sur Appliquer.",
    'ai.outLabel': 'Résultat :', 'ai.tone': 'Ton', 'ai.pro': 'Pro', 'ai.casual': 'Naturel', 'ai.formal': 'Formel',
    'ai.length': 'Longueur', 'ai.short': '↓ Court', 'ai.long': '↑ Long',
    'ai.enhance': '⚡ Améliorer', 'ai.simplify': '✂ Simplifier', 'ai.bullets': '• Bullets',
    'ai.outPlaceholder': 'Le résultat apparaîtra ici…', 'ai.apply': '✓ Appliquer',
    'ai.regen': '↻ Régénérer', 'ai.copyOut': 'Copier le résultat',
    'ai.ttPro': 'Rendre plus professionnel', 'ai.ttCasual': 'Rendre plus naturel', 'ai.ttFormal': 'Rendre plus formel',
    'ai.ttShort': 'Raccourcir le texte', 'ai.ttLong': 'Développer le texte', 'ai.ttEnhance': "Améliorer l'impact",
    'ai.ttSimplify': 'Simplifier le langage', 'ai.ttBullets': 'Convertir en bullet points',
    // ── Page headers ──
    'home.greeting': '👋 Bonjour', 'home.sub': 'Career Manager — CV · Lettres · ATS · Candidatures · Radar',
    'profile.title': 'Profile & Tags', 'profile.sub': 'Modifiez vos informations et gérez la bibliothèque de tags',
    'cv.title': 'CV Builder', 'cv.sub': 'Éditez vos sections et exportez en PDF',
    'letters.title': 'Lettres de motivation',
    'ats.title': '🤖 ATS Match Analyzer', 'ats.sub': "Collez une offre d'emploi — comparez les mots-clés avec votre CV",
    'tracker.title': '📌 Job Tracker', 'tracker.withPkg': 'avec package IA',
    'apply.title': '🚀 Quick Apply', 'apply.sub': 'Collez une offre → Claude adapte votre CV + lettre → Sauvez dans le tracker',
    'radar.title': '🔍 Job Radar', 'radar.sub': "Flux d'offres en direct + plateformes pour votre profil Dev · Réseau · Mobile",
    // ── Home body ──
    'home.aiStrategy': '✨ Stratégie IA', 'home.quickApply': '🚀 Quick Apply',
    'home.overdue1': 'relance en retard', 'home.overdueN': 'relances en retard',
    'home.due': 'échéance', 'home.see': 'Voir →',
    'home.statCv': 'CV complété', 'home.statLetters1': 'Lettre', 'home.statLettersN': 'Lettres',
    'home.statApps1': 'Candidature', 'home.statAppsN': 'Candidatures', 'home.statTags': 'Tags',
    'home.cvComplete': '✅ Complétude du CV —', 'home.improve': 'Améliorer',
    'home.pipeline': '📊 Pipeline de candidatures', 'home.seeAll': 'Voir tout', 'home.recent': 'Récentes',
    'home.noApps': 'Aucune candidature.', 'home.applyNow': '🚀 Postuler maintenant',
    'home.quickActions': 'Actions rapides', 'home.qaApply': '🚀 Quick Apply — Adapter & postuler',
    'home.qaCv': '📄 CV Builder', 'home.qaLetters': '✉️ Lettres de motivation',
    'home.qaAts': '🤖 Analyser ATS', 'home.qaRadar': '🔍 Job Radar',
    'home.howTitle': '💡 Comment ça marche',
    'home.step1': 'Complétez votre profil CV',
    'home.step2': 'Collez une offre dans <strong>Quick Apply</strong> → Claude adapte votre CV + lettre',
    'home.step3': "Copiez le package → postulez sur le site de l'offre",
    'home.step4': 'La candidature est sauvée dans le <strong>Tracker</strong>',
    'home.step5': 'Utilisez les boutons <strong>✨</strong> pour les relances et prep entretien',
    'home.tip': 'Tapez <code style="background:var(--bg);padding:2px 6px;border-radius:4px">@</code> dans les éditeurs pour insérer vos données de profil.',
    // ── CV completeness checks ──
    'cv.check.name': 'Nom renseigné', 'cv.check.email': 'Email renseigné',
    'cv.check.phone': 'Téléphone (ATS lit le contact)', 'cv.check.linkedin': 'LinkedIn ajouté',
    'cv.check.summary': 'Résumé professionnel (≥40 car.)', 'cv.check.education': 'Au moins une formation',
    'cv.check.skills': 'Au moins 3 catégories de compétences', 'cv.check.projects': 'Au moins 2 projets',
    'cv.check.projectsDesc': 'Tous les projets ont une description', 'cv.check.achievements': 'Au moins une réalisation',
    'cv.check.languages': 'Au moins 2 langues',
    // ── Radar body ──
    'radar.strategy': '✨ Stratégie IA', 'radar.feedTitle': "📡 Flux d'offres en direct",
    'radar.feedVia': 'via le bridge — 6 sources gratuites',
    'radar.searchPh': 'Mot-clé : react, python, network, security…', 'radar.searchBtn': '🔍 Rechercher',
    'radar.internOnly': 'Masquer les postes senior', 'radar.sources': 'Sources :',
    'radar.boardsTitle': '🔗 Plateformes à parcourir',
    'radar.tipBody': "<strong>💡 Astuce :</strong> Cliquez <strong>🚀 Adapter</strong> sur une offre → elle se charge dans <a href=\"#apply\" onclick=\"Router.go('#apply')\" style=\"color:var(--primary);font-weight:600\">Quick Apply</a>, où Claude adapte votre CV et lettre à cette offre en quelques secondes. Ou parcourez les plateformes ci-dessous manuellement.",
    'radar.loading': "Recherche d'offres en direct…",
    'radar.noBridge': "ℹ Bridge non détecté. Démarrez <strong>dashboard/bridge</strong> (start-bridge.cmd) pour le flux d'offres en direct. En attendant, utilisez les plateformes ci-dessous.",
    'radar.timeout': '⏱ Délai dépassé — réessayez.',
    'radar.none': "Aucune offre trouvée. Élargissez le mot-clé, ou utilisez les plateformes ci-dessous (LinkedIn, Keejob…) — elles listent beaucoup plus de stages locaux.",
    'radar.notLaunched': 'Lancez une recherche pour afficher des offres en direct.',
    'radar.selectSrc': 'Sélectionnez au moins une source.',
    'radar.adapt': '🚀 Adapter', 'radar.view': '🔗 Voir',
    'radar.offer1': 'offre', 'radar.offerN': 'offres', 'radar.internSuffix': ' · hors senior',
    'radar.loadedToast': '🚀 Offre chargée dans Quick Apply',
    'radar.save': '＋ Suivre', 'radar.saveTip': 'Ajouter au tracker (Wishlist)', 'radar.tracked': '✓ Suivi', 'radar.trackedTip': 'Déjà dans le tracker',
    'radar.savedToast2': '✓ Ajouté au tracker (Wishlist)', 'radar.remoteBadge': 'Remote',
    'radar.sourceErr': '⚠ Sources indisponibles :', 'radar.cachedNote': '· en cache',
    'radar.strategyTitle': '✨ Stratégie de recherche de stage', 'radar.remoteOnly': 'Remote uniquement',
    'radar.chipsLabel': 'Raccourcis :',
    'radar.filtersLabel': 'Filtres :',
    'radar.visaOnly': 'Visa / relocation', 'radar.visaBadge': '🛂 Visa',
    'radar.visaTip': "Mentionne un sponsoring de visa ou une aide à la relocalisation",
    'radar.selectAll': 'Tout', 'radar.selectNone': 'Aucune',
    'radar.helpToggle': '❔ Que veulent dire ces filtres ?',
    'radar.helpKeyword': '<strong>Mot-clé</strong> : un métier ou une techno (ex. react, python, network).',
    'radar.helpSenior': '<strong>Masquer senior</strong> : enlève les postes Senior / Lead / Manager — montre junior, débutant & stages.',
    'radar.helpRemote': '<strong>Remote uniquement</strong> : seulement les offres 100% télétravail.',
    'radar.helpVisa': "<strong>Visa / relocation</strong> : ne garde que les offres qui mentionnent un sponsoring de visa ou une aide au déménagement — utile si vous devez partir à l'étranger.",
    'radar.helpSources': '<strong>Sources</strong> : Remotive · RemoteOK · Jobicy = tech remote mondial · Arbeitnow = Europe (beaucoup de stages) · The Muse = vraies entreprises (sur site, le meilleur pour visa/relocation) · Himalayas = remote avec salaires affichés.',
    'radar.srcRemotive': 'Tech remote mondial', 'radar.srcRemoteok': 'Tech remote mondial',
    'radar.srcArbeitnow': 'Europe — beaucoup de stages (Praktikum / Werkstudent)', 'radar.srcJobicy': "Remote, avec niveau d'expérience",
    'radar.srcThemuse': 'Vraies entreprises mondiales (sur site + remote) — idéal pour visa / relocation',
    'radar.srcHimalayas': 'Remote, avec salaires affichés',
    'radar.srcAdzuna': 'Postes sur site (UK, Canada…) — nécessite une clé API gratuite',
    'radar.savedLabel': 'Recherches suivies :',
    'radar.noSaved': 'Aucune — enregistrez une recherche pour suivre les nouvelles offres.',
    'radar.saveSearch': 'Suivre', 'radar.saveSearchTip': 'Enregistrer cette recherche et suivre les nouvelles offres',
    'radar.searchSaved': '★ Recherche suivie', 'radar.savedAlready': 'Déjà dans vos recherches suivies',
    'radar.removeSaved': 'Retirer', 'radar.checkNew': 'Vérifier', 'radar.checkingNew': '⏳ Recherche des nouveautés…',
    'radar.newWord': 'nouvelle(s) offre(s)', 'radar.noNew': '✓ Aucune nouveauté', 'radar.noBridgeShort': 'ℹ Bridge éteint — impossible de vérifier',
    'radar.newAcross': 'dans vos recherches suivies — cliquez pour les ouvrir :', 'radar.boardsQuery': 'Ces sites recherchent :',
    'radar.newBadge': 'NOUVEAU', 'radar.newTip': 'Offre nouvelle depuis votre dernière visite',
    'radar.autoMatch': 'Auto-trier (CV)',
    'radar.helpSaved': "<strong>Recherches suivies</strong> : ★ Suivre enregistre une recherche ; un badge sur « Job Radar » compte les offres nouvelles depuis votre dernière visite (badge NOUVEAU sur les cartes).",
    'radar.helpAuto': "<strong>Auto-trier (CV)</strong> : après chaque recherche, Claude classe automatiquement les offres selon votre CV (nécessite le bridge).",
    'radar.englishOnly': 'Anglais uniquement', 'radar.langTip': 'Offre rédigée dans une autre langue',
    'radar.helpEnglish': "<strong>Anglais uniquement</strong> : masque les offres rédigées en allemand ou en français — ne garde que l'anglais.",
    'radar.regionLabel': 'Région :', 'radar.regionClear': 'Effacer',
    'radar.helpRegion': "<strong>Région</strong> : filtre par pays / zone (Remote, Golfe, Irlande, UK, Canada…). Choix multiples ; aucun sélectionné = toutes les régions.",
    'region.remote': 'Remote', 'region.gulf': 'Golfe', 'region.ireland': 'Irlande', 'region.uk': 'UK', 'region.canada': 'Canada',
    'region.usa': 'USA', 'region.germany': 'Allemagne', 'region.netherlands': 'Pays-Bas', 'region.europe': 'Europe', 'region.tunisia': 'Tunisie',
    'radar.aiMatch': '✨ Trier selon mon CV', 'radar.aiMatchTitle': '✨ Offres adaptées à votre CV',
    'radar.aiMatching': '⏳ Analyse…', 'radar.aiMatchDone': '🎯 Offres triées selon votre CV',
    'radar.aiRanked': '🎯 Trié selon votre CV', 'radar.aiClear': '✕ Effacer',
    'radar.aiNeedJobs': "⚠ Lancez d'abord une recherche", 'radar.matchTip': 'Adéquation avec votre profil',
    'radar.fitTip': 'Correspondance avec les compétences de votre CV',
    'radar.insFitLabel': 'Adéquation CV', 'radar.insStrong': 'forte', 'radar.insPartial': 'moyenne', 'radar.insLow': 'faible', 'radar.insAvg': 'moy.',
    'radar.insRemote': 'remote', 'radar.insVisa': 'visa', 'radar.insSalary': 'salaire affiché',
    'radar.insHave': 'Vous avez', 'radar.insMissing': 'À ajouter / apprendre', 'radar.insNoSkills': 'Aucune compétence technique nette détectée dans ces offres.',
    'radar.insMarket': '✨ Analyse du marché (Claude)', 'radar.insMarketRun': '⏳ Lecture du marché…', 'radar.insMarketHint': 'Claude lit les offres chargées et résume tendances, compétences demandées et conseils pour votre profil.',
    'radar.skTip': 'Cliquez pour agir sur cette compétence', 'radar.skFind': '🔍 Voir les offres', 'radar.skLearn': '🎓 Apprendre', 'radar.skAddCv': "➕ Je l'ai — ajouter au CV",
    'radar.skAddedToast': 'ajouté à votre CV', 'radar.skNoCat': '⚠ Aucune catégorie de compétences dans le CV', 'radar.skDup': 'ℹ Déjà dans votre CV',
    'radar.helpAi': "<strong>✨ Trier selon mon CV</strong> : Claude classe les offres ci-dessus selon votre profil (score d'adéquation + raison). Nécessite le bridge, sinon mode copier-coller.",
    'age.today': "aujourd'hui", 'age.yesterday': 'hier', 'age.days': 'j', 'age.months': 'mois',
    // ── Today command center + bridge status ──
    'today.title': "Aujourd'hui", 'today.newMatches': 'Nouvelles offres', 'today.followups': 'Relances dues', 'today.toApply': 'À postuler',
    'today.actCheck': 'Voir les nouvelles offres', 'today.actFollow': 'Relancer', 'today.actApply': 'Postuler aux offres sauvées',
    'today.actCv': 'Compléter votre CV', 'today.actSave': 'Enregistrer une recherche dans le Radar', 'today.actSearch': 'Chercher de nouvelles offres',
    'bridge.checking': 'Vérification…', 'bridge.on': 'Bridge connecté', 'bridge.off': 'Bridge hors ligne', 'bridge.stale': 'Bridge à redémarrer',
    'bridge.onTip': "IA et flux d'offres en direct actifs.", 'bridge.offTip': "Bridge éteint — lancez bridge/start-bridge.cmd pour activer l'IA et le flux d'offres.",
    'bridge.staleTip': "Une ancienne instance du bridge tourne — fermez sa fenêtre et relancez start-bridge.cmd.",
    // ── Insights view ──
    'insights.title': '📊 Insights', 'insights.sub': 'Analysez ce qui marche pour redoubler dessus',
    'insights.applied': 'Postulées', 'insights.activity': '📈 Activité', 'insights.activitySub': 'candidatures / semaine (8 dern.)', 'insights.wk0': 'cette sem.',
    'insights.bySource': '🎯 Par source', 'insights.direct': 'Direct / manuel', 'insights.respShort': 'réponse', 'insights.noSource': 'Postulez via le Radar pour suivre les sources.',
    'insights.needsAction': '⚡ À traiter', 'insights.overdueFollow': 'Relance en retard', 'insights.stale': 'Sans réponse 14j+', 'insights.allClear': 'Tout est à jour 🎉',
    'insights.empty': 'Aucune candidature à analyser — commencez à postuler.',
    // ── Common ──
    'common.save': '💾 Enregistrer', 'common.cancel': 'Annuler', 'common.copy': '📋 Copier',
    'common.copied': '📋 Copié', 'common.copiedClip': '📋 Copié dans le presse-papiers',
    'common.email': 'Email', 'common.notParsable': '⚠ Réponse IA non analysable — copiez manuellement',
    'common.saved': '✅ Enregistré', 'common.deleted': '🗑 Supprimé',
    // ── Profile ──
    'profile.enrich': "✨ Enrichir avec l'IA", 'profile.enrichTitle': '✨ Enrichissement de profil',
    'profile.tabProfile': '👤 Profil', 'profile.tabTags': '🏷️ Tags Library',
    'profile.personalInfo': 'Informations personnelles',
    'profile.fullName': 'Nom complet', 'profile.titleRole': 'Titre / Poste', 'profile.city': 'Ville', 'profile.phone': 'Téléphone',
    'profile.tagLibrary': 'Bibliothèque de tags', 'profile.newTag': '+ Nouveau tag',
    'profile.thKey': 'Clé (@key)', 'profile.thLabel': 'Label', 'profile.thValue': 'Valeur',
    'profile.tagTip': "💡 Tapez <strong>@</strong> dans l'éditeur de lettres pour insérer n'importe quel tag.",
    'profile.savedToast': '✅ Profil enregistré', 'profile.tagDeleted': 'Tag supprimé',
    'profile.newTagLabel': 'Nouveau tag', 'profile.newTagValue': 'Valeur',
    'profile.tagsAddedSuffix': 'tag(s) ajouté(s)',
    // ── CV Builder ──
    'common.add': '+ Ajouter',
    'cv.sec.personal': '👤 Informations', 'cv.sec.summary': '📝 Résumé', 'cv.sec.experience': '💼 Expériences',
    'cv.sec.education': '🎓 Formation', 'cv.sec.skills': '⚙️ Compétences', 'cv.sec.projects': '🛠 Projets',
    'cv.sec.certifications': '📜 Certifications', 'cv.sec.achievements': '🏆 Réalisations',
    'cv.sec.languages': '🌐 Langues', 'cv.sec.interests': '💡 Intérêts', 'cv.sec.theme': '🎨 Thème & Style',
    'cv.auditBtn': '🔍 Audit IA', 'cv.auditTitle': "Analyse complète du CV par l'IA",
    'cv.atsExport': '🤖 ATS Export', 'cv.atsExportTitle': 'ATS-safe : pas de CSS de mise en page, HTML sémantique, police Arial — idéal pour les portails',
    'cv.exportPdf': '📥 Export PDF',
    'cv.dragReorder': 'Glisser pour réordonner', 'cv.collapse': 'Réduire/Agrandir', 'cv.duplicate': 'Dupliquer',
    'cv.showInCv': 'Afficher dans le CV', 'cv.hideFromCv': 'Masquer du CV', 'cv.show': 'Afficher', 'cv.hide': 'Masquer', 'cv.deleteWord': 'Supprimer',
    'cv.improve': '✨ Améliorer',
    'cv.lblName': 'Nom', 'cv.lblTitle': 'Titre', 'cv.lblLocation': 'Lieu', 'cv.lblDescription': 'Description',
    'cv.lblYear': 'Année', 'cv.lblYears': 'Années', 'cv.lblLevel': 'Niveau', 'cv.lblLanguage': 'Langue',
    'cv.lblCategory': 'Catégorie', 'cv.lblSkills': 'Compétences', 'cv.lblTech': 'Technologies',
    'cv.lblCompany': 'Entreprise', 'cv.lblPosition': 'Poste / Intitulé du stage',
    'cv.lblPeriod': 'Période (ex: Juin 2025 – Juillet 2025)', 'cv.lblDegree': 'Diplôme', 'cv.lblSchool': 'École', 'cv.lblIssuer': 'Organisme',
    'cv.expTitle': 'Expériences professionnelles', 'cv.eduTitle': 'Formation', 'cv.skillsTitle': 'Compétences',
    'cv.projTitle': 'Projets', 'cv.langTitle': 'Langues', 'cv.interestsTitle': 'Intérêts',
    'cv.summaryTitle': 'Résumé professionnel', 'cv.certTitle': 'Certifications', 'cv.achTitle': 'Réalisations clés',
    'cv.themeTitle': 'Thème & Style du CV',
    'cv.expHint1': "💡 Chaque ligne de description devient un bullet point dans le CV. Utilisez ✨ pour réécrire avec l'IA.",
    'cv.expHint2': 'Stages, alternances, jobs. Décrivez chaque mission avec des bullet points (une ligne = un bullet).',
    'cv.skillsHint': 'Cliquez 👁 pour masquer une compétence du CV (sans la supprimer). Appuyez sur Entrée pour ajouter.',
    'cv.achHint': "💡 Astuce ATS : commencez par un verbe d'action et ajoutez un chiffre quand c'est possible (77% des recruteurs préfèrent les métriques).",
    'cv.summaryHint': "2–3 phrases en haut du CV. Incluez votre niveau, spécialité et objectif. Bon pour l'ATS.",
    'cv.interestsLbl': 'Liste (séparés par virgule)', 'cv.themeHint': "Les changements s'appliquent en direct à l'aperçu et à l'export PDF.",
    'cv.descBulletLbl': 'Description (une ligne = un bullet point)',
    'cv.expDescPh': "Développement d'une fonctionnalité X&#10;Amélioration des performances de Y&#10;Collaboration avec l'équipe Z",
    'cv.summaryGen': '✨ Générer', 'cv.summaryRewrite': '🔄 Réécrire', 'cv.newSkillPh': '+ Nouvelle compétence…',
    'cv.photoChange': '🔄 Changer', 'cv.photoAdd': '+ Photo', 'cv.photoDelete': '✕ Supprimer',
    'cv.photoHint': 'JPG / PNG<br>Recommandé : 150×200px',
    'cv.accentLabel': "Couleur d'accent (titres & lignes)", 'cv.accentCustom': 'Couleur personnalisée', 'cv.fontLabel': 'Police du CV',
    'cv.fbExperience': 'Expérience', 'cv.fbEducation': 'Formation', 'cv.fbCategory': 'Catégorie', 'cv.fbProject': 'Projet',
    'cv.fbLanguage': 'Langue', 'cv.fbCertification': 'Certification', 'cv.fbAchievement': 'Réalisation',
    'cv.aiAuditTitle': '🔍 Audit complet du CV', 'cv.aiProjTitle': '✨ Améliorer la description du projet',
    'cv.aiSummaryGenTitle': '✨ Générer un résumé professionnel', 'cv.aiSummaryRewriteTitle': '🔄 Réécrire le résumé',
    'cv.aiExpTitle': '✨ Réécrire la description',
    'cv.warnWriteDesc': "⚠ Écrivez d'abord une description", 'cv.warnWriteSummary': "⚠ Écrivez d'abord un résumé à réécrire",
    'cv.photoTooBig': '⚠ Image trop lourde — max 1.5 Mo', 'cv.photoAdded': '✅ Photo ajoutée', 'cv.photoRemoved': '🗑 Photo supprimée',
    'cv.atsOpened': '📄 ATS export ouvert — Ctrl+P → Save as PDF', 'common.popupBlocked': '⚠ Autorisez les popups pour exporter le PDF',
    // ── Letters ──
    'common.back': '← Retour',
    'letters.new': '+ Nouvelle lettre', 'letters.newCard': 'Nouvelle lettre',
    'letters.noCompany': 'Entreprise non définie', 'letters.noPosition': 'Poste non défini', 'letters.edit': '✏️ Éditer',
    'letters.confirmDelete': 'Supprimer cette lettre ?', 'letters.deleted': '🗑 Lettre supprimée',
    'letters.titlePh': 'Titre de la lettre', 'letters.autosave': 'Auto-save activé', 'letters.savedStatus': '✅ Sauvegardé',
    'letters.generate': '✨ Générer la lettre', 'letters.genTitle': '✨ Générer la lettre de motivation',
    'letters.info': 'Informations de la lettre', 'letters.targetPosition': 'Poste visé', 'letters.recruiter': 'Recruteur',
    'letters.date': 'Date', 'letters.companyAddress': 'Adresse entreprise',
    'letters.companyPh': "Nom de l'entreprise", 'letters.positionPh': 'Stage de Perfectionnement — ...',
    'letters.recruiterPh': 'Mme / M. ...', 'letters.datePh': '22 mai 2026', 'letters.addressPh': 'Adresse complète',
    'letters.body': 'Corps de la lettre', 'letters.tagHint': 'Tapez <strong>@</strong> pour insérer un tag',
    'letters.paraBefore': '+ Para avant', 'letters.paraDel': '✕ Suppr.', 'letters.paraAfter': '+ Para après',
    'letters.paraPh': 'Paragraphe', 'letters.addPara': '+ Ajouter un paragraphe',
    'letters.quality': '📊 Qualité de la lettre', 'letters.tagsAvail': '🏷️ Tags disponibles',
    'letters.searchTag': 'Chercher un tag…', 'letters.settings': 'Paramètres lettre',
    'letters.reset': '↺ Réinitialiser', 'letters.confirmReset': 'Réinitialiser le contenu de cette lettre ?',
    'letters.aiParaTitle': '✨ Améliorer le paragraphe', 'letters.paraEmpty': '⚠ Ce paragraphe est vide',
    'letters.chkLengthPre': 'Longueur :', 'letters.chkLengthSuf': 'mots (cible 250–400)',
    'letters.chkCompanyOk': 'Entreprise citée dans le texte', 'letters.chkCompanyNo': "Citez le nom de l'entreprise (47% rejettent les lettres génériques)",
    'letters.chkNumOk': 'Contient une métrique/chiffre', 'letters.chkNumNo': 'Ajoutez un chiffre concret (77% des recruteurs préfèrent)',
    'letters.chkGenericBad': 'Évitez les phrases clichées détectées', 'letters.chkGenericOk': 'Pas de phrase clichée détectée',
    // ── ATS ──
    'ats.jdTitle': '📋 Description du poste', 'ats.jdPh': "Collez ici le texte complet de l'offre d'emploi / stage…",
    'ats.analyze': '⚡ Analyser le match',
    'ats.emptyL1': 'Collez une offre puis cliquez sur <strong>Analyser</strong>.', 'ats.emptyL2': 'Vous verrez votre score de correspondance et les mots-clés manquants.',
    'ats.warnMore': '⚠ Collez une offre plus complète',
    'ats.verdictHigh': 'Excellent — prêt à postuler', 'ats.verdictMid': 'Correct — ajoutez quelques mots-clés', 'ats.verdictLow': 'Faible — intégrez les mots-clés manquants',
    'ats.kwStat': 'mots-clés trouvés · objectif ≥ 75%',
    'ats.missing': '❌ Mots-clés manquants', 'ats.aiSuggest': '✨ Suggestions IA',
    'ats.addRelevant': 'Ajoutez ceux qui vous correspondent à votre CV (compétences, résumé, projets) :',
    'ats.noneMissing': 'Aucun mot-clé manquant 🎉', 'ats.present': '✅ Mots-clés présents',
    'ats.aiSuggestTitle': '✨ Suggestions pour intégrer les mots-clés',
    // ── Tracker / statuses ──
    'common.close': 'Fermer',
    'status.wishlist': 'Souhaits', 'status.applied': 'Postulé', 'status.interview': 'Entretien', 'status.offer': 'Offre', 'status.rejected': 'Refusé',
    'tracker.manualAdd': '+ Manuel',
    'tracker.emptyTitle': 'Votre tracker est vide', 'tracker.emptyBody': "Le Tracker est votre pipeline personnel de candidatures — il ne se remplit pas tout seul. Ajoutez des offres depuis le Radar, via Quick Apply, ou manuellement.", 'tracker.emptyRadar': '🛰 Parcourir le Radar', 'tracker.emptyApply': '🚀 Quick Apply', 'tracker.emptyManual': '+ Ajouter manuellement', 'tracker.emptyHint': "Astuce : sur le Radar, cliquez « ＋ Suivre » sur une offre pour l'envoyer ici en wishlist.", 'tracker.position': 'Poste', 'tracker.positionPh': 'Stage de perfectionnement — ...',
    'tracker.status': 'Statut', 'tracker.dateApplied': 'Date candidature', 'tracker.dateFollowup': 'Date de relance', 'tracker.type': 'Type',
    'tracker.link': "Lien de l'offre", 'tracker.contact': 'Contact', 'tracker.contactPh': 'email / nom du recruteur',
    'tracker.salary': 'Salaire / Indemnité', 'tracker.salaryPh': 'ex: 400 DT/mois',
    'tracker.jdLabel': "Description du poste (pour l'IA)", 'tracker.jdPh': "Collez la description du poste ici pour activer l'aide IA…",
    'tracker.notes': 'Notes', 'tracker.notesPh': 'Suivi, impressions, to-do...',
    'tracker.search': '🔍 Rechercher entreprise ou poste…', 'tracker.filterAll': 'Tout',
    'tracker.warnCompany': "⚠ Entrez au moins le nom de l'entreprise", 'tracker.added': '✅ Candidature ajoutée',
    'tracker.confirmDelete': 'Supprimer cette candidature ?',
    'tracker.aiFollowupTitle': '✨ Email de relance', 'tracker.aiInterviewTitle': '✨ Préparation entretien',
    'tracker.insights': '📈 Insights', 'tracker.sent1': 'candidature envoyée', 'tracker.sentN': 'candidatures envoyées',
    'tracker.responseRate': 'Taux de réponse', 'tracker.interviews': 'Entretiens',
    'tracker.offer1': 'Offre', 'tracker.offerN': 'Offres', 'tracker.thisWeek': 'Cette semaine', 'tracker.last7': '7 derniers j',
    'tracker.thisMonth': 'Ce mois', 'tracker.last30': '30 derniers j', 'tracker.aiPkg': 'Package IA',
    'tracker.badgeAI': '✨ IA', 'tracker.badgeOverdue': '⏰ Retard', 'tracker.badgeSoon': '⏰ Bientôt',
    'tracker.followupPrefix': '🔔 Relance:', 'tracker.viewOffer': "🔗 Voir l'offre", 'tracker.btnFollowup': '✨ Relance', 'tracker.btnInterview': '✨ Entretien',
    'tracker.internFallback': 'Stage',
    'tracker.mCandidature': '📅 Candidature', 'tracker.mFollowup': '🔔 Relance', 'tracker.mLink': '🔗 Lien',
    'tracker.mContact': '👤 Contact', 'tracker.mSalary': '💰 Salaire', 'tracker.mType': '🏠 Type', 'tracker.mNotes': '📝 Notes',
    'tracker.tailoredSummary': '✨ Résumé CV adapté', 'tracker.tailoredLetter': '✨ Lettre adaptée', 'tracker.jdSection': '📋 Description du poste',
    'tracker.noPkg': 'Pas encore de package IA. Utilisez <strong>Quick Apply</strong> pour en générer un.',
    'tracker.btnPrepInterview': '✨ Préparer entretien', 'tracker.followupSaved': '🔔 Date de relance sauvegardée',
    // ── Quick Apply ──
    'apply.jobInfo': "📋 Informations de l'offre", 'apply.targetPosition': 'Poste ciblé', 'apply.positionPh': 'ex: Développeur Web',
    'apply.jdLabel': 'Description du poste', 'apply.jdPh': "Collez ici le texte complet de l'offre (plus c'est complet, plus l'adaptation est précise)…",
    'apply.adapt': '✨ Adapter avec Claude', 'apply.adaptTitle': '✨ Adaptation du dossier',
    'apply.step1': "Remplissez les infos de l'offre", 'apply.step2': '<strong>Analyser</strong> → score ATS + mots-clés manquants',
    'apply.step3': '<strong>Adapter avec Claude</strong> → résumé CV + lettre sur mesure', 'apply.step4': 'Sauvegardez dans le tracker',
    'apply.warnMore': '⚠ Collez une description plus complète', 'apply.pkgDone': '✅ Package adapté — relisez puis sauvegardez',
    'apply.atsScore': '📊 Score ATS', 'apply.kwMid': 'mots-clés sur', 'apply.kwEnd': 'détectés dans votre CV',
    'apply.positioning': 'Comment vous positionner',
    'apply.missing': 'MANQUANTS', 'apply.present': 'PRÉSENTS',
    'apply.pkgTitle': '✨ Package adapté par Claude', 'apply.pkgSummary': 'Résumé CV adapté', 'apply.pkgLetter': 'Lettre de motivation adaptée',
    'apply.saveTracker': '💾 Sauvegarder dans le Tracker',
    'apply.adaptHint': 'Cliquez sur <strong>✨ Adapter avec Claude</strong> pour générer le résumé CV et la lettre sur mesure.',
    'apply.warnCompany': "⚠ Entrez le nom de l'entreprise", 'apply.savedToast': '✅ Candidature sauvegardée dans le Tracker !',
    // ── AI modal statuses + data ──
    'store.full': '⚠ Sauvegarde impossible — stockage plein. Téléchargez un backup, puis allégez les données (ex: photo CV).',
    'ai.defaultTitle': '✨ Assistant IA', 'ai.connecting': '⏳ Connexion au bridge Claude…',
    'ai.generating': '⏳ Génération via votre abonnement Claude… (peut prendre 10–40 s)',
    'ai.researching': '🌐 Recherche sur le web puis génération… (peut prendre 1–3 min)',
    'ai.generated': '✅ Généré. Utilisez les boutons ci-dessous pour affiner, puis Appliquer.',
    'ai.bridgeErrPre': '⚠ Erreur du bridge : ', 'ai.bridgeErrSuf': '. Mode copier-coller activé.',
    'ai.notDetected': 'ℹ Bridge non détecté. Démarrez-le (dashboard/bridge) ou utilisez le copier-coller :',
    'ai.unexpectedPre': '⚠ Erreur inattendue : ', 'ai.badgeCopy': 'copier-coller',
    'ai.fallbackPh': 'Collez ici la réponse de Claude…',
    'ai.noText': '⚠ Aucun texte à transformer', 'ai.noResult': '⚠ Aucun résultat à appliquer',
    'ai.applied': '✅ Appliqué', 'ai.promptCopied': '📋 Prompt copié — collez-le dans Claude',
    'data.backupDownloaded': '💾 Sauvegarde téléchargée', 'data.restored': '✅ Données restaurées',
    'data.invalidBackup': '⚠ Fichier de sauvegarde invalide',
    'data.confirmReset': 'Réinitialiser toutes les données ? Cette action est irréversible.', 'data.resetDone': '🔄 Données réinitialisées',
  },
  en: {
    // ── Shell (static HTML) ──
    'brand.role': 'Career Manager',
    'nav.dashboard': 'Dashboard', 'nav.profile': 'Profile & Tags', 'nav.cv': 'CV Builder',
    'nav.letters': 'Letters', 'nav.ats': 'ATS Analyzer', 'nav.tracker': 'Job Tracker',
    'nav.apply': 'Quick Apply', 'nav.radar': 'Job Radar', 'nav.insights': 'Insights',
    'footer.backup': '⬇ Backup', 'footer.restore': '⬆ Restore', 'footer.reset': '⚠ Reset all data',
    'footer.themeTitle': 'Toggle dark/light', 'footer.backupTitle': 'Download a JSON backup',
    'footer.restoreTitle': 'Restore from a file', 'footer.langTitle': 'Switch language (FR/EN)',
    'ai.promptLabel': 'Prompt to copy into Claude:', 'ai.copyPrompt': '📋 Copy prompt',
    'ai.help': 'Paste it into Claude (claude.ai or Claude Code), then paste the answer below and click Apply.',
    'ai.outLabel': 'Result:', 'ai.tone': 'Tone', 'ai.pro': 'Pro', 'ai.casual': 'Casual', 'ai.formal': 'Formal',
    'ai.length': 'Length', 'ai.short': '↓ Short', 'ai.long': '↑ Long',
    'ai.enhance': '⚡ Enhance', 'ai.simplify': '✂ Simplify', 'ai.bullets': '• Bullets',
    'ai.outPlaceholder': 'The result will appear here…', 'ai.apply': '✓ Apply',
    'ai.regen': '↻ Regenerate', 'ai.copyOut': 'Copy result',
    'ai.ttPro': 'Make more professional', 'ai.ttCasual': 'Make more casual', 'ai.ttFormal': 'Make more formal',
    'ai.ttShort': 'Shorten the text', 'ai.ttLong': 'Expand the text', 'ai.ttEnhance': 'Improve impact',
    'ai.ttSimplify': 'Simplify the language', 'ai.ttBullets': 'Convert to bullet points',
    // ── Page headers ──
    'home.greeting': '👋 Hello', 'home.sub': 'Career Manager — CV · Letters · ATS · Applications · Radar',
    'profile.title': 'Profile & Tags', 'profile.sub': 'Edit your information and manage the tag library',
    'cv.title': 'CV Builder', 'cv.sub': 'Edit your sections and export to PDF',
    'letters.title': 'Cover Letters',
    'ats.title': '🤖 ATS Match Analyzer', 'ats.sub': 'Paste a job posting — compare keywords against your CV',
    'tracker.title': '📌 Job Tracker', 'tracker.withPkg': 'with AI package',
    'apply.title': '🚀 Quick Apply', 'apply.sub': 'Paste an offer → Claude tailors your CV + letter → Save to the tracker',
    'radar.title': '🔍 Job Radar', 'radar.sub': 'Live job feed + platforms for your Dev · Network · Mobile profile',
    // ── Home body ──
    'home.aiStrategy': '✨ AI Strategy', 'home.quickApply': '🚀 Quick Apply',
    'home.overdue1': 'overdue follow-up', 'home.overdueN': 'overdue follow-ups',
    'home.due': 'due', 'home.see': 'View →',
    'home.statCv': 'CV complete', 'home.statLetters1': 'Letter', 'home.statLettersN': 'Letters',
    'home.statApps1': 'Application', 'home.statAppsN': 'Applications', 'home.statTags': 'Tags',
    'home.cvComplete': '✅ CV completeness —', 'home.improve': 'Improve',
    'home.pipeline': '📊 Application pipeline', 'home.seeAll': 'View all', 'home.recent': 'Recent',
    'home.noApps': 'No applications yet.', 'home.applyNow': '🚀 Apply now',
    'home.quickActions': 'Quick actions', 'home.qaApply': '🚀 Quick Apply — Tailor & apply',
    'home.qaCv': '📄 CV Builder', 'home.qaLetters': '✉️ Cover letters',
    'home.qaAts': '🤖 ATS analysis', 'home.qaRadar': '🔍 Job Radar',
    'home.howTitle': '💡 How it works',
    'home.step1': 'Complete your CV profile',
    'home.step2': 'Paste an offer into <strong>Quick Apply</strong> → Claude tailors your CV + letter',
    'home.step3': 'Copy the package → apply on the job site',
    'home.step4': 'The application is saved to the <strong>Tracker</strong>',
    'home.step5': 'Use the <strong>✨</strong> buttons for follow-ups and interview prep',
    'home.tip': 'Type <code style="background:var(--bg);padding:2px 6px;border-radius:4px">@</code> in the editors to insert your profile data.',
    // ── CV completeness checks ──
    'cv.check.name': 'Name filled in', 'cv.check.email': 'Email filled in',
    'cv.check.phone': 'Phone (ATS reads contact info)', 'cv.check.linkedin': 'LinkedIn added',
    'cv.check.summary': 'Professional summary (≥40 chars)', 'cv.check.education': 'At least one education entry',
    'cv.check.skills': 'At least 3 skill categories', 'cv.check.projects': 'At least 2 projects',
    'cv.check.projectsDesc': 'All projects have a description', 'cv.check.achievements': 'At least one achievement',
    'cv.check.languages': 'At least 2 languages',
    // ── Radar body ──
    'radar.strategy': '✨ AI Strategy', 'radar.feedTitle': '📡 Live job feed',
    'radar.feedVia': 'via the bridge — 6 free sources',
    'radar.searchPh': 'Keyword: react, python, network, security…', 'radar.searchBtn': '🔍 Search',
    'radar.internOnly': 'Hide senior roles', 'radar.sources': 'Sources:',
    'radar.boardsTitle': '🔗 Platforms to browse',
    'radar.tipBody': "<strong>💡 Tip:</strong> Click <strong>🚀 Tailor</strong> on a job → it loads into <a href=\"#apply\" onclick=\"Router.go('#apply')\" style=\"color:var(--primary);font-weight:600\">Quick Apply</a>, where Claude tailors your CV and letter to that offer in seconds. Or browse the platforms below manually.",
    'radar.loading': 'Searching live jobs…',
    'radar.noBridge': 'ℹ Bridge not detected. Start <strong>dashboard/bridge</strong> (start-bridge.cmd) for the live job feed. Meanwhile, use the platforms below.',
    'radar.timeout': '⏱ Timed out — try again.',
    'radar.none': 'No jobs found. Broaden the keyword, or use the platforms below (LinkedIn, Keejob…) — they list many more local internships.',
    'radar.notLaunched': 'Run a search to show live jobs.',
    'radar.selectSrc': 'Select at least one source.',
    'radar.adapt': '🚀 Tailor', 'radar.view': '🔗 View',
    'radar.offer1': 'job', 'radar.offerN': 'jobs', 'radar.internSuffix': ' · junior-friendly',
    'radar.loadedToast': '🚀 Job loaded into Quick Apply',
    'radar.save': '＋ Save', 'radar.saveTip': 'Add to tracker (Wishlist)', 'radar.tracked': '✓ Tracked', 'radar.trackedTip': 'Already in tracker',
    'radar.savedToast2': '✓ Added to tracker (Wishlist)', 'radar.remoteBadge': 'Remote',
    'radar.sourceErr': '⚠ Sources unavailable:', 'radar.cachedNote': '· cached',
    'radar.strategyTitle': '✨ Internship search strategy', 'radar.remoteOnly': 'Remote only',
    'radar.chipsLabel': 'Shortcuts:',
    'radar.filtersLabel': 'Filters:',
    'radar.visaOnly': 'Visa / relocation', 'radar.visaBadge': '🛂 Visa',
    'radar.visaTip': 'Mentions visa sponsorship or relocation help',
    'radar.selectAll': 'All', 'radar.selectNone': 'None',
    'radar.helpToggle': '❔ What do these filters mean?',
    'radar.helpKeyword': '<strong>Keyword</strong>: a role or tech (e.g. react, python, network).',
    'radar.helpSenior': '<strong>Hide senior</strong>: removes Senior / Lead / Manager roles — shows junior, entry-level & internships.',
    'radar.helpRemote': '<strong>Remote only</strong>: only fully-remote jobs.',
    'radar.helpVisa': '<strong>Visa / relocation</strong>: keeps only jobs that mention visa sponsorship or relocation help — useful if you need to move abroad.',
    'radar.helpSources': '<strong>Sources</strong>: Remotive · RemoteOK · Jobicy = global remote tech · Arbeitnow = Europe (many internships) · The Muse = real companies (on-site, best for visa/relocation) · Himalayas = remote with listed salaries.',
    'radar.srcRemotive': 'Global remote tech', 'radar.srcRemoteok': 'Global remote tech',
    'radar.srcArbeitnow': 'Europe — many internships (Praktikum / Werkstudent)', 'radar.srcJobicy': 'Remote, with experience level',
    'radar.srcThemuse': 'Real worldwide companies (on-site + remote) — best for visa / relocation',
    'radar.srcHimalayas': 'Remote, with listed salaries',
    'radar.srcAdzuna': 'On-site jobs (UK, Canada…) — needs a free API key',
    'radar.savedLabel': 'Tracked searches:',
    'radar.noSaved': 'None yet — save a search to track new jobs.',
    'radar.saveSearch': 'Track', 'radar.saveSearchTip': 'Save this search and track new jobs',
    'radar.searchSaved': '★ Search tracked', 'radar.savedAlready': 'Already in your tracked searches',
    'radar.removeSaved': 'Remove', 'radar.checkNew': 'Check', 'radar.checkingNew': '⏳ Checking for new jobs…',
    'radar.newWord': 'new job(s)', 'radar.noNew': '✓ Nothing new', 'radar.noBridgeShort': "ℹ Bridge off — can't check",
    'radar.newAcross': 'across your saved searches — click to open them:', 'radar.boardsQuery': 'These boards search:',
    'radar.newBadge': 'NEW', 'radar.newTip': 'New since your last visit',
    'radar.autoMatch': 'Auto-match (CV)',
    'radar.helpSaved': "<strong>Tracked searches</strong>: ★ Track saves a search; a badge on “Job Radar” counts jobs that are new since your last visit (NEW badge on cards).",
    'radar.helpAuto': "<strong>Auto-match (CV)</strong>: after each search, Claude automatically ranks jobs by your CV (needs the bridge).",
    'radar.englishOnly': 'English only', 'radar.langTip': 'Posting written in another language',
    'radar.helpEnglish': "<strong>English only</strong>: hides postings written in German or French — keeps English only.",
    'radar.regionLabel': 'Region:', 'radar.regionClear': 'Clear',
    'radar.helpRegion': "<strong>Region</strong>: filter by country / area (Remote, Gulf, Ireland, UK, Canada…). Pick several; none selected = all regions.",
    'region.remote': 'Remote', 'region.gulf': 'Gulf', 'region.ireland': 'Ireland', 'region.uk': 'UK', 'region.canada': 'Canada',
    'region.usa': 'USA', 'region.germany': 'Germany', 'region.netherlands': 'Netherlands', 'region.europe': 'Europe', 'region.tunisia': 'Tunisia',
    'radar.aiMatch': '✨ Match to my CV', 'radar.aiMatchTitle': '✨ Jobs matched to your CV',
    'radar.aiMatching': '⏳ Analyzing…', 'radar.aiMatchDone': '🎯 Jobs ranked by your CV',
    'radar.aiRanked': '🎯 Ranked by your CV', 'radar.aiClear': '✕ Clear',
    'radar.aiNeedJobs': '⚠ Run a search first', 'radar.matchTip': 'Fit with your profile',
    'radar.fitTip': 'Match with your CV skills',
    'radar.insFitLabel': 'CV fit', 'radar.insStrong': 'strong', 'radar.insPartial': 'partial', 'radar.insLow': 'low', 'radar.insAvg': 'avg',
    'radar.insRemote': 'remote', 'radar.insVisa': 'visa', 'radar.insSalary': 'with salary',
    'radar.insHave': 'You have', 'radar.insMissing': 'To add / learn', 'radar.insNoSkills': 'No clear tech skills detected in these jobs.',
    'radar.insMarket': '✨ Market read (Claude)', 'radar.insMarketRun': '⏳ Reading the market…', 'radar.insMarketHint': 'Claude reads the loaded jobs and summarizes trends, in-demand skills and advice for your profile.',
    'radar.skTip': 'Click for actions on this skill', 'radar.skFind': '🔍 Find jobs', 'radar.skLearn': '🎓 Learn', 'radar.skAddCv': '➕ I have this — add to CV',
    'radar.skAddedToast': 'added to your CV', 'radar.skNoCat': '⚠ No skills category in your CV', 'radar.skDup': 'ℹ Already in your CV',
    'radar.helpAi': "<strong>✨ Match to my CV</strong>: Claude ranks the jobs above by fit to your profile (match score + reason). Needs the bridge, otherwise copy-paste mode.",
    'age.today': 'today', 'age.yesterday': 'yesterday', 'age.days': 'd', 'age.months': 'mo',
    // ── Today command center + bridge status ──
    'today.title': 'Today', 'today.newMatches': 'New matches', 'today.followups': 'Follow-ups due', 'today.toApply': 'To apply',
    'today.actCheck': 'Check new job matches', 'today.actFollow': 'Follow up', 'today.actApply': 'Apply to shortlisted jobs',
    'today.actCv': 'Improve your CV', 'today.actSave': 'Save a search in the Radar', 'today.actSearch': 'Search for new roles',
    'bridge.checking': 'Checking…', 'bridge.on': 'Bridge connected', 'bridge.off': 'Bridge offline', 'bridge.stale': 'Bridge outdated',
    'bridge.onTip': 'AI and live job feed are active.', 'bridge.offTip': 'Bridge is off — run bridge/start-bridge.cmd to enable AI and the live job feed.',
    'bridge.staleTip': 'An old bridge instance is running — close its window and relaunch start-bridge.cmd.',
    // ── Insights view ──
    'insights.title': '📊 Insights', 'insights.sub': 'See what works so you can double down',
    'insights.applied': 'Applied', 'insights.activity': '📈 Activity', 'insights.activitySub': 'applications / week (last 8)', 'insights.wk0': 'this wk',
    'insights.bySource': '🎯 By source', 'insights.direct': 'Direct / manual', 'insights.respShort': 'reply', 'insights.noSource': 'Apply via the Radar to track sources.',
    'insights.needsAction': '⚡ Needs action', 'insights.overdueFollow': 'Follow-up overdue', 'insights.stale': 'No reply 14d+', 'insights.allClear': 'All caught up 🎉',
    'insights.empty': 'No applications to analyse yet — start applying.',
    // ── Common ──
    'common.save': '💾 Save', 'common.cancel': 'Cancel', 'common.copy': '📋 Copy',
    'common.copied': '📋 Copied', 'common.copiedClip': '📋 Copied to clipboard',
    'common.email': 'Email', 'common.notParsable': '⚠ AI response not parsable — copy manually',
    'common.saved': '✅ Saved', 'common.deleted': '🗑 Deleted',
    // ── Profile ──
    'profile.enrich': '✨ Enrich with AI', 'profile.enrichTitle': '✨ Profile enrichment',
    'profile.tabProfile': '👤 Profile', 'profile.tabTags': '🏷️ Tags Library',
    'profile.personalInfo': 'Personal information',
    'profile.fullName': 'Full name', 'profile.titleRole': 'Title / Role', 'profile.city': 'City', 'profile.phone': 'Phone',
    'profile.tagLibrary': 'Tag library', 'profile.newTag': '+ New tag',
    'profile.thKey': 'Key (@key)', 'profile.thLabel': 'Label', 'profile.thValue': 'Value',
    'profile.tagTip': '💡 Type <strong>@</strong> in the letter editor to insert any tag.',
    'profile.savedToast': '✅ Profile saved', 'profile.tagDeleted': 'Tag deleted',
    'profile.newTagLabel': 'New tag', 'profile.newTagValue': 'Value',
    'profile.tagsAddedSuffix': 'tag(s) added',
    // ── CV Builder ──
    'common.add': '+ Add',
    'cv.sec.personal': '👤 Personal', 'cv.sec.summary': '📝 Summary', 'cv.sec.experience': '💼 Experience',
    'cv.sec.education': '🎓 Education', 'cv.sec.skills': '⚙️ Skills', 'cv.sec.projects': '🛠 Projects',
    'cv.sec.certifications': '📜 Certifications', 'cv.sec.achievements': '🏆 Achievements',
    'cv.sec.languages': '🌐 Languages', 'cv.sec.interests': '💡 Interests', 'cv.sec.theme': '🎨 Theme & Style',
    'cv.auditBtn': '🔍 AI Audit', 'cv.auditTitle': 'Full AI CV analysis',
    'cv.atsExport': '🤖 ATS Export', 'cv.atsExportTitle': 'ATS-safe: no layout CSS, semantic HTML, Arial font — best for job portals',
    'cv.exportPdf': '📥 Export PDF',
    'cv.dragReorder': 'Drag to reorder', 'cv.collapse': 'Collapse/Expand', 'cv.duplicate': 'Duplicate',
    'cv.showInCv': 'Show in CV', 'cv.hideFromCv': 'Hide from CV', 'cv.show': 'Show', 'cv.hide': 'Hide', 'cv.deleteWord': 'Delete',
    'cv.improve': '✨ Improve',
    'cv.lblName': 'Name', 'cv.lblTitle': 'Title', 'cv.lblLocation': 'Location', 'cv.lblDescription': 'Description',
    'cv.lblYear': 'Year', 'cv.lblYears': 'Years', 'cv.lblLevel': 'Level', 'cv.lblLanguage': 'Language',
    'cv.lblCategory': 'Category', 'cv.lblSkills': 'Skills', 'cv.lblTech': 'Technologies',
    'cv.lblCompany': 'Company', 'cv.lblPosition': 'Position / Internship title',
    'cv.lblPeriod': 'Period (e.g. June 2025 – July 2025)', 'cv.lblDegree': 'Degree', 'cv.lblSchool': 'School', 'cv.lblIssuer': 'Issuer',
    'cv.expTitle': 'Professional experience', 'cv.eduTitle': 'Education', 'cv.skillsTitle': 'Skills',
    'cv.projTitle': 'Projects', 'cv.langTitle': 'Languages', 'cv.interestsTitle': 'Interests',
    'cv.summaryTitle': 'Professional summary', 'cv.certTitle': 'Certifications', 'cv.achTitle': 'Key achievements',
    'cv.themeTitle': 'CV Theme & Style',
    'cv.expHint1': '💡 Each description line becomes a bullet point in the CV. Use ✨ to rewrite with AI.',
    'cv.expHint2': 'Internships, work-study, jobs. Describe each task with bullet points (one line = one bullet).',
    'cv.skillsHint': 'Click 👁 to hide a skill from the CV (without deleting it). Press Enter to add.',
    'cv.achHint': '💡 ATS tip: start with an action verb and add a number when possible (77% of recruiters prefer metrics).',
    'cv.summaryHint': '2–3 sentences at the top of the CV. Include your level, specialty and goal. Good for ATS.',
    'cv.interestsLbl': 'List (comma-separated)', 'cv.themeHint': 'Changes apply live to the preview and PDF export.',
    'cv.descBulletLbl': 'Description (one line = one bullet)',
    'cv.expDescPh': 'Built feature X&#10;Improved performance of Y&#10;Collaborated with team Z',
    'cv.summaryGen': '✨ Generate', 'cv.summaryRewrite': '🔄 Rewrite', 'cv.newSkillPh': '+ New skill…',
    'cv.photoChange': '🔄 Change', 'cv.photoAdd': '+ Photo', 'cv.photoDelete': '✕ Delete',
    'cv.photoHint': 'JPG / PNG<br>Recommended: 150×200px',
    'cv.accentLabel': 'Accent color (headings & lines)', 'cv.accentCustom': 'Custom color', 'cv.fontLabel': 'CV font',
    'cv.fbExperience': 'Experience', 'cv.fbEducation': 'Education', 'cv.fbCategory': 'Category', 'cv.fbProject': 'Project',
    'cv.fbLanguage': 'Language', 'cv.fbCertification': 'Certification', 'cv.fbAchievement': 'Achievement',
    'cv.aiAuditTitle': '🔍 Full CV audit', 'cv.aiProjTitle': '✨ Improve project description',
    'cv.aiSummaryGenTitle': '✨ Generate a professional summary', 'cv.aiSummaryRewriteTitle': '🔄 Rewrite the summary',
    'cv.aiExpTitle': '✨ Rewrite the description',
    'cv.warnWriteDesc': '⚠ Write a description first', 'cv.warnWriteSummary': '⚠ Write a summary to rewrite first',
    'cv.photoTooBig': '⚠ Image too large — max 1.5 MB', 'cv.photoAdded': '✅ Photo added', 'cv.photoRemoved': '🗑 Photo removed',
    'cv.atsOpened': '📄 ATS export opened — Ctrl+P → Save as PDF', 'common.popupBlocked': '⚠ Allow popups to export the PDF',
    // ── Letters ──
    'common.back': '← Back',
    'letters.new': '+ New letter', 'letters.newCard': 'New letter',
    'letters.noCompany': 'Company not set', 'letters.noPosition': 'Position not set', 'letters.edit': '✏️ Edit',
    'letters.confirmDelete': 'Delete this letter?', 'letters.deleted': '🗑 Letter deleted',
    'letters.titlePh': 'Letter title', 'letters.autosave': 'Auto-save on', 'letters.savedStatus': '✅ Saved',
    'letters.generate': '✨ Generate letter', 'letters.genTitle': '✨ Generate cover letter',
    'letters.info': 'Letter information', 'letters.targetPosition': 'Target position', 'letters.recruiter': 'Recruiter',
    'letters.date': 'Date', 'letters.companyAddress': 'Company address',
    'letters.companyPh': 'Company name', 'letters.positionPh': 'Internship — ...',
    'letters.recruiterPh': 'Ms / Mr ...', 'letters.datePh': 'May 22, 2026', 'letters.addressPh': 'Full address',
    'letters.body': 'Letter body', 'letters.tagHint': 'Type <strong>@</strong> to insert a tag',
    'letters.paraBefore': '+ Para before', 'letters.paraDel': '✕ Del', 'letters.paraAfter': '+ Para after',
    'letters.paraPh': 'Paragraph', 'letters.addPara': '+ Add a paragraph',
    'letters.quality': '📊 Letter quality', 'letters.tagsAvail': '🏷️ Available tags',
    'letters.searchTag': 'Search a tag…', 'letters.settings': 'Letter settings',
    'letters.reset': '↺ Reset', 'letters.confirmReset': 'Reset this letter content?',
    'letters.aiParaTitle': '✨ Improve paragraph', 'letters.paraEmpty': '⚠ This paragraph is empty',
    'letters.chkLengthPre': 'Length:', 'letters.chkLengthSuf': 'words (target 250–400)',
    'letters.chkCompanyOk': 'Company named in the text', 'letters.chkCompanyNo': 'Name the company (47% reject generic letters)',
    'letters.chkNumOk': 'Contains a metric/number', 'letters.chkNumNo': 'Add a concrete number (77% of recruiters prefer it)',
    'letters.chkGenericBad': 'Avoid the detected clichés', 'letters.chkGenericOk': 'No cliché detected',
    // ── ATS ──
    'ats.jdTitle': '📋 Job description', 'ats.jdPh': 'Paste the full job / internship posting here…',
    'ats.analyze': '⚡ Analyze match',
    'ats.emptyL1': 'Paste an offer then click <strong>Analyze</strong>.', 'ats.emptyL2': "You'll see your match score and the missing keywords.",
    'ats.warnMore': '⚠ Paste a more complete offer',
    'ats.verdictHigh': 'Excellent — ready to apply', 'ats.verdictMid': 'Decent — add a few keywords', 'ats.verdictLow': 'Weak — work in the missing keywords',
    'ats.kwStat': 'keywords found · target ≥ 75%',
    'ats.missing': '❌ Missing keywords', 'ats.aiSuggest': '✨ AI suggestions',
    'ats.addRelevant': 'Add the ones that fit your CV (skills, summary, projects):',
    'ats.noneMissing': 'No missing keywords 🎉', 'ats.present': '✅ Present keywords',
    'ats.aiSuggestTitle': '✨ Suggestions to integrate the keywords',
    // ── Tracker / statuses ──
    'common.close': 'Close',
    'status.wishlist': 'Wishlist', 'status.applied': 'Applied', 'status.interview': 'Interview', 'status.offer': 'Offer', 'status.rejected': 'Rejected',
    'tracker.manualAdd': '+ Manual',
    'tracker.emptyTitle': 'Your tracker is empty', 'tracker.emptyBody': "The Tracker is your personal application pipeline — it doesn't fill itself. Add jobs from the Radar, via Quick Apply, or manually.", 'tracker.emptyRadar': '🛰 Browse the Radar', 'tracker.emptyApply': '🚀 Quick Apply', 'tracker.emptyManual': '+ Add manually', 'tracker.emptyHint': 'Tip: on the Radar, click "＋ Track" on a job to send it here as a wishlist item.', 'tracker.position': 'Position', 'tracker.positionPh': 'Internship — ...',
    'tracker.status': 'Status', 'tracker.dateApplied': 'Application date', 'tracker.dateFollowup': 'Follow-up date', 'tracker.type': 'Type',
    'tracker.link': 'Job link', 'tracker.contact': 'Contact', 'tracker.contactPh': 'email / recruiter name',
    'tracker.salary': 'Salary / Stipend', 'tracker.salaryPh': 'e.g. 400 DT/month',
    'tracker.jdLabel': 'Job description (for AI)', 'tracker.jdPh': 'Paste the job description here to enable AI help…',
    'tracker.notes': 'Notes', 'tracker.notesPh': 'Follow-up, impressions, to-do...',
    'tracker.search': '🔍 Search company or position…', 'tracker.filterAll': 'All',
    'tracker.warnCompany': '⚠ Enter at least the company name', 'tracker.added': '✅ Application added',
    'tracker.confirmDelete': 'Delete this application?',
    'tracker.aiFollowupTitle': '✨ Follow-up email', 'tracker.aiInterviewTitle': '✨ Interview prep',
    'tracker.insights': '📈 Insights', 'tracker.sent1': 'application sent', 'tracker.sentN': 'applications sent',
    'tracker.responseRate': 'Response rate', 'tracker.interviews': 'Interviews',
    'tracker.offer1': 'Offer', 'tracker.offerN': 'Offers', 'tracker.thisWeek': 'This week', 'tracker.last7': 'last 7 d',
    'tracker.thisMonth': 'This month', 'tracker.last30': 'last 30 d', 'tracker.aiPkg': 'AI package',
    'tracker.badgeAI': '✨ AI', 'tracker.badgeOverdue': '⏰ Overdue', 'tracker.badgeSoon': '⏰ Soon',
    'tracker.followupPrefix': '🔔 Follow-up:', 'tracker.viewOffer': '🔗 View offer', 'tracker.btnFollowup': '✨ Follow-up', 'tracker.btnInterview': '✨ Interview',
    'tracker.internFallback': 'Internship',
    'tracker.mCandidature': '📅 Applied', 'tracker.mFollowup': '🔔 Follow-up', 'tracker.mLink': '🔗 Link',
    'tracker.mContact': '👤 Contact', 'tracker.mSalary': '💰 Salary', 'tracker.mType': '🏠 Type', 'tracker.mNotes': '📝 Notes',
    'tracker.tailoredSummary': '✨ Tailored CV summary', 'tracker.tailoredLetter': '✨ Tailored letter', 'tracker.jdSection': '📋 Job description',
    'tracker.noPkg': 'No AI package yet. Use <strong>Quick Apply</strong> to generate one.',
    'tracker.btnPrepInterview': '✨ Prep interview', 'tracker.followupSaved': '🔔 Follow-up date saved',
    // ── Quick Apply ──
    'apply.jobInfo': '📋 Offer details', 'apply.targetPosition': 'Target position', 'apply.positionPh': 'e.g. Web Developer',
    'apply.jdLabel': 'Job description', 'apply.jdPh': 'Paste the full offer text here (the more complete, the more precise the tailoring)…',
    'apply.adapt': '✨ Tailor with Claude', 'apply.adaptTitle': '✨ Application tailoring',
    'apply.step1': 'Fill in the offer details', 'apply.step2': '<strong>Analyze</strong> → ATS score + missing keywords',
    'apply.step3': '<strong>Tailor with Claude</strong> → custom CV summary + letter', 'apply.step4': 'Save to the tracker',
    'apply.warnMore': '⚠ Paste a more complete description', 'apply.pkgDone': '✅ Package tailored — review then save',
    'apply.atsScore': '📊 ATS score', 'apply.kwMid': 'keywords of', 'apply.kwEnd': 'found in your CV',
    'apply.positioning': 'How to position yourself',
    'apply.missing': 'MISSING', 'apply.present': 'PRESENT',
    'apply.pkgTitle': '✨ Package tailored by Claude', 'apply.pkgSummary': 'Tailored CV summary', 'apply.pkgLetter': 'Tailored cover letter',
    'apply.saveTracker': '💾 Save to Tracker',
    'apply.adaptHint': 'Click <strong>✨ Tailor with Claude</strong> to generate the custom CV summary and letter.',
    'apply.warnCompany': '⚠ Enter the company name', 'apply.savedToast': '✅ Application saved to the Tracker!',
    // ── AI modal statuses + data ──
    'store.full': '⚠ Save failed — storage full. Download a backup, then trim the data (e.g. CV photo).',
    'ai.defaultTitle': '✨ AI Assistant', 'ai.connecting': '⏳ Connecting to the Claude bridge…',
    'ai.generating': '⏳ Generating via your Claude subscription… (can take 10–40 s)',
    'ai.researching': '🌐 Researching the web, then generating… (can take 1–3 min)',
    'ai.generated': '✅ Generated. Use the buttons below to refine, then Apply.',
    'ai.bridgeErrPre': '⚠ Bridge error: ', 'ai.bridgeErrSuf': '. Copy-paste mode enabled.',
    'ai.notDetected': 'ℹ Bridge not detected. Start it (dashboard/bridge) or use copy-paste:',
    'ai.unexpectedPre': '⚠ Unexpected error: ', 'ai.badgeCopy': 'copy-paste',
    'ai.fallbackPh': "Paste Claude's answer here…",
    'ai.noText': '⚠ No text to transform', 'ai.noResult': '⚠ No result to apply',
    'ai.applied': '✅ Applied', 'ai.promptCopied': '📋 Prompt copied — paste it into Claude',
    'data.backupDownloaded': '💾 Backup downloaded', 'data.restored': '✅ Data restored',
    'data.invalidBackup': '⚠ Invalid backup file',
    'data.confirmReset': 'Reset all data? This action is irreversible.', 'data.resetDone': '🔄 Data reset',
  },
};
function t(key) {
  const d = I18N[_lang] || I18N.fr;
  return key in d ? d[key] : (key in I18N.fr ? I18N.fr[key] : key);
}
function setLang(l) {
  _lang = l === 'en' ? 'en' : 'fr';
  document.documentElement.lang = _lang;
}
// Fill all static [data-i18n*] elements in index.html from the dictionary.
function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.getAttribute('data-i18n')); });
  document.querySelectorAll('[data-i18n-title]').forEach(el => { el.title = t(el.getAttribute('data-i18n-title')); });
  document.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.getAttribute('data-i18n-ph')); });
  const lb = document.getElementById('btn-lang');
  if (lb) lb.textContent = '🌐 ' + (_lang === 'fr' ? 'EN' : 'FR');
}

/* ── AI module: bridge call + copy-prompt fallback + modal ─────── */
const AI = {
  // Served by the bridge over http → same origin (no CORS). Opened as a file:// → default localhost.
  BRIDGE: location.protocol.startsWith('http') ? location.origin : 'http://127.0.0.1:8787',
  // Model tiers (passed per call; the bridge allowlists them and falls back to the
  // default if the plan can't use one). FAST = trivial text ops; SMART = solid reasoning;
  // MAX = make-or-break output that goes straight into a real application.
  FAST: 'haiku',
  SMART: 'sonnet',
  MAX: 'opus',
  _ctx: null,   // { prompt, onApply, model?, web? }
  _override: { model: '', web: false },   // live UI overrides (model picker + 🌐 research toggle)

  async _health() {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 1300);
      const r = await fetch(this.BRIDGE + '/health', { signal: ctrl.signal });
      clearTimeout(t);
      const j = await r.json();
      return !!j.ok;
    } catch { return false; }
  },

  async _generate(prompt, model, web, fresh) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), web ? 305000 : 185000);   // web research can take minutes
    const payload = { prompt };
    if (model) payload.model = model;
    if (web) payload.web = true;
    if (fresh) payload.fresh = true;   // bypass the bridge's response cache (Regenerate)
    const r = await fetch(this.BRIDGE + '/ai', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: ctrl.signal,
    });
    clearTimeout(t);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'bridge error');
    return j.text;
  },

  // Parse a JSON value out of an AI response; if it's malformed and the bridge is up,
  // ask Claude ONCE (fast model) to repair it instead of wasting the whole call.
  async _parseJSONwithRepair(text) {
    const tryParse = (s) => {
      try { return JSON.parse(String(s).trim().replace(/^```(?:json)?\s*|\s*```$/g, '')); }
      catch { return undefined; }
    };
    let v = tryParse(text);
    if (v !== undefined) return v;
    if (_bridgeOk === true || await this._health()) {
      try {
        const fixed = await this._generate(
          'The following was meant to be a single valid JSON value but is malformed '
          + '(extra prose, trailing commas, or markdown fences). Return ONLY the corrected, '
          + 'valid JSON — no markdown, no commentary:\n\n' + text, this.FAST);
        v = tryParse(fixed);
        if (v !== undefined) return v;
      } catch {}
    }
    return undefined;
  },

  // Close the modal and return focus to whatever opened it (accessibility).
  _close() {
    const m = document.getElementById('ai-modal');
    if (m) m.hidden = true;
    const f = this._lastFocus;
    if (f && typeof f.focus === 'function') { try { f.focus(); } catch {} }
  },
  // Visible, focusable controls inside the modal — for the Tab focus-trap.
  _focusables() {
    const m = document.getElementById('ai-modal');
    if (!m) return [];
    return [...m.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
      .filter(el => !el.disabled && el.offsetParent !== null);
  },

  // Public entry. opts: { title, prompt, onApply?(text), model?, web? }
  async assist(opts) {
    this._ctx = opts;
    this._lastFocus = document.activeElement;   // restore focus here on close
    // Each task starts at its own defaults: "Auto" model + the task's web setting.
    this._override = { model: '', web: !!opts.web };
    try {
      const m = document.getElementById('ai-modal');
      document.getElementById('ai-title').textContent = opts.title || t('ai.defaultTitle');
      document.getElementById('ai-output').value = '';
      document.getElementById('ai-apply').style.display = opts.onApply ? '' : 'none';
      document.getElementById('ai-toolbar').hidden = true;
      const sel = document.getElementById('ai-model'); if (sel) sel.value = 'auto';
      const web = document.getElementById('ai-web');   if (web) web.checked = !!opts.web;
      m.hidden = false;
      setTimeout(() => { const c = document.getElementById('ai-close'); if (c) c.focus(); }, 0);   // move keyboard focus into the dialog
      await this._run();
    } catch(e) {
      console.error('AI.assist error:', e);
      toast('⚠ Erreur IA : ' + e.message);
    }
  },

  async _run(opts = {}) {
    const status = document.getElementById('ai-status');
    const badge  = document.getElementById('ai-mode-badge');
    const promptWrap = document.getElementById('ai-prompt-wrap');
    const out = document.getElementById('ai-output');
    const regen = document.getElementById('ai-regen');
    const toolbar = document.getElementById('ai-toolbar');

    toolbar.hidden = true;
    promptWrap.hidden = true;
    out.value = '';
    status.textContent = t('ai.connecting');
    badge.textContent = '';

    try {
      // The sidebar status pill already polls /health every 25s and keeps _bridgeOk
      // current — trust it when it's up instead of an extra pre-flight ping. If it's
      // wrong (bridge died since), _generate fails and we fall back below anyway.
      const alive = _bridgeOk === true ? true : await this._health();
      if (alive) {
        badge.textContent = 'bridge'; badge.className = 'ai-badge ai-badge-on';
        status.textContent = t('ai.generating');
        regen.disabled = true;
        try {
          // Effective model/web = live UI override if set, else the task's own default.
          const model = this._override.model || this._ctx.model;
          const web = this._override.web;
          if (web) status.textContent = t('ai.researching');
          const text = await this._generate(this._ctx.prompt, model, web, !!opts.fresh);
          out.value = text;
          toolbar.hidden = false;
          status.textContent = t('ai.generated');
        } catch (e) {
          status.textContent = t('ai.bridgeErrPre') + e.message + t('ai.bridgeErrSuf');
          this._fallback();
        } finally { regen.disabled = false; }
      } else {
        badge.textContent = t('ai.badgeCopy'); badge.className = 'ai-badge ai-badge-off';
        status.textContent = t('ai.notDetected');
        this._fallback();
      }
    } catch(e) {
      status.textContent = t('ai.unexpectedPre') + e.message;
      console.error('AI._run error:', e);
      regen.disabled = false;
    }
  },

  _fallback() {
    const promptWrap = document.getElementById('ai-prompt-wrap');
    document.getElementById('ai-prompt').value = this._ctx.prompt;
    promptWrap.hidden = false;
    document.getElementById('ai-output').placeholder = t('ai.fallbackPh');
  },

  _transform(action, text) {
    const instructions = {
      professional: "Rewrite in a clean, factual professional tone. Strong action verbs. Keep all facts.",
      casual: "Rewrite in a natural, direct, warm tone, less formal. Keep all facts.",
      formal: "Rewrite in a formal register (report / official letter style). Keep all facts.",
      shorten: "Shorten by 35-45%. Cut the filler, keep the essentials and all key facts.",
      lengthen: "Expand by 35-45% with concrete detail and extra context. Invent nothing.",
      enhance: "Improve the impact: strong opening, more concrete results, better structure. Keep all facts.",
      simplify: "Simplify: short sentences, clear vocabulary, easy to read. Keep all facts.",
      bullets: "Convert into a list of punchy bullet points. Start each bullet with a strong action verb.",
      arabic: "Translate the text into natural, professional Modern Standard Arabic suitable for a job application in the Gulf. Keep the meaning, tone and every fact. Output ONLY the Arabic.",
      english: "Translate the text into natural, professional English. Keep the meaning, tone and every fact. Output ONLY the English.",
    };
    return (instructions[action] || "Improve this text.")
      + "\n\nText:\n" + text + "\n\nReply with ONLY the transformed text, nothing else.";
  },

  async _runTransform(action) {
    const text = document.getElementById('ai-output').value.trim();
    if (!text) { toast(t('ai.noText')); return; }
    const savedPrompt = this._ctx ? this._ctx.prompt : '';
    const savedModel  = this._ctx ? this._ctx.model : undefined;
    // Tone/length/translate rewrites are trivial → run them on the cheap/fast model.
    if (this._ctx) { this._ctx.prompt = this._transform(action, text); this._ctx.model = this.FAST; }
    await this._run();
    if (this._ctx) { this._ctx.prompt = savedPrompt; this._ctx.model = savedModel; }
  },

  init() {
    const m = document.getElementById('ai-modal');
    document.getElementById('ai-close').addEventListener('click', () => this._close());
    m.addEventListener('click', (e) => { if (e.target === m) this._close(); });
    // Keyboard a11y: Esc closes; Tab cycles within the dialog (focus trap).
    m.addEventListener('keydown', (e) => {
      if (m.hidden) return;
      if (e.key === 'Escape') { e.preventDefault(); this._close(); return; }
      if (e.key === 'Tab') {
        const f = this._focusables(); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });

    document.getElementById('ai-apply').addEventListener('click', () => {
      const text = document.getElementById('ai-output').value.trim();
      if (!text) { toast(t('ai.noResult')); return; }
      if (this._ctx && this._ctx.onApply) this._ctx.onApply(text);
      this._close();
      toast(t('ai.applied'));
    });
    document.getElementById('ai-regen').addEventListener('click', () => this._run({ fresh: true }));
    // Dynamic model picker + web-research toggle — change re-runs with the new setting.
    document.getElementById('ai-model')?.addEventListener('change', (e) => {
      this._override.model = e.target.value === 'auto' ? '' : e.target.value;
      this._run();
    });
    document.getElementById('ai-web')?.addEventListener('change', (e) => {
      this._override.web = e.target.checked;
      this._run();
    });
    document.getElementById('ai-copy-out').addEventListener('click', () => {
      navigator.clipboard?.writeText(document.getElementById('ai-output').value);
      toast(t('common.copied'));
    });
    document.getElementById('ai-copy-prompt').addEventListener('click', () => {
      navigator.clipboard?.writeText(document.getElementById('ai-prompt').value);
      toast(t('ai.promptCopied'));
    });

    document.querySelectorAll('.ai-tb-btn').forEach(btn => {
      btn.addEventListener('click', () => this._runTransform(btn.dataset.tb));
    });

    document.getElementById('ai-output').addEventListener('input', function() {
      document.getElementById('ai-toolbar').hidden = !this.value.trim();
    });
  },
};

/* ── CV-derived focus — the Radar + AI follow whatever the user puts in their CV,
   not a hard-coded field. Change your CV title/skills and these follow. ─────────── */
function candidateRole() {
  const t = ((Store.get().cv.personal || {}).title || '').trim();
  return t || 'junior tech candidate';
}
// A concise job-search query built from the CV title's specialisation (the part after a
// dash, e.g. "… — Network Administration & Security" → "network administration security").
function cvQuery() {
  let t = ((Store.get().cv.personal || {}).title || '');
  const parts = t.split(/[—–-]/);
  if (parts.length > 1) t = parts[parts.length - 1];
  const STOP = new Set(['software','engineering','student','degree','licence','bachelor','master','and','of','the','in','a','an','&','junior','senior','intern','internship','specialist']);
  const words = t.toLowerCase().split(/[\s,/&|]+/).map(w => w.trim()).filter(w => w.length > 2 && !STOP.has(w));
  return words.slice(0, 3).join(' ') || 'developer';
}
// Quick-search chips derived from the CV: the primary query + the user's skill categories.
function cvChips() {
  const cv = Store.get().cv;
  const raw = [cvQuery(), ...(cv.skills || []).map(s => (s.category || '').replace(/\s*&\s*/g, ' ').trim().toLowerCase())];
  const seen = new Set(), out = [];
  raw.forEach(c => { const k = c.toLowerCase(); if (c && !seen.has(k)) { seen.add(k); out.push(c); } });
  return out.slice(0, 10);
}

/* ── Local CV-fit scoring — rank jobs by overlap with the user's actual CV skills,
   computed in the browser (free, no Claude quota). Complements AI Match. ─────────── */
const _FIT_STOP = new Set(['and','the','for','with','dev','web','app','etc','data','api','junior','senior','of','in','an','use','using']);
// Build a matcher per CV skill/term: word-boundary regex so "aws" doesn't match "laws".
function cvSkillMatchers() {
  const cv = Store.get().cv;
  const terms = new Set();
  const add = s => { s = String(s || '').toLowerCase().replace(/[()]/g, '').trim(); if (s.length >= 3 && !_FIT_STOP.has(s)) terms.add(s); };
  (cv.skills || []).forEach(sk => {
    (Array.isArray(sk.items) ? sk.items : []).filter(i => !i.hidden).forEach(i => i.text.split(/[/,]/).forEach(add));
    (sk.category || '').split(/[\s&/,]+/).forEach(add);
  });
  cvQuery().split(/\s+/).forEach(add);
  (cv.projects || []).slice(0, 8).forEach(p => (p.tech || '').split(/[,/]/).forEach(add));
  return [...terms].map(t => {
    const esc = t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp((/^\w/.test(t) ? '\\b' : '') + esc + (/\w$/.test(t) ? '\\b' : ''), 'i');
    return { t, re };
  });
}
// 0-100 fit + which skills matched. Title/tag/company hits weigh more than description hits.
function jobFit(job, matchers) {
  if (!matchers.length) return null;
  const strong = ((job.title || '') + ' ' + (job.tags || []).join(' ') + ' ' + (job.company || '')).toLowerCase();
  const weak = (job.description || '').toLowerCase();
  let S = 0, W = 0; const matched = [];
  for (const m of matchers) {
    if (m.re.test(strong)) { S++; matched.push(m.t); }
    else if (m.re.test(weak)) { W++; matched.push(m.t); }
  }
  return { pct: Math.min(100, S * 15 + W * 5), matched: matched.slice(0, 6) };
}

/* ── Prompt builders (pull from stored profile data) ───────────── */
function profileBlurb() {
  const cv = Store.get().cv;
  const skills = cv.skills.map(s => {
    const items = Array.isArray(s.items)
      ? s.items.filter(i => !i.hidden).map(i => i.text).join(', ')
      : String(s.items || '');
    return `${s.category}: ${items}`;
  }).join('; ');
  const projects = cv.projects.slice(0, 6).map(p => `${p.title} (${p.tech})`).join('; ');
  const experience = (cv.experience || []).map(e => `${e.position} @ ${e.company} (${e.period})`).join('; ');
  const certs = (cv.certifications || []).map(c => c.name).join(', ');
  return `Candidate: ${cv.personal.name} — ${cv.personal.title}, ${cv.personal.location}.\n`
    + `Education: ${cv.education.map(e => `${e.degree} @ ${e.school} (${e.years})`).join('; ')}.\n`
    + `Experience: ${experience || '(none listed)'}.\n`
    + `Skills: ${skills}.\n`
    + `Projects: ${projects}.\n`
    + `Certifications: ${certs || '(none listed)'}.\n`
    + `Languages: ${cv.languages.map(l => `${l.language} (${l.level})`).join(', ')} — works ONLY in ${(cv.languages || []).map(l => l.language).filter(Boolean).join(' and ') || 'the languages listed'}; do not assume any other language (e.g. do not suggest French- or German-only roles).\n`
    + `Goal: a junior / entry-level role or internship matching this profile — title: "${cv.personal.title}". `
    + `Target markets are ones that operate in the languages above (e.g. the Gulf, Ireland, the UK, Canada, English-working EU, and remote) — open to relocation / visa sponsorship.`;
}

const Prompts = {
  cvSummary() {
    return `You are an expert tech recruiter (10+ years, international English-speaking market: Gulf, Ireland, UK, Canada, remote).\n`
      + `Write a punchy professional summary for the top of a CV, in ENGLISH.\n`
      + `Rules: 2-3 sentences max · start with the title/level · no "I" · ATS-optimised `
      + `· lead with the strengths most relevant to the candidate's field · mention relevant education · cite 2-3 key skills · end with the career goal.\n\n`
      + `PROFILE:\n${profileBlurb()}\n\n`
      + `Reply with ONLY the summary text, no preamble or quotes.`;
  },

  improve(text, kind = 'CV bullet') {
    return `You are a tech CV expert. Improve this ${kind} for a junior engineering CV.\n`
      + `Rules: start with a strong action verb (Built, Designed, Implemented, Automated, Secured, Configured…) `
      + `· quantify where possible · stay 100% truthful · English · 1-2 lines max.\n\n`
      + `Original text: "${text}"\n\n`
      + `Reply with ONLY the improved text, no preamble.`;
  },

  improveDesc(pos, company, period, desc) {
    return `You are a tech recruiter. Rewrite this internship/experience description `
      + `as 3-5 punchy CV bullet points (action verb + impact + technology).\n`
      + `Position: ${pos} @ ${company} (${period})\n`
      + `Current description:\n${desc}\n\n`
      + `CONTEXT PROFILE: ${profileBlurb()}\n\n`
      + `Reply with ONLY the bullets (one per line, no dash or numbering), in English.`;
  },

  cvAudit() {
    const cv = Store.get().cv;
    const sections = {
      summary: cv.summary,
      experience: (cv.experience||[]).map(e=>`${e.position}@${e.company}: ${e.description}`).join('\n'),
      education: (cv.education||[]).map(e=>`${e.degree} @ ${e.school} ${e.years}: ${e.description}`).join('\n'),
      skills: (cv.skills||[]).map(s=>`${s.category}: ${Array.isArray(s.items)?s.items.filter(i=>!i.hidden).map(i=>i.text).join(', '):s.items}`).join('\n'),
      projects: (cv.projects||[]).map(p=>`[${p.year}] ${p.title} (${p.tech}): ${p.description}`).join('\n'),
      certifications: (cv.certifications||[]).map(c=>`${c.name} — ${c.issuer} ${c.year}`).join('\n'),
      achievements: (cv.achievements||[]).map(a=>a.text).join('\n'),
    };
    return `You are a senior tech recruiter (international English-speaking market) and career coach.\n`
      + `Do a full, critical audit of this CV for junior roles matching the candidate's profile, abroad.\n\n`
      + `=== FULL CV ===\n`
      + Object.entries(sections).map(([k,v])=>`[${k.toUpperCase()}]\n${v||'(empty)'}`).join('\n\n')
      + `\n\n=== TASK ===\n`
      + `1. CRITICAL ISSUES: list factual errors, inconsistencies, weak or exaggerated wording (max 5, be direct).\n`
      + `2. WEAK SECTIONS: score each section from 1 to 5 with a one-sentence reason.\n`
      + `3. MISSING SKILLS: skills relevant to the candidate's field for the 2025 market that are absent from the profile.\n`
      + `4. QUICK WINS: 3 concrete improvements doable right now.\n`
      + `5. OVERALL VERDICT: is the CV ready to send? What must absolutely be fixed first?\n\n`
      + `Be direct, precise and honest. In English.`;
  },

  cvRewrite(section, content) {
    return `You are a tech CV expert (international English-speaking market). Rewrite this "${section}" section of a junior tech CV.\n`
      + `Rules: action verbs · concise · results-oriented · truthful · ENGLISH (never French).\n\n`
      + `CONTEXT PROFILE:\n${profileBlurb()}\n\n`
      + `CURRENT CONTENT:\n${content}\n\n`
      + `Reply with ONLY the rewritten content, ready to paste.`;
  },

  coverLetter(company, position, jd) {
    return `You are an expert recruiter and professional writer (international English-speaking market: Gulf, Ireland, UK, Canada, remote).\n`
      + `Write a cover letter in ENGLISH for an internship or junior role in the candidate's field (see profile).\n`
      + `Format: 4 paragraphs · 280-350 words · name "${company || 'the company'}" explicitly `
      + `· problem-solution angle · sincere, no empty formulas · no "I am writing to apply for…" clichés.\n\n`
      + `Company: ${company || '[not specified]'}\nRole: ${position || 'Junior Network / Security role'}\n`
      + (jd ? `Job posting:\n${jd.slice(0,1200)}\n` : '')
      + `\nCandidate profile:\n${profileBlurb()}\n\n`
      + `Reply with ONLY the 4 paragraphs, separated by a blank line. No header, no closing signature.`;
  },

  atsSuggest(missing) {
    return `Job keywords missing from the CV: ${missing.join(', ')}.\n\n`
      + `Profile:\n${profileBlurb()}\n\n`
      + `For each keyword that GENUINELY matches the profile, suggest in one concrete line how to integrate it `
      + `(which section, which example). Invent nothing. Ignore unrelated keywords.\n`
      + `Format: "• [keyword] → [where and how]". In English.`;
  },

  adaptPackage(company, position, jd, missing = []) {
    const gaps = (missing || []).map(k => k.word || k).filter(Boolean).slice(0, 12);
    return `You are a senior tech recruiter and career advisor for the international ENGLISH-speaking market `
      + `(Ireland, UK, Canada, the Gulf, English-working EU companies, and remote).\n`
      + `Tailor this candidate's application for the job below. The candidate (title: "${candidateRole()}" — see the profile) `
      + `is seeking an internship or junior role. Be specific and ATS-friendly, lead with the candidate's REAL strengths most `
      + `relevant to THIS job (drawn from the profile + the JD), and stay strictly truthful — never invent experience they lack.\n\n`
      + `CANDIDATE PROFILE:\n${profileBlurb()}\n\n`
      + `TARGET: ${company || '[company]'} — ${position || '[role]'}\n\nJOB DESCRIPTION:\n${(jd||'').slice(0,1500)}\n\n`
      + (gaps.length ? `JOB KEYWORDS MISSING FROM THE CV: ${gaps.join(', ')}\n\n` : '')
      + `Return ONLY a valid JSON object with exactly these keys (no markdown, no explanation):\n`
      + `{ "summary": "tailored 2-3 sentence ATS-optimised CV summary, IN ENGLISH, leading with the strengths most relevant to this job and citing specific tech from the JD", `
      + `"coverLetter": "complete cover letter IN ENGLISH, 3-4 short paragraphs (200-300 words), cites the company by name, problem-solution angle, confident but sincere, no header/date/signature/closing formula", `
      + `"positioning": "2-4 short lines (each starting with '• ', separated by \\n) on how to position for THIS role: which real strengths to emphasise, and how to honestly handle the most important missing keyword(s) — advise 'mention if true' or 'learn before the interview' rather than faking it" }`;
  },

  followUp(app) {
    return `Write a professional follow-up email in ENGLISH.\n`
      + `Company: ${app.company} | Role: ${app.position || 'the role'} | Applied on: ${app.date}\n`
      + `Profile: ${profileBlurb()}\n\n`
      + `Format: "Subject: ..." on the first line, then the body (3-4 sentences max, warm and direct).\n`
      + `Reply with ONLY the complete email.`;
  },

  interviewPrep(app) {
    return `You are an interview coach WITH LIVE WEB ACCESS. Search the web for "${app.company}" — its products/services, tech stack, recent news, and this kind of role — then tailor the prep to what you actually find.\n\n`
      + `Generate 8 likely interview questions for "${app.position || candidateRole()}" at "${app.company}", reflecting the company's real focus where you found it.\n`
      + `For each question: a short answer outline (2-3 sentences) grounded PRECISELY in the candidate's real projects and skills from the profile.\n\n`
      + `Profile:\n${profileBlurb()}\n\n`
      + `If you found notable company facts (tech, news, scale), weave them in and cite the source URL. If the company can't be found, say so and give strong generic questions for this candidate's field instead.\n`
      + `Format: numbered list · question in bold · answer outline below. In English.`;
  },

  jobStrategy() {
    return `You are a senior tech career advisor WITH LIVE WEB ACCESS. Use web search to ground every recommendation in real, current (2026) data — do not rely on memory alone.\n\n`
      + `First, search for junior/entry-level openings matching this candidate's profile (title: "${candidateRole()}") and the companies hiring for them in this candidate's target markets. Then build a concrete 30-day job-search strategy.\n\n`
      + `Profile:\n${profileBlurb()}\n\n`
      + `Target markets: the Gulf (UAE, Saudi, Qatar — the candidate speaks Arabic AND English), Ireland, the UK, Canada, `
      + `English-working EU companies, and remote. The candidate does NOT speak French or German — exclude French/German-only markets or boards.\n\n`
      + `Deliver:\n`
      + `1. Top 5 platforms/boards with the most live listings for this candidate's field right now (why + how to use each)\n`
      + `2. 8 REAL companies currently hiring for this candidate's field across their target markets — name each and, where you can, link a specific current opening (with the source URL)\n`
      + `3. Skills & certs to emphasise, verified against what today's job ads in the candidate's field actually ask for\n`
      + `4. Week-by-week plan (W1 … W4)\n`
      + `5. 3 common mistakes to avoid for international / relocation applications\n\n`
      + `Cite a source URL for every specific opening or "currently hiring" claim. Be concrete, current and honest — if you cannot verify something, say so. In English.`;
  },

  matchJobs(jobs) {
    const list = jobs.map((j, i) =>
      `[${i}] ${j.title} @ ${j.company} (${j.location || ''}) — ${(j.tags || []).join(', ')}\n`
      + (j.description || '').replace(/\s+/g, ' ').slice(0, 220)
    ).join('\n\n');
    return `You are a tech career advisor. Below is a candidate profile and a numbered list of job postings.\n`
      + `Pick and rank the jobs that genuinely fit THIS candidate — match the skills/stack in their profile, and favour internship / junior / entry-level over senior roles.\n\n`
      + `CANDIDATE:\n${profileBlurb()}\n\n`
      + `JOBS:\n${list}\n\n`
      + `Return ONLY a JSON array (no markdown, no prose), best match first, at most 12 items, each:\n`
      + `{"i": <job number>, "score": <fit 0-100>, "reason": "<why it fits, in English, max 12 words>"}\n`
      + `Only include jobs that truly fit (score >= 50). Output nothing except the JSON array.`;
  },

  // Short, plain-text "read the market" summary over the jobs currently loaded in the Radar.
  marketRead(jobs) {
    const list = jobs.map((j, i) =>
      `${i + 1}. ${j.title} — ${j.company}${j.location ? ' (' + j.location + ')' : ''}`
      + (j.tags && j.tags.length ? ` [${j.tags.slice(0, 6).join(', ')}]` : '')
    ).join('\n');
    return `${profileBlurb()}\n\n`
      + `Here are ${jobs.length} live job postings from a search for "${_radar.query}":\n${list}\n\n`
      + `Give me a SHORT market read (max ~120 words, plain text, no markdown headings) for someone with MY profile:\n`
      + `- the 3-4 skills or tools these roles most commonly require;\n`
      + `- how well my current profile fits, and the single biggest gap to close;\n`
      + `- one concrete next step (a skill to learn, a cert, or a way to position my CV).\n`
      + `Be specific to THESE postings and honest. Write in ${_lang === 'fr' ? 'French' : 'English'}.`;
  },

  profileEnrich() {
    return `You are a tech recruiting expert (2025). Analyse this profile and give precise recommendations.\n\n`
      + `Current profile:\n${profileBlurb()}\n`
      + `Tags: ${Store.get().tags.map(t=>`@${t.key}="${t.value}"`).join(', ')}\n\n`
      + `Reply with ONLY this valid JSON:\n`
      + `{ "missing": ["important skills/certifications missing for this candidate's field in 2025"], `
      + `"suggestions": ["concrete, prioritised actions to take now"], `
      + `"newTags": [{"key":"...", "label":"...", "value":"..."}] }\n`
      + `No text outside the JSON.`;
  },
};

function applyTheme(t) {
  document.documentElement.setAttribute('data-theme', t || 'light');
  const btn = document.getElementById('btn-theme');
  if (btn) btn.textContent = t === 'dark' ? '☀' : '🌙';
}

/* ── Tag Engine ────────────────────────────────────────────────── */
const TagEngine = (() => {
  let popup, listEl, queryEl, hintEl;
  let _active = null;   // active contenteditable el
  let _query  = '';     // text after @
  let _items  = [];     // filtered tags
  let _sel    = -1;     // highlighted index

  function init() {
    popup   = document.getElementById('tag-popup');
    listEl  = document.getElementById('tag-popup-list');
    queryEl = document.getElementById('tag-query-display');
    hintEl  = document.getElementById('tag-hint');

    document.addEventListener('keydown', _onKeydown);
    document.addEventListener('click', (e) => {
      if (!popup.contains(e.target)) hide();
    });
  }

  function attachEl(el) {
    el.addEventListener('input', _onInput);
  }

  function _onInput(e) {
    _active = e.target;
    const text = _textBefore(_active);
    const m = text.match(/@([\w]*)$/);
    if (m) {
      _query = m[1];
      _show();
    } else {
      hide();
    }
  }

  function _onKeydown(e) {
    if (!popup.classList.contains('open')) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); _move(1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); _move(-1); }
    else if (e.key === 'Enter') { e.preventDefault(); if (_sel >= 0) _insert(_items[_sel]); }
    else if (e.key === 'Escape') hide();
  }

  function _show() {
    const tags = Store.get().tags;
    const q = _query.toLowerCase();
    _items = tags.filter(t =>
      !q || t.key.startsWith(q) || t.label.toLowerCase().includes(q) || t.value.toLowerCase().includes(q)
    ).slice(0, 12);

    if (!_items.length) { hide(); return; }

    queryEl.textContent = _query;
    _sel = _items.length ? 0 : -1;
    _render();
    _position();
    popup.classList.add('open');
  }

  function hide() {
    popup.classList.remove('open');
    _active = null; _query = ''; _sel = -1; _items = [];
  }

  function _move(dir) {
    _sel = Math.max(0, Math.min(_items.length - 1, _sel + dir));
    _render();
  }

  function _render() {
    listEl.innerHTML = _items.map((t, i) => `
      <div class="tag-item${i === _sel ? ' hi' : ''}" data-i="${i}">
        <span class="tag-item-key">@${esc(t.key)}</span>
        <span class="tag-item-lbl">${esc(t.label)}</span>
        <span class="tag-item-val">${esc(t.value)}</span>
      </div>`).join('');

    listEl.querySelectorAll('.tag-item').forEach(el => {
      el.addEventListener('mousedown', (e) => { e.preventDefault(); _insert(_items[+el.dataset.i]); });
      el.addEventListener('mouseenter', () => { _sel = +el.dataset.i; _render(); });
    });

    // scroll selected into view
    const hi = listEl.querySelector('.hi');
    if (hi) hi.scrollIntoView({ block: 'nearest' });
  }

  function _insert(tag) {
    if (!_active) { hide(); return; }
    _active.focus();
    const sel = window.getSelection();
    if (!sel.rangeCount) { hide(); return; }

    const range = sel.getRangeAt(0);
    // Replace @query with tag value
    const before = _textBefore(_active);
    const m = before.match(/@([\w]*)$/);
    const len = m ? m[0].length : 0;

    if (len > 0) {
      const node = range.startContainer;
      const start = Math.max(0, range.startOffset - len);
      const newRange = document.createRange();
      newRange.setStart(node, start);
      newRange.setEnd(node, range.startOffset);
      newRange.deleteContents();
      const text = document.createTextNode(tag.value);
      newRange.insertNode(text);
      const after = document.createRange();
      after.setStartAfter(text); after.collapse(true);
      sel.removeAllRanges(); sel.addRange(after);
    }

    // trigger save if letter editor
    _active.dispatchEvent(new Event('change', { bubbles: true }));
    hide();
  }

  function _position() {
    const sel = window.getSelection();
    if (!sel.rangeCount) return;
    const r = sel.getRangeAt(0).getBoundingClientRect();
    const pw = popup.offsetWidth || 320;
    let left = r.left + window.scrollX;
    let top  = r.bottom + window.scrollY + 6;
    if (left + pw > window.innerWidth - 12) left = window.innerWidth - pw - 12;
    popup.style.left = left + 'px';
    popup.style.top  = top  + 'px';
  }

  function _textBefore(el) {
    const sel = window.getSelection();
    if (!sel.rangeCount) return '';
    const range = sel.getRangeAt(0).cloneRange();
    range.selectNodeContents(el);
    range.setEnd(sel.anchorNode, sel.anchorOffset);
    return range.toString();
  }

  return { init, attachEl, hide };
})();

/* ── Router ────────────────────────────────────────────────────── */
const Router = (() => {
  const routes = {};

  function register(name, fn) { routes[name] = fn; }

  function go(hash) { location.hash = hash; }

  function dispatch() {
    const hash = location.hash.replace('#', '') || 'home';
    const [view, param] = hash.split('/');

    // Update active nav
    document.querySelectorAll('.nav-link').forEach(a => {
      a.classList.toggle('active', a.dataset.route === view);
    });

    const fn = routes[view];
    if (fn) fn(param);
    else routes['home']();
  }

  function init() {
    window.addEventListener('hashchange', dispatch);
    dispatch();
  }

  function refresh() { dispatch(); }   // re-render the current view (e.g. after a language switch)

  return { register, go, init, refresh };
})();

/* ── Render helpers ────────────────────────────────────────────── */
function setView(html) {
  document.getElementById('view').innerHTML = html;
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Home / Dashboard
   ════════════════════════════════════════════════════════════════ */
function viewHome() {
  const d = Store.get();
  const lettersCount = d.letters.length;
  const apps         = d.applications;
  const appsCount    = apps.length;
  const cs           = completenessScore();
  const recentApps   = apps.slice(-4).reverse();
  const csColor = cs.pct >= 80 ? '#27ae60' : cs.pct >= 60 ? '#f0a500' : '#e74c3c';
  const byStatus = {};
  APP_STATUSES.forEach(s => { byStatus[s.key] = apps.filter(a => a.status === s.key).length; });
  const today = todayISO();
  const overdue = apps.filter(a => a.followUpDate && a.followUpDate < today && !['offer','rejected'].includes(a.status));
  // ── Today command center ──
  const due = apps.filter(a => a.followUpDate && a.followUpDate <= today && !['offer','rejected'].includes(a.status));
  const wishlist = byStatus['wishlist'] || 0;
  const newMatches = (d.radar && d.radar.newCount) || 0;
  const savedCount = (d.radar && d.radar.saved && d.radar.saved.length) || 0;
  const todayActions = [];
  if (newMatches)   todayActions.push({ icon: '🛰️', label: `${t('today.actCheck')} (${newMatches})`, go: '#radar' });
  if (due.length)   todayActions.push({ icon: '📨', label: `${t('today.actFollow')}: ${esc(due[0].company)}`, go: '#tracker' });
  if (wishlist)     todayActions.push({ icon: '📤', label: `${t('today.actApply')} (${wishlist})`, go: '#tracker' });
  if (cs.pct < 80)  todayActions.push({ icon: '✅', label: `${t('today.actCv')} (${cs.pct}%)`, go: '#cv' });
  if (!savedCount)  todayActions.push({ icon: '⭐', label: t('today.actSave'), go: '#radar' });
  if (!todayActions.length) todayActions.push({ icon: '🔍', label: t('today.actSearch'), go: '#radar' });
  const todayDate = new Date().toLocaleDateString(_lang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  setView(`
    <div class="ph">
      <div class="ph-left">
        <div class="ph-title">${t('home.greeting')}, ${esc(d.cv.personal.name)}</div>
        <div class="ph-sub">${t('home.sub')}</div>
      </div>
      <div class="ph-right">
        <button class="btn btn-ai" id="home-ai-strategy">${t('home.aiStrategy')}</button>
        <button class="btn btn-accent" onclick="Router.go('#apply')">${t('home.quickApply')}</button>
      </div>
    </div>
    <div class="pc">
      <div class="today-card">
        <div class="today-head">
          <div class="today-title">☀️ ${t('today.title')}</div>
          <div class="today-date">${esc(todayDate)}</div>
        </div>
        <div class="today-metrics">
          <button class="today-metric" onclick="Router.go('#radar')">
            <span class="tm-val">${newMatches}</span><span class="tm-lbl">${t('today.newMatches')}</span>
          </button>
          <button class="today-metric" onclick="Router.go('#tracker')">
            <span class="tm-val${due.length ? ' tm-alert' : ''}">${due.length}</span><span class="tm-lbl">${t('today.followups')}</span>
          </button>
          <button class="today-metric" onclick="Router.go('#tracker')">
            <span class="tm-val">${wishlist}</span><span class="tm-lbl">${t('today.toApply')}</span>
          </button>
        </div>
        <div class="today-actions">
          ${todayActions.slice(0,4).map(a => `<button class="today-action" onclick="Router.go('${a.go}')">${a.icon} <span>${a.label}</span><span class="ta-arrow">→</span></button>`).join('')}
        </div>
      </div>

      <div class="g4" style="margin-bottom:20px">
        <div class="stat">
          <div class="stat-icon">✅</div>
          <div><div class="stat-val" style="color:${csColor}">${cs.pct}%</div><div class="stat-lbl">${t('home.statCv')}</div></div>
        </div>
        <div class="stat">
          <div class="stat-icon">✉️</div>
          <div><div class="stat-val">${lettersCount}</div><div class="stat-lbl">${lettersCount!==1?t('home.statLettersN'):t('home.statLetters1')}</div></div>
        </div>
        <div class="stat">
          <div class="stat-icon">📌</div>
          <div><div class="stat-val">${appsCount}</div><div class="stat-lbl">${appsCount!==1?t('home.statAppsN'):t('home.statApps1')}</div></div>
        </div>
        <div class="stat">
          <div class="stat-icon">🏷️</div>
          <div><div class="stat-val">${d.tags.length}</div><div class="stat-lbl">${t('home.statTags')}</div></div>
        </div>
      </div>

      <div class="g2" style="margin-bottom:20px">
        <div class="card">
          <div class="card-h"><span>${t('home.cvComplete')} ${cs.done}/${cs.total}</span><button class="btn btn-sm btn-outline" onclick="Router.go('#cv')">${t('home.improve')}</button></div>
          <div class="card-b">
            <div class="progress"><div class="progress-bar" style="width:${cs.pct}%;background:${csColor}"></div></div>
            <div class="checklist">${cs.checks.map(c=>`<div class="check-item ${c.ok?'ok':'no'}">${c.ok?'✅':'⬜'} ${esc(c.label)}</div>`).join('')}</div>
          </div>
        </div>

        <div class="card">
          <div class="card-h"><span>${t('home.pipeline')}</span><button class="btn btn-sm btn-outline" onclick="Router.go('#tracker')">${t('home.seeAll')}</button></div>
          <div class="card-b">
            <div class="funnel-row" style="margin-bottom:14px">
              ${APP_STATUSES.map(s=>`<div class="funnel-item"><div class="funnel-val" style="color:${s.color}">${byStatus[s.key]||0}</div><div class="funnel-lbl">${statusLabel(s.key)}</div></div>`).join('')}
            </div>
            ${recentApps.length ? `<div style="font-size:11px;font-weight:700;color:var(--muted);text-transform:uppercase;margin-bottom:8px">${t('home.recent')}</div>`+recentApps.map(a=>`
              <div class="flex-between" style="padding:6px 0;border-bottom:1px solid var(--border)">
                <div>
                  <span style="font-weight:600;font-size:13px">${esc(a.company)}</span>
                  <span class="text-muted text-sm" style="margin-left:8px">${esc(a.position||'—')}</span>
                </div>
                <span style="font-size:11px;padding:2px 8px;border-radius:20px;background:${APP_STATUSES.find(s=>s.key===a.status)?.color||'#999'}22;color:${APP_STATUSES.find(s=>s.key===a.status)?.color||'#999'}">${statusLabel(a.status)}</span>
              </div>`).join('') : `<div class="empty-state" style="padding:20px 0"><div class="empty-icon">📌</div><p>${t('home.noApps')}<br><button class="btn btn-sm btn-accent" onclick="Router.go('#apply')" style="margin-top:8px">${t('home.applyNow')}</button></p></div>`}
          </div>
        </div>
      </div>

      <div class="g2">
        <div class="card">
          <div class="card-h">${t('home.quickActions')}</div>
          <div class="card-b" style="display:flex;flex-direction:column;gap:10px">
            <button class="btn btn-accent"  onclick="Router.go('#apply')" style="font-size:13px;padding:10px">${t('home.qaApply')}</button>
            <button class="btn btn-primary" onclick="Router.go('#cv')">${t('home.qaCv')}</button>
            <button class="btn btn-outline" onclick="Router.go('#letters')">${t('home.qaLetters')}</button>
            <button class="btn btn-outline" onclick="Router.go('#ats')">${t('home.qaAts')}</button>
            <button class="btn btn-outline" onclick="Router.go('#radar')">${t('home.qaRadar')}</button>
          </div>
        </div>

        <div class="card">
          <div class="card-h"><span>${t('home.howTitle')}</span></div>
          <div class="card-b">
            <div style="display:flex;flex-direction:column;gap:12px;font-size:13px;line-height:1.6">
              <div><strong>1.</strong> ${t('home.step1')}</div>
              <div><strong>2.</strong> ${t('home.step2')}</div>
              <div><strong>3.</strong> ${t('home.step3')}</div>
              <div><strong>4.</strong> ${t('home.step4')}</div>
              <div><strong>5.</strong> ${t('home.step5')}</div>
            </div>
            <hr style="margin:12px 0;border-color:var(--border)">
            <p style="font-size:12px;color:var(--muted)">${t('home.tip')}</p>
          </div>
        </div>
      </div>
    </div>
  `);

  document.getElementById('home-ai-strategy').addEventListener('click', () => {
    AI.assist({ title: t('home.aiStrategy'), prompt: Prompts.jobStrategy(), model: AI.SMART, web: true });
  });
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Profile & Tags
   ════════════════════════════════════════════════════════════════ */
function viewProfile() {
  const d = Store.get();

  setView(`
    <div class="ph">
      <div class="ph-left">
        <div class="ph-title">${t('profile.title')}</div>
        <div class="ph-sub">${t('profile.sub')}</div>
      </div>
      <div class="ph-right">
        <button class="btn btn-ai" id="btn-enrich-profile">${t('profile.enrich')}</button>
        <button class="btn btn-primary" id="btn-save-profile">${t('common.save')}</button>
      </div>
    </div>
    <div class="pc">
      <div class="tabs">
        <button class="tab-btn active" data-tab="profile-tab">${t('profile.tabProfile')}</button>
        <button class="tab-btn" data-tab="tags-tab">${t('profile.tabTags')}</button>
      </div>

      <!-- Profile tab -->
      <div id="profile-tab" class="tab-pane active">
        <div class="card">
          <div class="card-h">${t('profile.personalInfo')}</div>
          <div class="card-b">
            <div class="fr">
              <div class="fg"><label>${t('profile.fullName')}</label><input type="text" id="p-name" value="${esc(d.cv.personal.name)}"></div>
              <div class="fg"><label>${t('common.email')}</label><input type="email" id="p-email" value="${esc(d.cv.personal.email)}"></div>
            </div>
            <div class="fr">
              <div class="fg"><label>${t('profile.titleRole')}</label><input type="text" id="p-title" value="${esc(d.cv.personal.title)}"></div>
              <div class="fg"><label>${t('profile.city')}</label><input type="text" id="p-location" value="${esc(d.cv.personal.location)}"></div>
            </div>
            <div class="fr3">
              <div class="fg"><label>${t('profile.phone')}</label><input type="tel" id="p-phone" value="${esc(d.cv.personal.phone)}"></div>
              <div class="fg"><label>LinkedIn</label><input type="text" id="p-linkedin" value="${esc(d.cv.personal.linkedin)}"></div>
              <div class="fg"><label>GitHub</label><input type="text" id="p-github" value="${esc(d.cv.personal.github)}"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tags tab -->
      <div id="tags-tab" class="tab-pane">
        <div class="card">
          <div class="card-h">
            <span>${t('profile.tagLibrary')} <span class="badge">${d.tags.length}</span></span>
            <button class="btn btn-sm btn-primary" id="btn-add-tag">${t('profile.newTag')}</button>
          </div>
          <div class="card-b" style="padding:0">
            <table class="tags-tbl">
              <thead><tr><th>${t('profile.thKey')}</th><th>${t('profile.thLabel')}</th><th>${t('profile.thValue')}</th><th></th></tr></thead>
              <tbody id="tags-tbody">
                ${renderTagsRows(d.tags)}
              </tbody>
            </table>
          </div>
        </div>
        <p class="text-muted text-sm" style="margin-top:10px">${t('profile.tagTip')}</p>
      </div>
    </div>
  `);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(btn.dataset.tab).classList.add('active');
    });
  });

  // Save profile
  document.getElementById('btn-save-profile').addEventListener('click', () => {
    const d = Store.get();
    d.cv.personal.name     = document.getElementById('p-name').value.trim();
    d.cv.personal.email    = document.getElementById('p-email').value.trim();
    d.cv.personal.title    = document.getElementById('p-title').value.trim();
    d.cv.personal.location = document.getElementById('p-location').value.trim();
    d.cv.personal.phone    = document.getElementById('p-phone').value.trim();
    d.cv.personal.linkedin = document.getElementById('p-linkedin').value.trim();
    d.cv.personal.github   = document.getElementById('p-github').value.trim();
    Store.save();
    toast(t('profile.savedToast'));
  });

  // Add tag
  document.getElementById('btn-add-tag').addEventListener('click', () => {
    const d = Store.get();
    d.tags.push({ key: 'newkey', label: t('profile.newTagLabel'), value: t('profile.newTagValue') });
    Store.save();
    document.getElementById('tags-tbody').innerHTML = renderTagsRows(d.tags);
    bindTagsTable();
  });

  bindTagsTable();

  document.getElementById('btn-enrich-profile').addEventListener('click', () => {
    AI.assist({
      title: t('profile.enrichTitle'),
      prompt: Prompts.profileEnrich(),
      model: AI.SMART,
      onApply: async (text) => {
        const json = await AI._parseJSONwithRepair(text);
        if (!json) { toast(t('common.notParsable')); return; }
        if (json.newTags && Array.isArray(json.newTags)) {
          const tags = Store.get().tags;
          let added = 0;
          json.newTags.forEach(nt => {
            if (nt && nt.key && !tags.find(t => t.key === nt.key)) {
              // Normalize: Claude can omit label/value → coerce so the tags table never renders "undefined".
              tags.push({ key: String(nt.key), label: String(nt.label || nt.key), value: String(nt.value || '') });
              added++;
            }
          });
          if (added) {
            Store.save();
            document.getElementById('tags-tbody').innerHTML = renderTagsRows(Store.get().tags);
            bindTagsTable();
          }
          toast(`✅ ${added} ${t('profile.tagsAddedSuffix')}`);   // report what was ACTUALLY added, not what Claude returned
        }
      },
    });
  });
}

function renderTagsRows(tags) {
  return tags.map((t, i) => `
    <tr>
      <td class="td-key">@<input class="td-inline" data-i="${i}" data-f="key"   value="${esc(t.key)}"   style="width:90px;color:var(--primary);font-family:monospace"></td>
      <td><input class="td-inline" data-i="${i}" data-f="label" value="${esc(t.label)}"></td>
      <td><input class="td-inline" data-i="${i}" data-f="value" value="${esc(t.value)}" style="width:100%"></td>
      <td><button class="btn btn-xs btn-ghost" data-del="${i}">✕</button></td>
    </tr>`).join('');
}

function bindTagsTable() {
  document.querySelectorAll('.td-inline').forEach(inp => {
    inp.addEventListener('change', () => {
      const d = Store.get();
      const i = +inp.dataset.i;
      d.tags[i][inp.dataset.f] = inp.value.trim().replace(/\s/g, '_').toLowerCase() === inp.dataset.f && inp.dataset.f === 'key'
        ? inp.value.trim().replace(/\s+/g,'_').toLowerCase()
        : inp.value;
      if (inp.dataset.f === 'key') {
        d.tags[i].key = inp.value.trim().replace(/[\s@]/g,'_').toLowerCase();
        inp.value = d.tags[i].key;
      }
      Store.save();
    });
  });

  document.querySelectorAll('[data-del]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = Store.get();
      d.tags.splice(+btn.dataset.del, 1);
      Store.save();
      document.getElementById('tags-tbody').innerHTML = renderTagsRows(d.tags);
      bindTagsTable();
      toast(t('profile.tagDeleted'));
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   VIEW: CV Builder
   ════════════════════════════════════════════════════════════════ */
/* ── CV section health (g=good, w=warn, b=bad) ──────────────────── */
function cvSectionHealth(id, cv) {
  switch (id) {
    case 'personal': {
      const p = cv.personal;
      const n = [p.name, p.email, p.phone, p.linkedin].filter(Boolean).length;
      return n >= 4 ? 'g' : n >= 2 ? 'w' : 'b';
    }
    case 'summary':        return (cv.summary||'').length >= 40 ? 'g' : (cv.summary||'').length > 0 ? 'w' : 'b';
    case 'experience':     return (cv.experience||[]).length >= 1 ? 'g' : 'w';
    case 'education':      return cv.education?.length >= 1 && cv.education[0]?.degree ? 'g' : 'w';
    case 'skills':         return cv.skills?.length >= 3 ? 'g' : cv.skills?.length >= 1 ? 'w' : 'b';
    case 'projects':       return cv.projects?.length >= 2 && cv.projects.every(p=>p.description) ? 'g' : cv.projects?.length >= 1 ? 'w' : 'b';
    case 'languages':      return cv.languages?.length >= 2 ? 'g' : cv.languages?.length >= 1 ? 'w' : 'b';
    case 'certifications': return (cv.certifications||[]).length >= 1 ? 'g' : 'w';
    case 'achievements':   return (cv.achievements||[]).length >= 1 ? 'g' : 'w';
    case 'interests':      return (cv.interests||'').length > 10 ? 'g' : 'w';
    default: return 'g';
  }
}

/* ── Silent auto-save current section inputs → Store ────────────── */
function commitSectionToStore(section) {
  const cv = Store.get().cv;
  const g  = id => document.getElementById(id)?.value ?? null;
  if (section === 'personal') {
    ['name','ptitle','location','email','phone','linkedin','github'].forEach(k => {
      const v = g(`cv-${k}`); if (v !== null) cv.personal[k === 'ptitle' ? 'title' : k] = v;
    });
  }
  if (section === 'summary'   && g('cv-summary')   !== null) cv.summary   = g('cv-summary');
  if (section === 'interests' && g('cv-interests') !== null) cv.interests = g('cv-interests');
  // skills: chips are stored directly; only category field lives in DOM
  if (section === 'skills') {
    document.querySelectorAll('[data-sk-cat]').forEach(inp => {
      const s = cv.skills?.find(x => x.id === inp.dataset.skCat);
      if (s) s.category = inp.value;
    });
    Store.save();
    document.querySelectorAll('.cv-sec-tab[data-sec]').forEach(tab => {
      const dot = tab.querySelector('.health-dot');
      if (dot) dot.className = `health-dot health-${cvSectionHealth(tab.dataset.sec, Store.get().cv)}`;
    });
    return;
  }
  const maps = {
    experience:     ['data-exp',  'experience'],
    education:      ['data-edu',  'education'],
    projects:       ['data-pr',   'projects'],
    languages:      ['data-lang', 'languages'],
    certifications: ['data-cert', 'certifications'],
    achievements:   ['data-ach',  'achievements'],
  };
  const [attr, key] = maps[section] || [];
  if (attr) {
    document.querySelectorAll(`[${attr}]`).forEach(inp => {
      const item = cv[key]?.find(x => x.id === inp.getAttribute(attr));
      if (item && inp.dataset.f) item[inp.dataset.f] = inp.value;
    });
  }
  Store.save();
  // refresh health dots live
  document.querySelectorAll('.cv-sec-tab[data-sec]').forEach(tab => {
    const dot = tab.querySelector('.health-dot');
    if (dot) dot.className = `health-dot health-${cvSectionHealth(tab.dataset.sec, Store.get().cv)}`;
  });
}

const CV_SECTIONS = [
  { id: 'personal',       labelKey: 'cv.sec.personal' },
  { id: 'summary',        labelKey: 'cv.sec.summary' },
  { id: 'experience',     labelKey: 'cv.sec.experience' },
  { id: 'education',      labelKey: 'cv.sec.education' },
  { id: 'skills',         labelKey: 'cv.sec.skills' },
  { id: 'projects',       labelKey: 'cv.sec.projects' },
  { id: 'certifications', labelKey: 'cv.sec.certifications' },
  { id: 'achievements',  labelKey: 'cv.sec.achievements' },
  { id: 'languages',      labelKey: 'cv.sec.languages' },
  { id: 'interests',      labelKey: 'cv.sec.interests' },
  { id: 'theme',          labelKey: 'cv.sec.theme' },
];

let _cvSection = 'personal';

function viewCV() {
  const d = Store.get();

  setView(`
    <div class="ph">
      <div class="ph-left">
        <div class="ph-title">${t('cv.title')}</div>
        <div class="ph-sub">${t('cv.sub')}</div>
      </div>
      <div class="ph-right">
        <button class="btn btn-ai" id="btn-cv-audit" title="${t('cv.auditTitle')}">${t('cv.auditBtn')}</button>
        <button class="btn btn-outline" id="btn-export-ats" title="${t('cv.atsExportTitle')}">${t('cv.atsExport')}</button>
        <button class="btn btn-accent" id="btn-export-cv">${t('cv.exportPdf')}</button>
      </div>
    </div>
    <div id="cv-layout">
      <div id="cv-sections-panel">
        ${CV_SECTIONS.map(s => {
          const hidden = d.cv.hidden.includes(s.id);
          const noToggle = (s.id === 'personal' || s.id === 'theme');
          const health = noToggle ? null : cvSectionHealth(s.id, d.cv);
          return `<div class="cv-sec-tab${_cvSection===s.id?' active':''}${hidden?' hidden-sec':''}" data-sec="${s.id}"${noToggle ? '' : ' draggable="true"'}>
            ${noToggle ? '' : `<span class="sec-drag-handle" title="${t('cv.dragReorder')}">⠿</span>`}
            <span class="sec-label">${t(s.labelKey)}</span>
            ${health ? `<span class="health-dot health-${health}"></span>` : ''}
            ${noToggle ? '' : `<button class="vis-toggle" title="${hidden?t('cv.showInCv'):t('cv.hideFromCv')}" data-vis="${s.id}">${hidden?'🚫':'👁'}</button>`}
          </div>`;
        }).join('')}
      </div>
      <div id="cv-editor-panel">
        <div id="cv-section-editor"></div>
      </div>
      <div id="cv-preview-panel">
        <div id="cv-doc-preview" class="cv-doc" style="transform-origin:top center;transform:scale(.72);margin-bottom:-28%">
          ${renderCVDoc(d.cv)}
        </div>
      </div>
    </div>
  `);

  renderCVEditor(_cvSection);

  // Section tabs
  document.querySelectorAll('.cv-sec-tab').forEach(tab => {
    tab.addEventListener('click', (e) => {
      if (e.target.classList.contains('vis-toggle')) return;
      _cvSection = tab.dataset.sec;
      document.querySelectorAll('.cv-sec-tab').forEach(t => t.classList.toggle('active', t.dataset.sec === _cvSection));
      renderCVEditor(_cvSection);
    });
  });

  // Visibility toggles
  document.querySelectorAll('[data-vis]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const d = Store.get();
      const id = btn.dataset.vis;
      const idx = d.cv.hidden.indexOf(id);
      if (idx > -1) d.cv.hidden.splice(idx, 1);
      else d.cv.hidden.push(id);
      Store.save();
      refreshCVPreview();
    });
  });

  document.getElementById('btn-export-cv').addEventListener('click', Export.cv);
  document.getElementById('btn-export-ats').addEventListener('click', Export.cvATS);
  document.getElementById('btn-cv-audit')?.addEventListener('click', () => {
    AI.assist({ title: t('cv.aiAuditTitle'), prompt: Prompts.cvAudit(), model: AI.MAX });
  });

  // Visibility toggle should refresh the section panel too (icon state)
  document.querySelectorAll('[data-vis]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.closest('.cv-sec-tab');
      const hidden = Store.get().cv.hidden.includes(btn.dataset.vis);
      tab.classList.toggle('hidden-sec', hidden);
      btn.textContent = hidden ? '🚫' : '👁';
    });
  });

  applyCVThemeVars();
  initSectionDrag();
}

function initSectionDrag() {
  const panel = document.getElementById('cv-sections-panel');
  if (!panel) return;
  let dragEl = null;
  panel.querySelectorAll('.cv-sec-tab[draggable]').forEach(el => {
    el.addEventListener('dragstart', e => {
      dragEl = el; e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => el.classList.add('is-dragging'), 0);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('is-dragging');
      panel.querySelectorAll('.cv-sec-tab').forEach(t => t.classList.remove('drag-over'));
      Store.get().cv.order = [...panel.querySelectorAll('.cv-sec-tab[draggable]')].map(t => t.dataset.sec);
      Store.save(); refreshCVPreview();
      dragEl = null;
    });
  });
  panel.querySelectorAll('.cv-sec-tab').forEach(el => {
    el.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragEl || dragEl === el || !el.draggable) return;
      el.classList.add('drag-over');
      const r = el.getBoundingClientRect();
      e.clientY < r.top + r.height / 2
        ? panel.insertBefore(dragEl, el)
        : panel.insertBefore(dragEl, el.nextSibling);
    });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drag-over'); });
  });
}

function initEntryDrag(container, arrayKey) {
  if (!container) return;
  let dragEl = null;
  container.querySelectorAll('.entry[draggable]').forEach(el => {
    el.addEventListener('dragstart', e => {
      dragEl = el; e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => el.classList.add('is-dragging'), 0);
    });
    el.addEventListener('dragend', () => {
      el.classList.remove('is-dragging');
      container.querySelectorAll('.entry').forEach(t => t.classList.remove('drag-over'));
      const ids = [...container.querySelectorAll('.entry[data-entry-id]')].map(t => t.dataset.entryId);
      const d = Store.get();
      d.cv[arrayKey] = ids.map(id => d.cv[arrayKey].find(x => x.id === id)).filter(Boolean);
      Store.save(); refreshCVPreview();
      dragEl = null;
    });
    el.addEventListener('dragover', e => {
      e.preventDefault();
      if (!dragEl || dragEl === el) return;
      el.classList.add('drag-over');
      const r = el.getBoundingClientRect();
      e.clientY < r.top + r.height / 2
        ? container.insertBefore(dragEl, el)
        : container.insertBefore(dragEl, el.nextSibling);
    });
    el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
    el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('drag-over'); });
  });
  container.querySelectorAll('.entry-toggle').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      btn.closest('.entry').classList.toggle('collapsed');
    });
  });
  container.querySelectorAll('[data-dup]').forEach(btn => {
    btn.addEventListener('click', () => {
      const d = Store.get();
      const arr = d.cv[arrayKey];
      const orig = arr.find(x => x.id === btn.dataset.dup);
      if (!orig) return;
      const copy = JSON.parse(JSON.stringify(orig));
      copy.id = uid();
      if (Array.isArray(copy.items)) copy.items = copy.items.map(i => ({ ...i, id: uid() }));
      arr.splice(arr.indexOf(orig) + 1, 0, copy);
      Store.save(); renderCVEditor(_cvSection);
    });
  });
}

function renderCVEditor(section) {
  const d = Store.get();
  const cv = d.cv;
  const el = document.getElementById('cv-section-editor');
  if (!el) return;
  const hiddenE = cv.hiddenEntries || [];
  const hideBtn = (id) => `<button class="entry-hide-btn${hiddenE.includes(id)?' is-hidden':''}" data-hide-entry="${id}" title="${hiddenE.includes(id)?t('cv.showInCv'):t('cv.hideFromCv')}">${hiddenE.includes(id)?'🚫':'👁'}</button>`;
  const entryClass = (id) => `entry${hiddenE.includes(id)?' entry-hidden':''}`;

  let html = '';

  if (section === 'personal') {
    const hasPhoto = !!cv.personal.photo;
    html = `<h3>${t('profile.personalInfo')}</h3>
      <div class="fr" style="align-items:flex-start;gap:20px">
        <div style="flex:1">
          <div class="fg"><label>${t('cv.lblName')}</label><input type="text" id="cv-name" value="${esc(cv.personal.name)}"></div>
          <div class="fg"><label>${t('cv.lblTitle')}</label><input type="text" id="cv-ptitle" value="${esc(cv.personal.title)}"></div>
          <div class="fr">
            <div class="fg"><label>${t('profile.city')}</label><input type="text" id="cv-location" value="${esc(cv.personal.location)}"></div>
            <div class="fg"><label>${t('common.email')}</label><input type="email" id="cv-email" value="${esc(cv.personal.email)}"></div>
          </div>
          <div class="fr">
            <div class="fg"><label>${t('profile.phone')}</label><input type="text" id="cv-phone" value="${esc(cv.personal.phone)}"></div>
            <div class="fg"><label>LinkedIn</label><input type="text" id="cv-linkedin" value="${esc(cv.personal.linkedin)}"></div>
          </div>
          <div class="fg"><label>GitHub</label><input type="text" id="cv-github" value="${esc(cv.personal.github)}"></div>
        </div>
        <div class="photo-upload-box">
          <div class="photo-preview" id="cv-photo-preview">
            ${hasPhoto ? `<img src="${cv.personal.photo}" alt="Photo">` : '<span class="photo-placeholder">📷</span>'}
          </div>
          <label class="btn btn-sm btn-outline" style="cursor:pointer;margin-top:8px;display:block;text-align:center">
            ${hasPhoto ? t('cv.photoChange') : t('cv.photoAdd')}
            <input type="file" id="cv-photo-file" accept="image/*" hidden>
          </label>
          ${hasPhoto ? `<button class="btn btn-sm btn-ghost" id="cv-photo-clear" style="margin-top:4px;width:100%">${t('cv.photoDelete')}</button>` : ''}
          <p class="text-muted" style="font-size:11px;margin-top:6px;text-align:center">${t('cv.photoHint')}</p>
        </div>
      </div>
      <button class="btn btn-primary" id="cv-save-personal">${t('common.save')}</button>`;
  }
  else if (section === 'experience') {
    const exps = cv.experience || [];
    html = `<h3>${t('cv.expTitle')} <button class="btn btn-sm btn-outline" id="cv-add-exp" style="margin-left:8px">${t('common.add')}</button></h3>
      <p class="text-muted text-sm" style="margin-bottom:10px">${t('cv.expHint1')}</p>
      <p class="text-muted text-sm" style="margin-bottom:10px">${t('cv.expHint2')}</p>
      ${exps.map((x, i) => `
        <div class="${entryClass(x.id)}" draggable="true" data-entry-id="${x.id}">
          <div class="entry-head">
            <span class="drag-handle" title="${t('cv.dragReorder')}">⠿</span>
            <span class="entry-title-preview">${esc(x.position || x.company || `${t('cv.fbExperience')} ${i+1}`)}</span>
            <div class="entry-actions">
              <button class="entry-toggle" title="${t('cv.collapse')}">▾</button>
              ${hideBtn(x.id)}
              <button class="btn btn-xs btn-ghost" data-dup="${x.id}" title="${t('cv.duplicate')}">⧉</button>
              <button class="btn btn-xs btn-ghost" data-del-exp="${x.id}">✕</button>
            </div>
          </div>
          <div class="entry-body">
            <div class="fr">
              <div class="fg"><label>${t('cv.lblCompany')}</label><input type="text" data-exp="${x.id}" data-f="company" value="${esc(x.company)}"></div>
              <div class="fg"><label>${t('cv.lblPosition')}</label><input type="text" data-exp="${x.id}" data-f="position" value="${esc(x.position)}"></div>
            </div>
            <div class="fr">
              <div class="fg"><label>${t('cv.lblPeriod')}</label><input type="text" data-exp="${x.id}" data-f="period" value="${esc(x.period)}"></div>
              <div class="fg"><label>${t('cv.lblLocation')}</label><input type="text" data-exp="${x.id}" data-f="location" value="${esc(x.location)}"></div>
            </div>
            <div class="fg"><label>${t('cv.descBulletLbl')}
              <button class="btn btn-xs btn-ai" data-ai-exp="${x.id}" style="margin-left:6px">${t('cv.improve')}</button></label>
              <textarea data-exp="${x.id}" data-f="description" rows="4" placeholder="${t('cv.expDescPh')}">${esc(x.description)}</textarea></div>
          </div>
        </div>`).join('')}
      <button class="btn btn-primary" id="cv-save-exp">${t('common.save')}</button>`;
  }
  else if (section === 'education') {
    html = `<h3>${t('cv.eduTitle')} <button class="btn btn-sm btn-outline" id="cv-add-edu" style="margin-left:8px">${t('common.add')}</button></h3>
      ${cv.education.map((e, i) => `
        <div class="${entryClass(e.id)}" draggable="true" data-entry-id="${e.id}">
          <div class="entry-head">
            <span class="drag-handle" title="${t('cv.dragReorder')}">⠿</span>
            <span class="entry-title-preview">${esc(e.degree || `${t('cv.fbEducation')} ${i+1}`)}</span>
            <div class="entry-actions">
              <button class="entry-toggle" title="${t('cv.collapse')}">▾</button>
              ${hideBtn(e.id)}
              <button class="btn btn-xs btn-ghost" data-dup="${e.id}" title="${t('cv.duplicate')}">⧉</button>
              <button class="btn btn-xs btn-ghost" data-del-edu="${e.id}">✕</button>
            </div>
          </div>
          <div class="entry-body">
            <div class="fr">
              <div class="fg"><label>${t('cv.lblDegree')}</label><input type="text" data-edu="${e.id}" data-f="degree" value="${esc(e.degree)}"></div>
              <div class="fg"><label>${t('cv.lblSchool')}</label><input type="text" data-edu="${e.id}" data-f="school" value="${esc(e.school)}"></div>
            </div>
            <div class="fr">
              <div class="fg"><label>${t('cv.lblLocation')}</label><input type="text" data-edu="${e.id}" data-f="location" value="${esc(e.location)}"></div>
              <div class="fg"><label>${t('cv.lblYears')}</label><input type="text" data-edu="${e.id}" data-f="years" value="${esc(e.years)}"></div>
            </div>
            <div class="fg"><label>${t('cv.lblDescription')}</label><textarea data-edu="${e.id}" data-f="description">${esc(e.description)}</textarea></div>
          </div>
        </div>`).join('')}
      <button class="btn btn-primary" id="cv-save-edu">${t('common.save')}</button>`;
  }
  else if (section === 'skills') {
    html = `<h3>${t('cv.skillsTitle')} <button class="btn btn-sm btn-outline" id="cv-add-skill" style="margin-left:8px">${t('common.add')}</button></h3>
      <p class="text-muted text-sm" style="margin-bottom:10px">${t('cv.skillsHint')}</p>
      ${cv.skills.map((s, i) => `
        <div class="${entryClass(s.id)}" draggable="true" data-entry-id="${s.id}">
          <div class="entry-head">
            <span class="drag-handle" title="${t('cv.dragReorder')}">⠿</span>
            <span class="entry-title-preview">${esc(s.category || `${t('cv.fbCategory')} ${i+1}`)}</span>
            <div class="entry-actions">
              <button class="entry-toggle" title="${t('cv.collapse')}">▾</button>
              ${hideBtn(s.id)}
              <button class="btn btn-xs btn-ghost" data-dup="${s.id}" title="${t('cv.duplicate')}">⧉</button>
              <button class="btn btn-xs btn-ghost" data-del-sk="${s.id}">✕</button>
            </div>
          </div>
          <div class="entry-body">
            <div class="fg"><label>${t('cv.lblCategory')}</label><input type="text" data-sk-cat="${s.id}" value="${esc(s.category)}"></div>
            <div class="fg"><label>${t('cv.lblSkills')}</label>
              <div class="skill-chips">
                ${(Array.isArray(s.items)?s.items:[]).map(item => `<span class="skill-chip${item.hidden?' chip-hidden':''}" data-chip-id="${item.id}">${esc(item.text)}<button class="chip-vis" data-chip-vis="${item.id}" data-chip-sk="${s.id}" title="${item.hidden?t('cv.show'):t('cv.hide')}">${item.hidden?'🚫':'👁'}</button><button class="chip-del" data-chip-del="${item.id}" data-chip-sk="${s.id}" title="${t('cv.deleteWord')}">✕</button></span>`).join('')}
                <input class="chip-add" type="text" data-chip-add="${s.id}" placeholder="${t('cv.newSkillPh')}">
              </div>
            </div>
          </div>
        </div>`).join('')}
      <button class="btn btn-primary" id="cv-save-skills">${t('common.save')}</button>`;
  }
  else if (section === 'projects') {
    html = `<h3>${t('cv.projTitle')} <button class="btn btn-sm btn-outline" id="cv-add-proj" style="margin-left:8px">${t('common.add')}</button></h3>
      ${cv.projects.map((p, i) => `
        <div class="${entryClass(p.id)}" draggable="true" data-entry-id="${p.id}">
          <div class="entry-head">
            <span class="drag-handle" title="${t('cv.dragReorder')}">⠿</span>
            <span class="entry-title-preview">${esc(p.title || `${t('cv.fbProject')} ${i+1}`)}</span>
            <div class="entry-actions">
              <button class="entry-toggle" title="${t('cv.collapse')}">▾</button>
              ${hideBtn(p.id)}
              <button class="btn btn-xs btn-ghost" data-dup="${p.id}" title="${t('cv.duplicate')}">⧉</button>
              <button class="btn btn-xs btn-ghost" data-del-pr="${p.id}">✕</button>
            </div>
          </div>
          <div class="entry-body">
            <div class="fr">
              <div class="fg"><label>${t('cv.lblTitle')}</label><input type="text" data-pr="${p.id}" data-f="title" value="${esc(p.title)}"></div>
              <div class="fg"><label>${t('cv.lblTech')}</label><input type="text" data-pr="${p.id}" data-f="tech" value="${esc(p.tech)}"></div>
            </div>
            <div class="fg"><label>${t('cv.lblYear')}</label><input type="text" data-pr="${p.id}" data-f="year" value="${esc(p.year)}" style="width:120px"></div>
            <div class="fg"><label>${t('cv.lblDescription')}
              <button class="btn btn-xs btn-ai" data-ai-pr="${p.id}" style="margin-left:6px">${t('cv.improve')}</button></label>
              <textarea data-pr="${p.id}" data-f="description">${esc(p.description)}</textarea></div>
          </div>
        </div>`).join('')}
      <button class="btn btn-primary" id="cv-save-projects">${t('common.save')}</button>`;
  }
  else if (section === 'languages') {
    html = `<h3>${t('cv.langTitle')} <button class="btn btn-sm btn-outline" id="cv-add-lang" style="margin-left:8px">${t('common.add')}</button></h3>
      ${cv.languages.map((l, i) => `
        <div class="${entryClass(l.id)}" draggable="true" data-entry-id="${l.id}">
          <div class="entry-head">
            <span class="drag-handle" title="${t('cv.dragReorder')}">⠿</span>
            <span class="entry-title-preview">${esc(l.language || `${t('cv.fbLanguage')} ${i+1}`)}</span>
            <div class="entry-actions">
              <button class="entry-toggle" title="${t('cv.collapse')}">▾</button>
              ${hideBtn(l.id)}
              <button class="btn btn-xs btn-ghost" data-del-lang="${l.id}">✕</button>
            </div>
          </div>
          <div class="entry-body">
            <div class="fr">
              <div class="fg"><label>${t('cv.lblLanguage')}</label><input type="text" data-lang="${l.id}" data-f="language" value="${esc(l.language)}"></div>
              <div class="fg"><label>${t('cv.lblLevel')}</label>
                <select data-lang="${l.id}" data-f="level">
                  ${['Native','Technical & Professional Proficiency','Professional','Intermediate','Basic'].map(v =>
                    `<option${v===l.level?' selected':''}>${v}</option>`).join('')}
                </select>
              </div>
            </div>
          </div>
        </div>`).join('')}
      <button class="btn btn-primary" id="cv-save-lang">${t('common.save')}</button>`;
  }
  else if (section === 'interests') {
    html = `<h3>${t('cv.interestsTitle')}</h3>
      <div class="fg"><label>${t('cv.interestsLbl')}</label>
        <textarea id="cv-interests" rows="4">${esc(cv.interests)}</textarea></div>
      <button class="btn btn-primary" id="cv-save-interests">${t('common.save')}</button>`;
  }
  else if (section === 'summary') {
    html = `<h3>${t('cv.summaryTitle')}
        <button class="btn btn-sm btn-ai" id="cv-ai-summary" style="margin-left:8px">${t('cv.summaryGen')}</button>
        <button class="btn btn-sm btn-ai" id="cv-ai-rewrite-summary" style="margin-left:4px">${t('cv.summaryRewrite')}</button></h3>
      <p class="text-muted text-sm" style="margin-bottom:10px">${t('cv.summaryHint')}</p>
      <div class="fg"><textarea id="cv-summary" rows="6">${esc(cv.summary || '')}</textarea></div>
      <button class="btn btn-primary" id="cv-save-summary">${t('common.save')}</button>`;
  }
  else if (section === 'certifications') {
    html = `<h3>${t('cv.certTitle')} <button class="btn btn-sm btn-outline" id="cv-add-cert" style="margin-left:8px">${t('common.add')}</button></h3>
      ${(cv.certifications||[]).map((c, i) => `
        <div class="${entryClass(c.id)}" draggable="true" data-entry-id="${c.id}">
          <div class="entry-head">
            <span class="drag-handle" title="${t('cv.dragReorder')}">⠿</span>
            <span class="entry-title-preview">${esc(c.name || `${t('cv.fbCertification')} ${i+1}`)}</span>
            <div class="entry-actions">
              <button class="entry-toggle" title="${t('cv.collapse')}">▾</button>
              ${hideBtn(c.id)}
              <button class="btn btn-xs btn-ghost" data-dup="${c.id}" title="${t('cv.duplicate')}">⧉</button>
              <button class="btn btn-xs btn-ghost" data-del-cert="${c.id}">✕</button>
            </div>
          </div>
          <div class="entry-body">
            <div class="fr3">
              <div class="fg"><label>${t('cv.lblName')}</label><input type="text" data-cert="${c.id}" data-f="name" value="${esc(c.name)}"></div>
              <div class="fg"><label>${t('cv.lblIssuer')}</label><input type="text" data-cert="${c.id}" data-f="issuer" value="${esc(c.issuer)}"></div>
              <div class="fg"><label>${t('cv.lblYear')}</label><input type="text" data-cert="${c.id}" data-f="year" value="${esc(c.year)}"></div>
            </div>
          </div>
        </div>`).join('')}
      <button class="btn btn-primary" id="cv-save-cert">${t('common.save')}</button>`;
  }
  else if (section === 'achievements') {
    html = `<h3>${t('cv.achTitle')} <button class="btn btn-sm btn-outline" id="cv-add-ach" style="margin-left:8px">${t('common.add')}</button></h3>
      <p class="text-muted text-sm" style="margin-bottom:10px">${t('cv.achHint')}</p>
      ${(cv.achievements||[]).map((a, i) => `
        <div class="${entryClass(a.id)}" draggable="true" data-entry-id="${a.id}">
          <div class="entry-head">
            <span class="drag-handle" title="${t('cv.dragReorder')}">⠿</span>
            <span class="entry-title-preview">${esc((a.text||'').slice(0,50) || `${t('cv.fbAchievement')} ${i+1}`)}</span>
            <div class="entry-actions">
              <button class="entry-toggle" title="${t('cv.collapse')}">▾</button>
              ${hideBtn(a.id)}
              <button class="btn btn-xs btn-ghost" data-dup="${a.id}" title="${t('cv.duplicate')}">⧉</button>
              <button class="btn btn-xs btn-ghost" data-del-ach="${a.id}">✕</button>
            </div>
          </div>
          <div class="entry-body">
            <div class="fg"><textarea data-ach="${a.id}" data-f="text" rows="2">${esc(a.text)}</textarea></div>
          </div>
        </div>`).join('')}
      <button class="btn btn-primary" id="cv-save-ach">${t('common.save')}</button>`;
  }
  else if (section === 'theme') {
    const s = d.settings;
    const presets = ['#1e3a5f','#0f4c5c','#2c3e50','#7b2d26','#4a148c','#1b5e20','#000000'];
    const fonts = ['Georgia','Garamond','Cambria','Times New Roman','Arial','Calibri','Helvetica'];
    html = `<h3>${t('cv.themeTitle')}</h3>
      <div class="fg"><label>${t('cv.accentLabel')}</label>
        <div class="color-presets">
          ${presets.map(c => `<button class="color-dot${s.cvAccent===c?' sel':''}" data-accent="${c}" style="background:${c}"></button>`).join('')}
          <input type="color" id="cv-accent-custom" value="${esc(s.cvAccent)}" title="${t('cv.accentCustom')}">
        </div>
      </div>
      <div class="fg"><label>${t('cv.fontLabel')}</label>
        <select id="cv-font">
          ${fonts.map(f => `<option${s.cvFont===f?' selected':''} style="font-family:'${f}'">${f}</option>`).join('')}
        </select>
      </div>
      <hr>
      <p class="text-muted text-sm">${t('cv.themeHint')}</p>`;
  }

  el.innerHTML = html;
  bindCVEditor(section);
}

function bindCVEditor(section) {
  const d = Store.get();
  const _autoSave = debounce(() => commitSectionToStore(section), 1200);

  function liveUpdate() { refreshCVPreview(); _autoSave(); }

  document.querySelectorAll('#cv-section-editor input, #cv-section-editor textarea, #cv-section-editor select')
    .forEach(inp => inp.addEventListener('input', liveUpdate));

  // Global: toggle entry-level hide for any section
  document.querySelectorAll('[data-hide-entry]').forEach(btn => {
    btn.addEventListener('click', () => {
      const cv = Store.get().cv;
      const id = btn.dataset.hideEntry;
      if (!cv.hiddenEntries) cv.hiddenEntries = [];
      const idx = cv.hiddenEntries.indexOf(id);
      if (idx === -1) cv.hiddenEntries.push(id);
      else cv.hiddenEntries.splice(idx, 1);
      Store.save();
      renderCVEditor(section);
      refreshCVPreview();
    });
  });

  if (section === 'personal') {
    document.getElementById('cv-photo-file')?.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 1.5 * 1024 * 1024) { toast(t('cv.photoTooBig')); return; }
      const reader = new FileReader();
      reader.onload = (ev) => {
        Store.get().cv.personal.photo = ev.target.result;
        Store.save();
        refreshCVPreview();
        renderCVEditor('personal');
        toast(t('cv.photoAdded'));
      };
      reader.readAsDataURL(file);
    });
    document.getElementById('cv-photo-clear')?.addEventListener('click', () => {
      Store.get().cv.personal.photo = '';
      Store.save();
      refreshCVPreview();
      renderCVEditor('personal');
      toast(t('cv.photoRemoved'));
    });
    document.getElementById('cv-save-personal')?.addEventListener('click', () => {
      const cv = Store.get().cv;
      cv.personal.name     = document.getElementById('cv-name').value;
      cv.personal.title    = document.getElementById('cv-ptitle').value;
      cv.personal.location = document.getElementById('cv-location').value;
      cv.personal.email    = document.getElementById('cv-email').value;
      cv.personal.phone    = document.getElementById('cv-phone').value;
      cv.personal.linkedin = document.getElementById('cv-linkedin').value;
      cv.personal.github   = document.getElementById('cv-github').value;
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
  }

  if (section === 'education') {
    document.getElementById('cv-add-edu')?.addEventListener('click', () => {
      Store.get().cv.education.push({ id: uid(), degree:'', school:'', location:'', years:'', description:'' });
      Store.save(); renderCVEditor('education');
    });
    document.querySelectorAll('[data-del-edu]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        cv.education = cv.education.filter(e => e.id !== btn.dataset.delEdu);
        Store.save(); renderCVEditor('education');
      });
    });
    document.getElementById('cv-save-edu')?.addEventListener('click', () => {
      const cv = Store.get().cv;
      document.querySelectorAll('[data-edu]').forEach(inp => {
        const e = cv.education.find(x => x.id === inp.dataset.edu);
        if (e) e[inp.dataset.f] = inp.value;
      });
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
  }

  if (section === 'skills') {
    document.getElementById('cv-add-skill')?.addEventListener('click', () => {
      Store.get().cv.skills.push({ id: uid(), category: '', items: [] });
      Store.save(); renderCVEditor('skills');
    });
    document.querySelectorAll('[data-del-sk]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        cv.skills = cv.skills.filter(s => s.id !== btn.dataset.delSk);
        Store.save(); renderCVEditor('skills'); refreshCVPreview();
      });
    });
    // Chip: toggle hidden
    document.querySelectorAll('[data-chip-vis]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        const sk = cv.skills.find(s => s.id === btn.dataset.chipSk);
        if (!sk) return;
        const item = sk.items.find(i => i.id === btn.dataset.chipVis);
        if (item) { item.hidden = !item.hidden; Store.save(); renderCVEditor('skills'); refreshCVPreview(); }
      });
    });
    // Chip: delete item
    document.querySelectorAll('[data-chip-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        const sk = cv.skills.find(s => s.id === btn.dataset.chipSk);
        if (!sk) return;
        sk.items = sk.items.filter(i => i.id !== btn.dataset.chipDel);
        Store.save(); renderCVEditor('skills'); refreshCVPreview();
      });
    });
    // Chip: add item on Enter or blur
    document.querySelectorAll('[data-chip-add]').forEach(inp => {
      function addChip() {
        const text = inp.value.trim();
        if (!text) return;
        const cv = Store.get().cv;
        const sk = cv.skills.find(s => s.id === inp.dataset.chipAdd);
        if (!sk) return;
        sk.items.push({ id: uid(), text, hidden: false });
        Store.save(); renderCVEditor('skills'); refreshCVPreview();
      }
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addChip(); } });
      inp.addEventListener('blur', addChip);
    });
    document.getElementById('cv-save-skills')?.addEventListener('click', () => {
      const cv = Store.get().cv;
      document.querySelectorAll('[data-sk-cat]').forEach(inp => {
        const s = cv.skills.find(x => x.id === inp.dataset.skCat);
        if (s) s.category = inp.value;
      });
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
  }

  if (section === 'projects') {
    document.getElementById('cv-add-proj')?.addEventListener('click', () => {
      Store.get().cv.projects.push({ id: uid(), title:'', tech:'', year:'', description:'' });
      Store.save(); renderCVEditor('projects');
    });
    document.querySelectorAll('[data-del-pr]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        cv.projects = cv.projects.filter(p => p.id !== btn.dataset.delPr);
        Store.save(); renderCVEditor('projects');
      });
    });
    document.getElementById('cv-save-projects')?.addEventListener('click', () => {
      const cv = Store.get().cv;
      document.querySelectorAll('[data-pr]').forEach(inp => {
        const p = cv.projects.find(x => x.id === inp.dataset.pr);
        if (p) p[inp.dataset.f] = inp.value;
      });
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
    document.querySelectorAll('[data-ai-pr]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ta = document.querySelector(`textarea[data-pr="${btn.dataset.aiPr}"][data-f="description"]`);
        const current = ta?.value || '';
        if (!current.trim()) { toast(t('cv.warnWriteDesc')); return; }
        AI.assist({
          title: t('cv.aiProjTitle'),
          prompt: Prompts.cvRewrite('project description', current),
          model: AI.SMART,
          onApply: (text) => { if (ta) { ta.value = text; refreshCVPreview(); } },
        });
      });
    });
  }

  if (section === 'languages') {
    document.getElementById('cv-add-lang')?.addEventListener('click', () => {
      Store.get().cv.languages.push({ id: uid(), language:'', level:'Intermediate' });
      Store.save(); renderCVEditor('languages');
    });
    document.querySelectorAll('[data-del-lang]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        cv.languages = cv.languages.filter(l => l.id !== btn.dataset.delLang);
        Store.save(); renderCVEditor('languages');
      });
    });
    document.getElementById('cv-save-lang')?.addEventListener('click', () => {
      const cv = Store.get().cv;
      document.querySelectorAll('[data-lang]').forEach(inp => {
        const l = cv.languages.find(x => x.id === inp.dataset.lang);
        if (l) l[inp.dataset.f] = inp.value;
      });
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
  }

  if (section === 'interests') {
    document.getElementById('cv-save-interests')?.addEventListener('click', () => {
      Store.get().cv.interests = document.getElementById('cv-interests').value;
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
  }

  if (section === 'summary') {
    document.getElementById('cv-save-summary')?.addEventListener('click', () => {
      Store.get().cv.summary = document.getElementById('cv-summary').value;
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
    document.getElementById('cv-ai-summary')?.addEventListener('click', () => {
      AI.assist({
        title: t('cv.aiSummaryGenTitle'),
        prompt: Prompts.cvSummary(),
        model: AI.SMART,
        onApply: (text) => {
          document.getElementById('cv-summary').value = text;
          Store.get().cv.summary = text; Store.save(); refreshCVPreview();
        },
      });
    });
    document.getElementById('cv-ai-rewrite-summary')?.addEventListener('click', () => {
      const current = document.getElementById('cv-summary')?.value || '';
      if (!current.trim()) { toast(t('cv.warnWriteSummary')); return; }
      AI.assist({
        title: t('cv.aiSummaryRewriteTitle'),
        prompt: Prompts.cvRewrite('professional summary', current),
        model: AI.SMART,
        onApply: (text) => {
          document.getElementById('cv-summary').value = text;
          Store.get().cv.summary = text; Store.save(); refreshCVPreview();
        },
      });
    });
  }

  if (section === 'certifications') {
    document.getElementById('cv-add-cert')?.addEventListener('click', () => {
      Store.get().cv.certifications.push({ id: uid(), name:'', issuer:'', year:'' });
      Store.save(); renderCVEditor('certifications');
    });
    document.querySelectorAll('[data-del-cert]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        cv.certifications = cv.certifications.filter(c => c.id !== btn.dataset.delCert);
        Store.save(); renderCVEditor('certifications');
      });
    });
    document.getElementById('cv-save-cert')?.addEventListener('click', () => {
      const cv = Store.get().cv;
      document.querySelectorAll('[data-cert]').forEach(inp => {
        const c = cv.certifications.find(x => x.id === inp.dataset.cert);
        if (c) c[inp.dataset.f] = inp.value;
      });
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
  }

  if (section === 'achievements') {
    document.getElementById('cv-add-ach')?.addEventListener('click', () => {
      Store.get().cv.achievements.push({ id: uid(), text:'' });
      Store.save(); renderCVEditor('achievements');
    });
    document.querySelectorAll('[data-del-ach]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        cv.achievements = cv.achievements.filter(a => a.id !== btn.dataset.delAch);
        Store.save(); renderCVEditor('achievements');
      });
    });
    document.getElementById('cv-save-ach')?.addEventListener('click', () => {
      const cv = Store.get().cv;
      document.querySelectorAll('[data-ach]').forEach(inp => {
        const a = cv.achievements.find(x => x.id === inp.dataset.ach);
        if (a) a[inp.dataset.f] = inp.value;
      });
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
  }

  if (section === 'experience') {
    document.getElementById('cv-add-exp')?.addEventListener('click', () => {
      Store.get().cv.experience.unshift({ id: uid(), company:'', position:'', period:'', location:'', description:'' });
      Store.save(); renderCVEditor('experience');
    });
    document.querySelectorAll('[data-del-exp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        cv.experience = cv.experience.filter(x => x.id !== btn.dataset.delExp);
        Store.save(); renderCVEditor('experience');
      });
    });
    document.querySelectorAll('[data-ai-exp]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cv = Store.get().cv;
        const x = cv.experience.find(e => e.id === btn.dataset.aiExp);
        if (!x) return;
        // Read live values first
        document.querySelectorAll(`[data-exp="${x.id}"]`).forEach(inp => { x[inp.dataset.f] = inp.value; });
        AI.assist({
          title: t('cv.aiExpTitle'),
          prompt: Prompts.improveDesc(x.position, x.company, x.period, x.description),
          model: AI.FAST,
          onApply: (text) => {
            const inp = document.querySelector(`textarea[data-exp="${x.id}"]`);
            if (inp) { inp.value = text.trim(); liveUpdate(); }
          },
        });
      });
    });
    document.getElementById('cv-save-exp')?.addEventListener('click', () => {
      const cv = Store.get().cv;
      document.querySelectorAll('[data-exp]').forEach(inp => {
        const x = cv.experience.find(e => e.id === inp.dataset.exp);
        if (x) x[inp.dataset.f] = inp.value;
      });
      Store.save(); toast(t('common.saved')); refreshCVPreview();
    });
  }

  if (section === 'theme') {
    function applyTheme(accent, font) {
      const s = Store.get().settings;
      if (accent !== undefined) s.cvAccent = accent;
      if (font !== undefined)   s.cvFont = font;
      Store.save(); refreshCVPreview();
    }
    document.querySelectorAll('[data-accent]').forEach(btn => {
      btn.addEventListener('click', () => {
        applyTheme(btn.dataset.accent, undefined);
        document.querySelectorAll('.color-dot').forEach(d => d.classList.toggle('sel', d.dataset.accent === btn.dataset.accent));
        const custom = document.getElementById('cv-accent-custom'); if (custom) custom.value = btn.dataset.accent;
      });
    });
    document.getElementById('cv-accent-custom')?.addEventListener('input', (e) => {
      applyTheme(e.target.value, undefined);
      document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('sel'));
    });
    document.getElementById('cv-font')?.addEventListener('change', (e) => applyTheme(undefined, e.target.value));
  }

  const _dragMap = { experience:'experience', education:'education', skills:'skills', projects:'projects', languages:'languages', certifications:'certifications', achievements:'achievements' };
  if (_dragMap[section]) initEntryDrag(document.getElementById('cv-section-editor'), _dragMap[section]);
}

function refreshCVPreview() {
  const preview = document.getElementById('cv-doc-preview');
  if (!preview) return;
  // Collect live editor values
  const cv = buildLiveCVFromEditor();
  preview.innerHTML = renderCVDoc(cv);
  applyCVThemeVars();
}

function buildLiveCVFromEditor() {
  const stored = Store.get().cv;
  const cv = JSON.parse(JSON.stringify(stored));

  // Read current editor inputs
  const get = id => document.getElementById(id)?.value ?? null;

  if (_cvSection === 'personal') {
    if (get('cv-name'))     cv.personal.name     = get('cv-name');
    if (get('cv-ptitle'))   cv.personal.title    = get('cv-ptitle');
    if (get('cv-location')) cv.personal.location = get('cv-location');
    if (get('cv-email'))    cv.personal.email    = get('cv-email');
    if (get('cv-phone'))    cv.personal.phone    = get('cv-phone');
    if (get('cv-linkedin')) cv.personal.linkedin = get('cv-linkedin');
    if (get('cv-github'))   cv.personal.github   = get('cv-github');
  }

  if (_cvSection === 'experience') {
    document.querySelectorAll('[data-exp]').forEach(inp => {
      const x = cv.experience.find(e => e.id === inp.dataset.exp);
      if (x) x[inp.dataset.f] = inp.value;
    });
  }
  if (_cvSection === 'education') {
    document.querySelectorAll('[data-edu]').forEach(inp => {
      const e = cv.education.find(x => x.id === inp.dataset.edu);
      if (e) e[inp.dataset.f] = inp.value;
    });
  }
  if (_cvSection === 'skills') {
    document.querySelectorAll('[data-sk-cat]').forEach(inp => {
      const s = cv.skills.find(x => x.id === inp.dataset.skCat);
      if (s) s.category = inp.value;
    });
  }
  if (_cvSection === 'projects') {
    document.querySelectorAll('[data-pr]').forEach(inp => {
      const p = cv.projects.find(x => x.id === inp.dataset.pr);
      if (p) p[inp.dataset.f] = inp.value;
    });
  }
  if (_cvSection === 'languages') {
    document.querySelectorAll('[data-lang]').forEach(inp => {
      const l = cv.languages.find(x => x.id === inp.dataset.lang);
      if (l) l[inp.dataset.f] = inp.value;
    });
  }
  if (_cvSection === 'interests') {
    if (get('cv-interests')) cv.interests = get('cv-interests');
  }
  if (_cvSection === 'summary') {
    if (get('cv-summary') !== null) cv.summary = get('cv-summary');
  }
  if (_cvSection === 'certifications') {
    document.querySelectorAll('[data-cert]').forEach(inp => {
      const c = cv.certifications.find(x => x.id === inp.dataset.cert);
      if (c) c[inp.dataset.f] = inp.value;
    });
  }
  if (_cvSection === 'achievements') {
    document.querySelectorAll('[data-ach]').forEach(inp => {
      const a = cv.achievements.find(x => x.id === inp.dataset.ach);
      if (a) a[inp.dataset.f] = inp.value;
    });
  }
  return cv;
}

/* ── CV Document renderer (ordered + themed) ───────────────────── */
function renderCVDoc(cv) {
  const p  = cv.personal;
  const h  = cv.hidden || [];
  const vis = id => !h.includes(id);
  const order = cv.order && cv.order.length ? cv.order
    : ['summary','education','skills','projects','certifications','achievements','languages','interests'];

  const contactParts = [p.location, p.email, p.phone, p.linkedin, p.github].filter(Boolean);
  const hiddenE = cv.hiddenEntries || [];

  let html = p.photo ? `
    <div class="cv-d-header">
      <div class="cv-d-header-left">
        <h1>${esc(p.name)}</h1>
        <div class="cv-d-title">${esc(p.title)}</div>
        <div class="cv-d-contact">${contactParts.map(c => `<span>${esc(c)}</span>`).join('')}</div>
      </div>
      <img src="${p.photo}" alt="Photo" class="cv-d-photo">
    </div>` : `
    <h1>${esc(p.name)}</h1>
    <div class="cv-d-title">${esc(p.title)}</div>
    <div class="cv-d-contact">${contactParts.map(c => `<span>${esc(c)}</span>`).join('')}</div>`;

  const blocks = {
    summary: () => (vis('summary') && cv.summary) ?
      `<div class="sec-title">Professional Summary</div><div class="cv-entry-desc">${esc(cv.summary)}</div>` : '',

    experience: () => (vis('experience') && (cv.experience||[]).filter(x=>!hiddenE.includes(x.id)).length) ?
      `<div class="sec-title">Expériences Professionnelles</div>` + cv.experience.filter(x=>!hiddenE.includes(x.id)).map(x => {
        const bullets = (x.description || '').split('\n').map(l => l.trim()).filter(Boolean);
        return `<div class="cv-entry">
          <div class="cv-entry-row">
            <span class="cv-entry-title">${esc(x.company)}${x.location ? ' — ' + esc(x.location) : ''}</span>
            <span class="cv-entry-date">${esc(x.period)}</span>
          </div>
          <div class="cv-entry-sub">${esc(x.position)}</div>
          ${bullets.length ? `<ul class="cv-bullets">${bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
        </div>`;
      }).join('') : '',

    education: () => (vis('education') && cv.education.filter(e=>!hiddenE.includes(e.id)).length) ?
      `<div class="sec-title">Education</div>` + cv.education.filter(e=>!hiddenE.includes(e.id)).map(e => `
        <div class="cv-entry">
          <div class="cv-entry-row">
            <span class="cv-entry-title">${esc(e.degree)}</span>
            <span class="cv-entry-date">${esc(e.years)}</span>
          </div>
          <div class="cv-entry-sub">${esc(e.school)}${e.location ? ' — ' + esc(e.location) : ''}</div>
          ${e.description ? `<div class="cv-entry-desc">${esc(e.description)}</div>` : ''}
        </div>`).join('') : '',

    skills: () => {
      if (!vis('skills') || !cv.skills.length) return '';
      const rows = cv.skills.filter(s => !hiddenE.includes(s.id)).map(s => {
        const visItems = (Array.isArray(s.items) ? s.items : []).filter(i => !i.hidden).map(i => esc(i.text));
        return (!s.category && !visItems.length) ? '' :
          `<div class="cv-skill-row"><span class="cv-skill-cat">${esc(s.category)}</span><span class="cv-skill-items">${visItems.join(', ')}</span></div>`;
      }).filter(Boolean);
      return rows.length ? `<div class="sec-title">Technical Skills</div>` + rows.join('') : '';
    },

    projects: () => (vis('projects') && cv.projects.filter(p=>!hiddenE.includes(p.id)).length) ?
      `<div class="sec-title">Projects</div>` + cv.projects.filter(p=>!hiddenE.includes(p.id)).map(pr => `
        <div class="cv-entry">
          <div class="cv-entry-row">
            <span class="cv-entry-title">${esc(pr.title)}</span>
            <span class="cv-entry-date">${esc(pr.year)}</span>
          </div>
          <div class="cv-entry-sub">${esc(pr.tech)}</div>
          ${pr.description ? `<div class="cv-entry-desc">${esc(pr.description)}</div>` : ''}
        </div>`).join('') : '',

    certifications: () => (vis('certifications') && (cv.certifications||[]).filter(c=>!hiddenE.includes(c.id)).length) ?
      `<div class="sec-title">Certifications</div>` + cv.certifications.filter(c=>!hiddenE.includes(c.id)).map(c =>
        (!c.name) ? '' :
        `<div class="cv-skill-row"><span class="cv-skill-cat">${esc(c.year)}</span><span class="cv-skill-items">${esc(c.name)}${c.issuer ? ' — ' + esc(c.issuer) : ''}</span></div>`
      ).join('') : '',

    achievements: () => (vis('achievements') && (cv.achievements||[]).filter(a=>!hiddenE.includes(a.id)).length) ?
      `<div class="sec-title">Key Achievements</div><ul class="cv-bullets">` +
        cv.achievements.filter(a=>!hiddenE.includes(a.id)).map(a => a.text ? `<li>${esc(a.text)}</li>` : '').join('') + `</ul>` : '',

    languages: () => (vis('languages') && cv.languages.filter(l=>!hiddenE.includes(l.id)).length) ?
      `<div class="sec-title">Languages</div>` + cv.languages.filter(l=>!hiddenE.includes(l.id)).map(l =>
        `<div class="cv-skill-row"><span class="cv-skill-cat">${esc(l.language)}</span><span class="cv-skill-items">${esc(l.level)}</span></div>`
      ).join('') : '',

    interests: () => (vis('interests') && cv.interests) ?
      `<div class="sec-title">Interests</div><div class="cv-entry-desc">${esc(cv.interests)}</div>` : '',
  };

  order.forEach(sec => { if (blocks[sec]) html += blocks[sec](); });
  return html;
}

/* CSS variables for the live preview, driven by settings */
function applyCVThemeVars() {
  const s = Store.get().settings || {};
  const preview = document.getElementById('cv-doc-preview');
  if (preview) {
    preview.style.setProperty('--cv-accent', s.cvAccent || '#1e3a5f');
    preview.style.fontFamily = `'${s.cvFont || 'Georgia'}', serif`;
  }
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Letters list
   ════════════════════════════════════════════════════════════════ */
function viewLetters() {
  const d = Store.get();

  setView(`
    <div class="ph">
      <div class="ph-left">
        <div class="ph-title">${t('letters.title')}</div>
        <div class="ph-sub">${d.letters.length} ${d.letters.length!==1?t('home.statLettersN'):t('home.statLetters1')}</div>
      </div>
      <div class="ph-right">
        <button class="btn btn-accent" id="btn-new-letter">${t('letters.new')}</button>
      </div>
    </div>
    <div class="pc">
      <div class="letters-grid">
        <div class="new-letter-card" id="new-letter-card">
          <div class="new-letter-plus">+</div>
          <div>${t('letters.newCard')}</div>
        </div>
        ${d.letters.map(l => `
          <div class="letter-card" onclick="Router.go('#letter/${l.id}')">
            <div class="letter-card-title">${esc(l.title)}</div>
            <div class="letter-card-meta">
              🏢 ${esc(l.company || t('letters.noCompany'))}<br>
              💼 ${esc(l.position || t('letters.noPosition'))}
            </div>
            <div class="letter-card-actions">
              <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();Router.go('#letter/${l.id}')">${t('letters.edit')}</button>
              <button class="btn btn-sm btn-accent" onclick="event.stopPropagation();Export.letter('${l.id}')">📥 PDF</button>
              <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();deleteLetter('${l.id}')">🗑</button>
            </div>
          </div>`).join('')}
      </div>
    </div>
  `);

  function createNew() {
    const d = Store.get();
    const id = uid();
    d.letters.push({
      id, title: t('letters.newCard'),
      company: '', position: '', date: '', recruiter: '', address: '',
      paragraphs: [...DEFAULT_LETTER_PARAS],
    });
    Store.save();
    Router.go(`#letter/${id}`);
  }

  document.getElementById('btn-new-letter').addEventListener('click', createNew);
  document.getElementById('new-letter-card').addEventListener('click', createNew);
}

function deleteLetter(id) {
  if (!confirm(t('letters.confirmDelete'))) return;
  const d = Store.get();
  d.letters = d.letters.filter(l => l.id !== id);
  Store.save();
  viewLetters();
  toast(t('letters.deleted'));
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Letter Editor
   ════════════════════════════════════════════════════════════════ */
function viewLetterEditor(id) {
  const d = Store.get();
  const letter = d.letters.find(l => l.id === id);

  if (!letter) { Router.go('#letters'); return; }

  const tags = d.tags;

  setView(`
    <div class="ph">
      <div class="ph-left">
        <button class="btn btn-ghost" onclick="Router.go('#letters')">${t('common.back')}</button>
        <input id="letter-title-input" value="${esc(letter.title)}"
          style="border:none;background:transparent;font-size:16px;font-weight:700;outline:none;padding:0 8px;min-width:200px"
          placeholder="${t('letters.titlePh')}">
      </div>
      <div class="ph-right">
        <span class="text-muted text-sm" id="save-status">${t('letters.autosave')}</span>
        <button class="btn btn-ai" id="letter-ai-generate">${t('letters.generate')}</button>
        <button class="btn btn-accent" onclick="Export.letter('${id}')">${t('cv.exportPdf')}</button>
      </div>
    </div>
    <div id="letter-layout">
      <div id="letter-editor-main">
        <!-- Metadata -->
        <div class="card" style="margin-bottom:20px">
          <div class="card-h">${t('letters.info')}</div>
          <div class="card-b">
            <div class="letter-meta-grid">
              <div class="fg"><label>${t('cv.lblCompany')}</label><input class="lm-field" id="lm-company"   value="${esc(letter.company)}"   placeholder="${t('letters.companyPh')}"></div>
              <div class="fg"><label>${t('letters.targetPosition')}</label><input class="lm-field" id="lm-position"  value="${esc(letter.position)}"  placeholder="${t('letters.positionPh')}"></div>
              <div class="fg"><label>${t('letters.recruiter')}</label><input class="lm-field" id="lm-recruiter"  value="${esc(letter.recruiter)}" placeholder="${t('letters.recruiterPh')}"></div>
              <div class="fg"><label>${t('letters.date')}</label><input class="lm-field" id="lm-date"           value="${esc(letter.date)}"      placeholder="${t('letters.datePh')}"></div>
              <div class="fg span2"><label>${t('letters.companyAddress')}</label><input class="lm-field" id="lm-address" value="${esc(letter.address)}" placeholder="${t('letters.addressPh')}"></div>
            </div>
          </div>
        </div>

        <!-- Letter body -->
        <div class="card">
          <div class="card-h">
            <span>${t('letters.body')}</span>
            <span class="text-muted text-sm">${t('letters.tagHint')}</span>
          </div>
          <div class="card-b">
            <div id="letter-paras">
              ${letter.paragraphs.map((p, i) => `
                <div class="para-wrap">
                  <div class="para-toolbar">
                    <button class="btn btn-xs btn-ghost" onclick="addPara(${i})">${t('letters.paraBefore')}</button>
                    <button class="btn btn-xs btn-ghost" onclick="delPara(${i})" ${letter.paragraphs.length<=1?'disabled':''}>${t('letters.paraDel')}</button>
                    <button class="btn btn-xs btn-ghost" onclick="addPara(${i+1})">${t('letters.paraAfter')}</button>
                    <button class="btn btn-xs btn-ai" data-ai-para="${i}">${t('cv.improve')}</button>
                  </div>
                  <div class="letter-para" contenteditable="true"
                       data-para="${i}" data-placeholder="${t('letters.paraPh')} ${i+1}…">${esc(p)}</div>
                </div>`).join('')}
            </div>
            <button class="btn btn-outline btn-sm" onclick="addPara(999)" style="margin-top:8px">${t('letters.addPara')}</button>
          </div>
        </div>
      </div>

      <!-- Tags sidebar -->
      <div id="letter-editor-sidebar">
        <div class="tags-sb-title">${t('letters.quality')}</div>
        <div id="letter-check"></div>
        <div class="tags-sb-title" style="margin-top:16px">${t('letters.tagsAvail')}</div>
        <div class="tag-search">
          <input type="text" id="tag-search-input" placeholder="${t('letters.searchTag')}">
        </div>
        <div id="tag-chips">
          ${tags.map(t => `
            <button class="tag-chip" data-tag-val="${esc(t.value)}" title="${esc(t.value)}">
              <span class="tc-key">@${esc(t.key)}</span>
              <span class="tc-val">${esc(t.value)}</span>
            </button>`).join('')}
        </div>
        <div class="tags-sb-title" style="margin-top:16px">${t('letters.settings')}</div>
        <button class="btn btn-outline btn-sm" style="width:100%;margin-bottom:6px" onclick="Export.letter('${id}')">${t('cv.exportPdf')}</button>
        <button class="btn btn-ghost btn-sm" style="width:100%" onclick="if(confirm(window.__t('letters.confirmReset'))){resetLetterContent('${id}')}">${t('letters.reset')}</button>
      </div>
    </div>
  `);

  const currentLetterId = id;
  let _lastPara = null; // last focused paragraph for tag chip insertion

  // Attach tag engine to all paragraphs
  document.querySelectorAll('.letter-para').forEach(el => {
    TagEngine.attachEl(el);
    el.addEventListener('focus', () => { _lastPara = el; });
  });

  // Cover-letter quality checker (research-backed: 250–400 words, name the company, metrics)
  function runLetterCheck() {
    const box = document.getElementById('letter-check');
    if (!box) return;
    const company = (document.getElementById('lm-company')?.value || '').trim();
    const bodyText = [...document.querySelectorAll('.letter-para')].map(p => p.innerText).join(' ');
    const words = (bodyText.trim().match(/\S+/g) || []).length;
    const companyNamed = company && bodyText.toLowerCase().includes(company.toLowerCase());
    const hasNumber = /\d/.test(bodyText);
    const generic = /(je suis dynamique|esprit d'équipe|polyvalent|à votre disposition pour|grande motivation)/i.test(bodyText);

    const checks = [
      { ok: words >= 200 && words <= 400, label: `${t('letters.chkLengthPre')} ${words} ${t('letters.chkLengthSuf')}`, warn: words>0 && (words<200||words>400) },
      { ok: !!companyNamed, label: companyNamed ? t('letters.chkCompanyOk') : t('letters.chkCompanyNo') },
      { ok: hasNumber, label: hasNumber ? t('letters.chkNumOk') : t('letters.chkNumNo') },
      { ok: !generic, label: generic ? t('letters.chkGenericBad') : t('letters.chkGenericOk') },
    ];
    const done = checks.filter(c => c.ok).length;
    const pct = Math.round(done/checks.length*100);
    const color = pct >= 75 ? '#27ae60' : pct >= 50 ? '#f0a500' : '#e74c3c';
    box.innerHTML = `
      <div class="progress" style="margin-bottom:8px"><div class="progress-bar" style="width:${pct}%;background:${color}"></div></div>
      ${checks.map(c => `<div class="check-item ${c.ok?'ok':'no'}" style="font-size:11px">${c.ok?'✅':(c.warn?'⚠️':'⬜')} ${esc(c.label)}</div>`).join('')}`;
  }

  // Auto-save on any change
  let _saveTimer;
  function autoSave() {
    clearTimeout(_saveTimer);
    runLetterCheck();
    _saveTimer = setTimeout(() => {
      saveLetter(currentLetterId);
      document.getElementById('save-status').textContent = t('letters.savedStatus');
      setTimeout(() => {
        const el = document.getElementById('save-status');
        if (el) el.textContent = t('letters.autosave');
      }, 1500);
    }, 700);
  }
  runLetterCheck();

  document.querySelectorAll('.lm-field').forEach(f => f.addEventListener('input', autoSave));
  document.getElementById('letter-title-input').addEventListener('input', autoSave);
  document.querySelectorAll('.letter-para').forEach(p => p.addEventListener('input', autoSave));
  document.querySelectorAll('.letter-para').forEach(p => p.addEventListener('change', autoSave));

  // Tag chips: insert at last focused para
  document.querySelectorAll('.tag-chip').forEach(chip => {
    chip.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const val = chip.dataset.tagVal;
      const target = _lastPara || document.querySelector('.letter-para');
      if (!target) return;
      target.focus();
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const range = sel.getRangeAt(0);
        range.deleteContents();
        range.insertNode(document.createTextNode(val));
        range.collapse(false);
        sel.removeAllRanges(); sel.addRange(range);
      } else {
        target.textContent += val;
      }
      autoSave();
    });
  });

  // Tag search filter
  document.getElementById('tag-search-input').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    document.querySelectorAll('.tag-chip').forEach(chip => {
      const show = !q || chip.textContent.toLowerCase().includes(q);
      chip.style.display = show ? '' : 'none';
    });
  });

  // AI: generate the whole letter from company/position (+ optional JD from ATS page)
  document.getElementById('letter-ai-generate').addEventListener('click', () => {
    const company  = document.getElementById('lm-company').value.trim();
    const position = document.getElementById('lm-position').value.trim();
    AI.assist({
      title: t('letters.genTitle'),
      prompt: Prompts.coverLetter(company, position, _lastJD || ''),
      model: AI.MAX,
      onApply: (text) => {
        const paras = text.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean);
        const l = Store.get().letters.find(x => x.id === currentLetterId);
        if (l && paras.length) { l.paragraphs = paras; Store.save(); viewLetterEditor(currentLetterId); }
      },
    });
  });

  // AI: improve a single paragraph
  document.querySelectorAll('[data-ai-para]').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = document.querySelector(`.letter-para[data-para="${btn.dataset.aiPara}"]`);
      const current = el?.innerText || '';
      if (!current.trim()) { toast(t('letters.paraEmpty')); return; }
      AI.assist({
        title: t('letters.aiParaTitle'),
        prompt: Prompts.improve(current, 'cover-letter paragraph'),
        model: AI.FAST,
        onApply: (text) => { if (el) { el.innerText = text; autoSave(); } },
      });
    });
  });

  // addPara / delPara — defined on window so onclick= works
  window.addPara = function(afterIdx) {
    const d = Store.get();
    const l = d.letters.find(x => x.id === currentLetterId);
    if (!l) return;
    const idx = Math.min(afterIdx, l.paragraphs.length);
    l.paragraphs.splice(idx, 0, '');
    Store.save();
    viewLetterEditor(currentLetterId);
  };

  window.delPara = function(idx) {
    const d = Store.get();
    const l = d.letters.find(x => x.id === currentLetterId);
    if (!l || l.paragraphs.length <= 1) return;
    l.paragraphs.splice(idx, 1);
    Store.save();
    viewLetterEditor(currentLetterId);
  };

  window.resetLetterContent = function(lid) {
    const d = Store.get();
    const l = d.letters.find(x => x.id === lid);
    if (!l) return;
    l.paragraphs = [...DEFAULT_LETTER_PARAS];
    Store.save();
    viewLetterEditor(lid);
  };
}

function saveLetter(id) {
  const d = Store.get();
  const l = d.letters.find(x => x.id === id);
  if (!l) return;

  const titleEl  = document.getElementById('letter-title-input');
  if (titleEl) l.title = titleEl.value;

  const get = i => document.getElementById(i)?.value ?? '';
  l.company   = get('lm-company');
  l.position  = get('lm-position');
  l.recruiter = get('lm-recruiter');
  l.date      = get('lm-date');
  l.address   = get('lm-address');

  document.querySelectorAll('.letter-para').forEach((el, i) => {
    l.paragraphs[i] = el.innerText;
  });

  Store.save();
}

/* ════════════════════════════════════════════════════════════════
   Export (opens print window)
   ════════════════════════════════════════════════════════════════ */
const Export = {
  /* ── ATS-safe export: plain semantic HTML, no layout CSS ── */
  cvATS() {
    const cv = buildLiveCVFromEditor();
    const p  = cv.personal;
    const h  = cv.hidden || [];
    const vis = id => !h.includes(id);

    const contact = [p.location, p.email, p.phone, p.linkedin, p.github].filter(Boolean).join(' | ');

    let body = `<h1>${esc(p.name)}</h1>\n`;
    if (p.title)  body += `<p class="title">${esc(p.title)}</p>\n`;
    if (contact)  body += `<p class="contact">${esc(contact)}</p>\n`;

    if (vis('education') && cv.education.length) {
      body += `<h2>EDUCATION</h2>\n`;
      cv.education.forEach(e => {
        body += `<div class="entry">
  <p class="etitle">${esc(e.degree)}</p>
  <p class="emeta">${esc(e.school)}${e.location?' — '+esc(e.location):''}${e.years?' | '+esc(e.years):''}</p>
  ${e.description ? `<p class="edesc">${esc(e.description)}</p>` : ''}
</div>\n`;
      });
    }

    if (vis('skills') && cv.skills.length) {
      body += `<h2>TECHNICAL SKILLS</h2>\n<ul>\n`;
      cv.skills.forEach(s => {
        const itemText = Array.isArray(s.items)
          ? s.items.filter(i => !i.hidden).map(i => i.text).join(', ')
          : String(s.items || '');
        if (!s.category && !itemText) return;
        body += `<li><strong>${esc(s.category)}:</strong> ${esc(itemText)}</li>\n`;
      });
      body += `</ul>\n`;
    }

    if (vis('projects') && cv.projects.length) {
      body += `<h2>PROJECTS</h2>\n`;
      cv.projects.forEach(p => {
        body += `<div class="entry">
  <p class="etitle">${esc(p.title)}${p.year?' ('+esc(p.year)+')':''}</p>
  <p class="emeta">${esc(p.tech)}</p>
  ${p.description ? `<p class="edesc">${esc(p.description)}</p>` : ''}
</div>\n`;
      });
    }

    if (vis('languages') && cv.languages.length) {
      body += `<h2>LANGUAGES</h2>\n<ul>\n`;
      cv.languages.forEach(l => {
        body += `<li><strong>${esc(l.language)}:</strong> ${esc(l.level)}</li>\n`;
      });
      body += `</ul>\n`;
    }

    if (vis('interests') && cv.interests) {
      body += `<h2>INTERESTS</h2>\n<p class="edesc">${esc(cv.interests)}</p>\n`;
    }

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<style>
@page{size:A4;margin:20mm}
body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;line-height:1.45;color:#000;margin:0}
h1{font-size:18pt;margin:0 0 4px}
.title{font-size:11pt;margin:0 0 3px}
.contact{font-size:10pt;margin:0 0 14px}
h2{font-size:11pt;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #000;
   padding-bottom:2px;margin:14px 0 6px}
.entry{margin-bottom:9px}
.etitle{font-weight:bold;font-size:11pt;margin:0}
.emeta{font-size:10pt;color:#333;margin:1px 0}
.edesc{font-size:10pt;margin:2px 0}
ul{margin:4px 0 4px 18px;padding:0}
li{font-size:10pt;margin-bottom:3px}
</style>
</head><body>${body}</body></html>`;

    _printWin(html);
    toast(t('cv.atsOpened'));
  },

  cv() {
    const cv = buildLiveCVFromEditor();
    const s  = Store.get().settings || {};
    const accent = s.cvAccent || '#1e3a5f';
    const font   = s.cvFont || 'Georgia';
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
@page{size:A4;margin:0}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{width:210mm;min-height:297mm;background:#fff;padding:18mm 18mm 18mm 22mm;
  font-family:'${font}','Times New Roman',serif;font-size:10.5pt;line-height:1.55;color:#111}
h1{font-size:22pt;font-weight:700;color:${accent};margin-bottom:2px}
.cv-d-title{font-size:11pt;color:#444;margin-bottom:6px}
.cv-d-contact{font-size:9.5pt;color:#555;display:flex;flex-wrap:wrap;gap:12px;margin-bottom:14px}
.cv-d-contact span::before{content:"✦ ";font-size:7pt}
.sec-title{font-size:10pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;
  color:${accent};border-bottom:1.5px solid ${accent};padding-bottom:2px;margin:14px 0 8px}
.cv-entry{margin-bottom:9px}
.cv-entry-row{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
.cv-entry-title{font-weight:700;font-size:10.5pt}
.cv-entry-date{font-size:9pt;color:#555;white-space:nowrap}
.cv-entry-sub{font-size:9.5pt;color:#444;margin-top:1px}
.cv-entry-desc{font-size:9.5pt;margin-top:2px}
.cv-skill-row{display:flex;gap:10px;margin-bottom:4px;font-size:9.5pt}
.cv-skill-cat{font-weight:700;min-width:110px;flex-shrink:0}
.cv-bullets{margin:4px 0 8px 18px;padding:0}
.cv-bullets li{font-size:9.5pt;margin-bottom:3px}
</style></head><body>${renderCVDoc(cv)}</body></html>`;
    _printWin(html, 'CV_' + (cv.personal.name || 'export').replace(/[^A-Za-z0-9]+/g, '_') + '.pdf');
  },

  letter(id) {
    saveLetter(id);
    const d = Store.get();
    const l = d.letters.find(x => x.id === id);
    if (!l) return;
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8">
<style>
@page{size:A4;margin:0}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{width:210mm;min-height:297mm;background:#fff;padding:22mm 20mm 22mm 25mm;
  font-family:Georgia,'Times New Roman',serif;font-size:11pt;line-height:1.65;color:#1a1a1a}
.sender{margin-bottom:18px}
.sender strong{font-size:13pt}
.sender p{font-size:10.5pt;color:#333;margin-top:2px}
.meta-row{display:flex;justify-content:space-between;align-items:flex-start;margin:26px 0 22px}
.recipient{font-size:10.5pt;line-height:1.6}
.date-block{text-align:right;font-size:10.5pt}
.subject{margin-bottom:20px;font-size:10.5pt}
.subject strong{text-decoration:underline}
.salut{margin-bottom:14px;font-size:11pt}
p.para{margin-bottom:14px;font-size:11pt;line-height:1.75;text-align:justify}
.closing{margin-top:26px;font-size:11pt}
.sig{margin-top:40px;font-weight:bold;font-size:11pt}
</style></head><body>
<div class="sender">
  <strong>${esc(d.cv.personal.name)}</strong>
  <p>${esc(d.cv.personal.location)}</p>
  <p>${esc(d.cv.personal.email)}</p>
  <p>${esc(d.cv.personal.title)}</p>
</div>
<div class="meta-row">
  <div class="recipient">
    <strong>${esc(l.company || '[Entreprise]')}</strong><br>
    À l'attention de ${esc(l.recruiter || '[Recruteur]')}<br>
    ${esc(l.address || '')}
  </div>
  <div class="date-block">${esc(d.cv.personal.location.split(',')[0] || 'Sfax')}, le ${esc(l.date || '[Date]')}</div>
</div>
<div class="subject"><strong>Objet :</strong> Candidature — ${esc(l.position || '[Poste visé]')}</div>
<div class="salut">Madame, Monsieur ${esc(l.recruiter ? l.recruiter : '')},</div>
${l.paragraphs.map(p => `<p class="para">${esc(p)}</p>`).join('')}
<div class="closing">
  <p>Dans l'attente de votre retour, veuillez agréer, Madame, Monsieur, l'expression de mes salutations distinguées.</p>
  <div class="sig">${esc(d.cv.personal.name)}</div>
</div>
</body></html>`;
    _printWin(html, `Lettre_${(l.company||'motivation').replace(/\s+/g,'_')}.pdf`);
  },
};

function _printWin(html) {
  const win = window.open('', '_blank', 'width=900,height=700');
  if (!win) { toast(t('common.popupBlocked')); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { try { win.print(); } catch(e){} }, 600);
}

/* ════════════════════════════════════════════════════════════════
   App init
   ════════════════════════════════════════════════════════════════ */
/* ════════════════════════════════════════════════════════════════
   ATS keyword engine + helpers
   ════════════════════════════════════════════════════════════════ */
const STOPWORDS = new Set(('a an the and or but if then else for to of in on at by with from as is are be been being this that these those you your we our us they their it its will shall can may must should would could not no nour vous votre nous notre des les une un le la de du et ou en au aux pour par avec sur dans est sont être avoir qui que quoi dont plus très bien sera nos vos ces cette afin ainsi candidat poste profil mission missions experience expériences expérience années année travail equipe équipe entreprise société stage we are looking seeking join team work role within strong good ability skills knowledge using used use including etc job description responsibilities requirements préférée souhaité souhaitée required preferred plus minimum years our you the a an').split(/\s+/));

const TECH_PHRASES = [
  'machine learning','deep learning','active directory','spanning tree','load balancing','auto scaling',
  'access control','penetration testing','data structures','object oriented','version control','continuous integration',
  'continuous deployment','rest api','web services','cloud computing','network security','information security',
  'incident response','threat detection','identity management','site reliability','unit testing','test automation',
  'agile','scrum','ci/cd','infrastructure as code','natural language','computer vision','big data','data analysis',
  'project management','problem solving','team work','communication skills','cyber security','vulnerability assessment',
  'firewall configuration','virtual machine','operating system','source control','design patterns','microservices',
];

// Concrete tech-skill vocabulary for the Radar insights (what these jobs demand) and CV-gap
// flagging. A detection dictionary spanning many areas — the user's CV decides have vs missing.
const SKILL_VOCAB = [...new Set([
  ...TECH_PHRASES,
  'python','java','javascript','typescript','c++','c#','golang','rust','php','ruby','bash','powershell','sql','node.js','nodejs','react','angular','vue','.net','flutter',
  'aws','azure','gcp','google cloud','docker','kubernetes','terraform','ansible','jenkins','gitlab','github','git','linux','windows server','vmware','nginx','prometheus','grafana','helm','openshift',
  'cisco','juniper','tcp/ip','bgp','ospf','eigrp','vlan','vpn','ipsec','wireguard','dns','dhcp','sd-wan','mpls','routing','switching','load balancer','fortinet','palo alto','pfsense',
  'firewall','siem','splunk','soc','ids','ips','edr','wireshark','nmap','burp suite','metasploit','kali','owasp','pentest','iam','zero trust','nist','iso 27001','ceh','oscp','crowdstrike',
  'power bi','tableau','kafka','spark','mongodb','postgresql','mysql','redis','elasticsearch','graphql','ci/cd','agile','scrum','jira',
])];

// Display-case a detected (lowercase) skill before writing it into the CV, so it reads
// professionally — known acronyms/brands cased correctly, everything else title-cased.
const SKILL_CASE = {
  'ci/cd':'CI/CD','tcp/ip':'TCP/IP','sd-wan':'SD-WAN','power bi':'Power BI','node.js':'Node.js','nodejs':'Node.js',
  '.net':'.NET','c++':'C++','c#':'C#','iso 27001':'ISO 27001','aws':'AWS','gcp':'GCP','sql':'SQL','mysql':'MySQL',
  'postgresql':'PostgreSQL','graphql':'GraphQL','php':'PHP','vpn':'VPN','dns':'DNS','dhcp':'DHCP','bgp':'BGP','ospf':'OSPF',
  'eigrp':'EIGRP','vlan':'VLAN','mpls':'MPLS','ipsec':'IPsec','siem':'SIEM','soc':'SOC','ids':'IDS','ips':'IPS','edr':'EDR',
  'iam':'IAM','nist':'NIST','ceh':'CEH','oscp':'OSCP','owasp':'OWASP','pfsense':'pfSense','openshift':'OpenShift',
  'gitlab':'GitLab','github':'GitHub','vmware':'VMware',
};
function prettySkill(s) {
  const k = String(s || '').toLowerCase().trim();
  return SKILL_CASE[k] || k.replace(/\b\w/g, c => c.toUpperCase());
}

function normText(s) { return ' ' + String(s||'').toLowerCase().replace(/[^a-z0-9+#./\-\s]/g,' ').replace(/\s+/g,' ') + ' '; }

// Full CV text corpus for matching
function cvFullText(cv) {
  const parts = [(cv.personal||{}).title, cv.summary, cv.interests];
  (cv.education||[]).forEach(e => parts.push(e.degree, e.school, e.description));
  (cv.skills||[]).forEach(s => {
    parts.push(s.category);
    if (Array.isArray(s.items)) s.items.forEach(i => parts.push(i.text));
    else parts.push(s.items);
  });
  (cv.projects||[]).forEach(p => parts.push(p.title, p.tech, p.description));
  (cv.certifications||[]).forEach(c => parts.push(c.name, c.issuer));
  (cv.achievements||[]).forEach(a => parts.push(a.text));
  (cv.languages||[]).forEach(l => parts.push(l.language));
  return normText(parts.filter(Boolean).join(' '));
}

// Extract weighted keywords from a job description
function extractKeywords(jd) {
  const text = normText(jd);
  const found = new Map(); // keyword -> count
  const phraseWords = new Set(); // component words of captured phrases — don't list them again on their own

  // multi-word tech phrases first
  TECH_PHRASES.forEach(ph => {
    const re = new RegExp('\\b' + ph.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b', 'g');
    const m = text.match(re);
    if (m) { found.set(ph, m.length + 2); ph.split(/\s+/).forEach(w => phraseWords.add(w)); } // weight phrases higher
  });

  // single significant tokens
  const tokens = text.split(/\s+/).filter(Boolean);
  tokens.forEach(t => {
    t = t.replace(/^[-./]+|[-./]+$/g,'');
    if (t.length < 3 || t.length > 30) return;
    if (STOPWORDS.has(t)) return;
    if (/^\d+$/.test(t)) return;
    if (phraseWords.has(t)) return;   // skip if already part of a captured phrase
    found.set(t, (found.get(t) || 0) + 1);
  });

  // rank by count, keep top 40
  return [...found.entries()]
    .sort((a,b) => b[1]-a[1])
    .slice(0, 40)
    .map(([word, count]) => ({ word, count }));
}

function analyzeATS(jd, cv) {
  const keywords = extractKeywords(jd);
  const corpus = cvFullText(cv);
  const matched = [], missing = [];
  keywords.forEach(k => {
    const re = new RegExp('\\b' + k.word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&') + '\\b');
    if (re.test(corpus)) matched.push(k); else missing.push(k);
  });
  const score = keywords.length ? Math.round(matched.length / keywords.length * 100) : 0;
  return { score, matched, missing, total: keywords.length };
}

/* ════════════════════════════════════════════════════════════════
   VIEW: ATS Match Analyzer
   ════════════════════════════════════════════════════════════════ */
let _lastJD = '';
function viewATS() {
  setView(`
    <div class="ph">
      <div class="ph-left">
        <div class="ph-title">${t('ats.title')}</div>
        <div class="ph-sub">${t('ats.sub')}</div>
      </div>
    </div>
    <div class="pc">
      <div class="g2" style="grid-template-columns:1fr 1fr;align-items:start">
        <div class="card">
          <div class="card-h">${t('ats.jdTitle')}</div>
          <div class="card-b">
            <textarea id="ats-jd" rows="16" placeholder="${t('ats.jdPh')}">${esc(_lastJD)}</textarea>
            <button class="btn btn-primary mt-16" id="ats-run" style="margin-top:12px;width:100%">${t('ats.analyze')}</button>
          </div>
        </div>
        <div id="ats-results">
          <div class="empty-state">
            <div class="empty-icon">📊</div>
            <p>${t('ats.emptyL1')}<br>${t('ats.emptyL2')}</p>
          </div>
        </div>
      </div>
    </div>
  `);

  document.getElementById('ats-run').addEventListener('click', () => {
    const jd = document.getElementById('ats-jd').value.trim();
    _lastJD = jd;
    if (jd.length < 40) { toast(t('ats.warnMore')); return; }
    const r = analyzeATS(jd, Store.get().cv);
    renderATSResults(r);
  });
}

function renderATSResults(r) {
  const color = r.score >= 75 ? '#27ae60' : r.score >= 60 ? '#f0a500' : '#e74c3c';
  const verdict = r.score >= 75 ? t('ats.verdictHigh') :
                  r.score >= 60 ? t('ats.verdictMid') :
                                  t('ats.verdictLow');

  document.getElementById('ats-results').innerHTML = `
    <div class="card" style="margin-bottom:16px">
      <div class="card-b" style="text-align:center">
        <div class="score-ring" style="--val:${r.score};--ring:${color}">
          <div class="score-ring-inner"><span style="color:${color}">${r.score}%</span><small>match</small></div>
        </div>
        <div style="font-weight:700;margin-top:8px;color:${color}">${verdict}</div>
        <div class="text-muted text-sm">${r.matched.length}/${r.total} ${t('ats.kwStat')}</div>
      </div>
    </div>
    <div class="card" style="margin-bottom:16px">
      <div class="card-h">
        <span>${t('ats.missing')} <span class="badge" style="background:rgba(231,76,60,.12);color:#e74c3c">${r.missing.length}</span></span>
        ${r.missing.length ? `<button class="btn btn-sm btn-ai" id="ats-ai-suggest">${t('ats.aiSuggest')}</button>` : ''}
      </div>
      <div class="card-b">
        ${r.missing.length ? `<p class="text-muted text-sm" style="margin-bottom:10px">${t('ats.addRelevant')}</p>
          <div class="kw-wrap">${r.missing.map(k => `<span class="kw kw-miss">${esc(k.word)}</span>`).join('')}</div>`
          : `<p class="text-muted">${t('ats.noneMissing')}</p>`}
      </div>
    </div>
    <div class="card">
      <div class="card-h">${t('ats.present')} <span class="badge" style="background:rgba(39,174,96,.12);color:#27ae60">${r.matched.length}</span></div>
      <div class="card-b">
        <div class="kw-wrap">${r.matched.map(k => `<span class="kw kw-hit">${esc(k.word)}</span>`).join('') || '<span class="text-muted">—</span>'}</div>
      </div>
    </div>
  `;

  document.getElementById('ats-ai-suggest')?.addEventListener('click', () => {
    AI.assist({
      title: t('ats.aiSuggestTitle'),
      prompt: Prompts.atsSuggest(r.missing.map(k => k.word)),
      model: AI.FAST,
      // read-only advice: no onApply
    });
  });
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Job Application Tracker (Kanban)
   ════════════════════════════════════════════════════════════════ */
function viewTracker() {
  const d = Store.get();
  const apps = d.applications;

  setView(`
    <div class="ph">
      <div class="ph-left">
        <div class="ph-title">${t('tracker.title')}</div>
        <div class="ph-sub">${apps.length} ${apps.length!==1?t('home.statAppsN'):t('home.statApps1')} · ${apps.filter(a=>a.tailoredLetter||a.tailoredSummary).length} ${t('tracker.withPkg')}</div>
      </div>
      <div class="ph-right">
        <button class="btn btn-accent" onclick="Router.go('#apply')">🚀 Quick Apply</button>
        <button class="btn btn-outline" id="trk-add">${t('tracker.manualAdd')}</button>
      </div>
    </div>
    <div class="pc">
      <div id="trk-form" class="card" style="display:none;margin-bottom:18px">
        <div class="card-b">
          <div class="fr3">
            <div class="fg"><label>${t('cv.lblCompany')}</label><input type="text" id="trk-company" placeholder="${t('letters.companyPh')}"></div>
            <div class="fg"><label>${t('tracker.position')}</label><input type="text" id="trk-position" placeholder="${t('tracker.positionPh')}"></div>
            <div class="fg"><label>${t('tracker.status')}</label><select id="trk-status">${APP_STATUSES.map(s=>`<option value="${s.key}">${statusLabel(s.key)}</option>`).join('')}</select></div>
          </div>
          <div class="fr3">
            <div class="fg"><label>${t('tracker.dateApplied')}</label><input type="date" id="trk-date" value="${todayISO()}"></div>
            <div class="fg"><label>${t('tracker.dateFollowup')}</label><input type="date" id="trk-followup"></div>
            <div class="fg"><label>${t('tracker.type')}</label><select id="trk-remote"><option value="">—</option><option>Remote</option><option>Hybrid</option><option>Onsite</option></select></div>
          </div>
          <div class="fr">
            <div class="fg"><label>${t('tracker.link')}</label><input type="text" id="trk-link" placeholder="https://..."></div>
            <div class="fg"><label>${t('tracker.contact')}</label><input type="text" id="trk-contact" placeholder="${t('tracker.contactPh')}"></div>
            <div class="fg"><label>${t('tracker.salary')}</label><input type="text" id="trk-salary" placeholder="${t('tracker.salaryPh')}"></div>
          </div>
          <div class="fg"><label>${t('tracker.jdLabel')}</label><textarea id="trk-jd" rows="4" placeholder="${t('tracker.jdPh')}"></textarea></div>
          <div class="fg"><label>${t('tracker.notes')}</label><textarea id="trk-notes" rows="2" placeholder="${t('tracker.notesPh')}"></textarea></div>
          <div class="btn-group">
            <button class="btn btn-primary" id="trk-save">${t('common.save')}</button>
            <button class="btn btn-ghost" id="trk-cancel">${t('common.cancel')}</button>
          </div>
        </div>
      </div>

      ${apps.length ? `${renderTrackerInsights(apps)}

      <div class="trk-toolbar">
        <input type="text" id="trk-search" placeholder="${t('tracker.search')}" style="flex:1;max-width:320px">
        <div class="trk-filter-tabs">
          <button class="filter-tab active" data-filter="all">${t('tracker.filterAll')} (${apps.length})</button>
          ${APP_STATUSES.map(s=>`<button class="filter-tab" data-filter="${s.key}" style="--fc:${s.color}">${statusLabel(s.key)} (${apps.filter(a=>a.status===s.key).length})</button>`).join('')}
        </div>
      </div>

      <div class="kanban">
        ${APP_STATUSES.map(st => {
          const col = apps.filter(a => a.status === st.key);
          return `<div class="kb-col" data-status="${st.key}">
            <div class="kb-col-h" style="border-top:3px solid ${st.color}">
              <span>${statusLabel(st.key)}</span><span class="kb-count">${col.length}</span>
            </div>
            <div class="kb-cards" data-status="${st.key}">
              ${col.map(a => renderAppCard(a)).join('') || '<div class="kb-empty">—</div>'}
            </div>
          </div>`;
        }).join('')}
      </div>` : renderTrackerEmpty()}
    </div>
  `);

  const form = document.getElementById('trk-form');
  document.getElementById('trk-add').addEventListener('click', () => {
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
  });
  document.getElementById('trk-cancel').addEventListener('click', () => form.style.display = 'none');
  document.getElementById('trk-empty-add')?.addEventListener('click', () => {
    form.style.display = 'block';
    document.getElementById('trk-company')?.focus();
  });

  document.getElementById('trk-save').addEventListener('click', () => {
    const company = document.getElementById('trk-company').value.trim();
    if (!company) { toast(t('tracker.warnCompany')); return; }
    Store.get().applications.push({
      id: uid(), company,
      position:     document.getElementById('trk-position').value.trim(),
      status:       document.getElementById('trk-status').value,
      date:         document.getElementById('trk-date').value || todayISO(),
      followUpDate: document.getElementById('trk-followup').value,
      link:         document.getElementById('trk-link').value.trim(),
      remote:       document.getElementById('trk-remote').value,
      contact:      document.getElementById('trk-contact').value.trim(),
      salary:       document.getElementById('trk-salary').value.trim(),
      jd:           document.getElementById('trk-jd').value.trim(),
      notes:        document.getElementById('trk-notes').value.trim(),
      tailoredSummary: '', tailoredLetter: '',
    });
    Store.save(); toast(t('tracker.added')); viewTracker();
  });

  document.querySelectorAll('[data-move]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = Store.get().applications.find(x => x.id === btn.dataset.id);
      if (!a) return;
      const idx = APP_STATUSES.findIndex(s => s.key === a.status);
      const next = idx + (btn.dataset.move === 'next' ? 1 : -1);
      if (next >= 0 && next < APP_STATUSES.length) { a.status = APP_STATUSES[next].key; Store.save(); viewTracker(); }
    });
  });
  document.querySelectorAll('[data-del-app]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!confirm(t('tracker.confirmDelete'))) return;
      const d = Store.get();
      d.applications = d.applications.filter(a => a.id !== btn.dataset.delApp);
      Store.save(); viewTracker();
    });
  });
  document.querySelectorAll('[data-detail-app]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = Store.get().applications.find(x => x.id === btn.dataset.detailApp);
      if (a) renderAppDetailModal(a);
    });
  });
  document.querySelectorAll('[data-ai-followup]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = Store.get().applications.find(x => x.id === btn.dataset.aiFollowup);
      if (!a) return;
      AI.assist({ title: t('tracker.aiFollowupTitle'), prompt: Prompts.followUp(a), model: AI.SMART });
    });
  });
  document.querySelectorAll('[data-ai-interview]').forEach(btn => {
    btn.addEventListener('click', () => {
      const a = Store.get().applications.find(x => x.id === btn.dataset.aiInterview);
      if (!a) return;
      AI.assist({ title: t('tracker.aiInterviewTitle'), prompt: Prompts.interviewPrep(a), model: AI.SMART, web: true });
    });
  });

  // ── Kanban drag-and-drop between columns ───────────────────────
  let _dragAppId = null;
  document.querySelectorAll('.kb-card[draggable]').forEach(card => {
    card.addEventListener('dragstart', e => {
      _dragAppId = card.dataset.appId;
      e.dataTransfer.effectAllowed = 'move';
      setTimeout(() => card.classList.add('kb-dragging'), 0);
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('kb-dragging');
      document.querySelectorAll('.kb-cards').forEach(c => c.classList.remove('kb-drop-target'));
      _dragAppId = null;
    });
  });
  document.querySelectorAll('.kb-cards').forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      if (_dragAppId) zone.classList.add('kb-drop-target');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('kb-drop-target'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('kb-drop-target');
      if (!_dragAppId) return;
      const newStatus = zone.dataset.status;
      const app = Store.get().applications.find(a => a.id === _dragAppId);
      if (app && app.status !== newStatus) { app.status = newStatus; Store.save(); viewTracker(); }
    });
  });

  // ── Search + filter ─────────────────────────────────────────────
  function applyFilter(query, statusFilter) {
    const q = query.toLowerCase();
    document.querySelectorAll('.kb-card[data-app-id]').forEach(card => {
      const appId = card.dataset.appId;
      const app = Store.get().applications.find(a => a.id === appId);
      if (!app) return;
      const matchesSearch = !q || app.company.toLowerCase().includes(q) || (app.position||'').toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
      card.style.display = (matchesSearch && matchesStatus) ? '' : 'none';
    });
    // Update empty state visibility per column
    document.querySelectorAll('.kb-cards').forEach(zone => {
      const visible = [...zone.querySelectorAll('.kb-card')].filter(c => c.style.display !== 'none');
      let empty = zone.querySelector('.kb-empty-filter');
      if (!visible.length && !zone.querySelector('.kb-empty')) {
        if (!empty) { empty = document.createElement('div'); empty.className='kb-empty kb-empty-filter'; empty.textContent='—'; zone.appendChild(empty); }
      } else if (empty) empty.remove();
    });
  }
  let _trkFilter = 'all';
  document.getElementById('trk-search')?.addEventListener('input', e => {
    applyFilter(e.target.value, _trkFilter);
  });
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      _trkFilter = tab.dataset.filter;
      applyFilter(document.getElementById('trk-search')?.value || '', _trkFilter);
    });
  });
}

function trackerStats(apps) {
  const submitted  = apps.filter(a => ['applied','interview','offer','rejected'].includes(a.status));
  const responses  = apps.filter(a => ['interview','offer','rejected'].includes(a.status));
  const interviews = apps.filter(a => ['interview','offer'].includes(a.status));
  const offers     = apps.filter(a => a.status === 'offer');
  const n = submitted.length;
  const pct = k => n ? Math.round(k / n * 100) : 0;
  const now = Date.now();
  const within = days => apps.filter(a => {
    const d = normalizeDate(a.date); if (!d) return false;
    const diff = (now - new Date(d + 'T00:00:00')) / 864e5;
    return diff >= 0 && diff <= days;
  }).length;
  return {
    submitted: n,
    responses: responses.length,   responseRate: pct(responses.length),
    interviews: interviews.length, interviewRate: pct(interviews.length),
    offers: offers.length,         offerRate: pct(offers.length),
    week: within(7), month: within(30),
    withAI: apps.filter(a => a.tailoredSummary || a.tailoredLetter).length,
  };
}

function renderTrackerInsights(apps) {
  const s = trackerStats(apps);
  const item = (val, lbl, sub, color) =>
    `<div class="funnel-item"><div class="funnel-val"${color?` style="color:${color}"`:''}>${val}</div>`
    + `<div class="funnel-lbl">${lbl}</div>${sub?`<div class="trk-ins-sub">${sub}</div>`:''}</div>`;
  const rc = s.responseRate >= 30 ? '#27ae60' : s.responseRate >= 15 ? '#f0a500' : '#e74c3c';
  return `<div class="card" style="margin-bottom:18px">
    <div class="card-h"><span>${t('tracker.insights')}</span><span class="text-muted text-sm">${s.submitted} ${s.submitted>1?t('tracker.sentN'):t('tracker.sent1')}</span></div>
    <div class="card-b">
      <div class="funnel-row">
        ${item(s.responseRate+'%', t('tracker.responseRate'), `${s.responses}/${s.submitted}`, rc)}
        ${item(s.interviewRate+'%', t('tracker.interviews'), `${s.interviews}/${s.submitted}`, '#2a6fb0')}
        ${item(s.offers, s.offers>1?t('tracker.offerN'):t('tracker.offer1'), s.offerRate+'%', '#27ae60')}
        ${item(s.week, t('tracker.thisWeek'), t('tracker.last7'))}
        ${item(s.month, t('tracker.thisMonth'), t('tracker.last30'))}
        ${item(s.withAI, t('tracker.aiPkg'), '✨')}
      </div>
    </div>
  </div>`;
}

// Friendly empty state: the Tracker is a manual pipeline, not an auto feed —
// explain that and point the user to the ways jobs actually get in here.
function renderTrackerEmpty() {
  return `<div class="card trk-empty">
    <div class="trk-empty-icon">🗂️</div>
    <h3>${t('tracker.emptyTitle')}</h3>
    <p>${t('tracker.emptyBody')}</p>
    <div class="trk-empty-actions">
      <button class="btn btn-accent" onclick="Router.go('#radar')">${t('tracker.emptyRadar')}</button>
      <button class="btn btn-primary" onclick="Router.go('#apply')">${t('tracker.emptyApply')}</button>
      <button class="btn btn-outline" id="trk-empty-add">${t('tracker.emptyManual')}</button>
    </div>
    <p class="trk-empty-hint">${t('tracker.emptyHint')}</p>
  </div>`;
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Insights — analytics to double down on what works
   ════════════════════════════════════════════════════════════════ */
function viewInsights() {
  const apps = Store.get().applications || [];
  const s = trackerStats(apps);
  const today = todayISO();
  const daysSince = iso => { const d = normalizeDate(iso); return d ? Math.floor((Date.now() - new Date(d + 'T00:00:00')) / 864e5) : 1e9; };

  // Activity per week (last 8 weeks)
  const buckets = [];
  for (let i = 7; i >= 0; i--) buckets.push({ off: i, n: apps.filter(a => { const dd = daysSince(a.date); return dd >= i * 7 && dd < (i + 1) * 7; }).length });
  const maxN = Math.max(1, ...buckets.map(b => b.n));

  // Conversion by source
  const submitted = apps.filter(a => ['applied', 'interview', 'offer', 'rejected'].includes(a.status));
  const bySrc = {};
  submitted.forEach(a => {
    const k = a.source || t('insights.direct');
    (bySrc[k] = bySrc[k] || { n: 0, resp: 0 });
    bySrc[k].n++;
    if (['interview', 'offer', 'rejected'].includes(a.status)) bySrc[k].resp++;
  });
  const srcRows = Object.entries(bySrc).sort((a, b) => b[1].n - a[1].n);

  // Needs action: overdue follow-ups + stale applications (applied 14+ days, no reply, no pending follow-up)
  const overdue = apps.filter(a => a.followUpDate && a.followUpDate < today && !['offer', 'rejected'].includes(a.status));
  // daysSince() returns 1e9 for a missing/unparseable date — guard so undated
  // applications aren't wrongly flagged as "stale 14+ days".
  const stale = apps.filter(a => { const ds = daysSince(a.date); return a.status === 'applied' && ds >= 14 && ds < 1e8 && (!a.followUpDate || a.followUpDate < today) && !overdue.includes(a); });
  const actions = [
    ...overdue.map(a => ({ a, kind: t('insights.overdueFollow'), color: '#e74c3c' })),
    ...stale.map(a => ({ a, kind: t('insights.stale'), color: '#f0a500' })),
  ];
  const rateColor = r => r >= 30 ? '#27ae60' : r >= 15 ? '#f0a500' : '#e74c3c';

  setView(`
    <div class="ph">
      <div class="ph-left">
        <div class="ph-title">${t('insights.title')}</div>
        <div class="ph-sub">${t('insights.sub')}</div>
      </div>
      <div class="ph-right"><button class="btn btn-outline" onclick="Router.go('#tracker')">${t('home.seeAll')}</button></div>
    </div>
    <div class="pc">
      ${!apps.length ? `<div class="empty-state"><div class="empty-icon">📊</div><p>${t('insights.empty')}</p></div>` : `
      <div class="g4" style="margin-bottom:20px">
        <div class="stat"><div class="stat-icon">📌</div><div><div class="stat-val">${s.submitted}</div><div class="stat-lbl">${t('insights.applied')}</div></div></div>
        <div class="stat"><div class="stat-icon">📨</div><div><div class="stat-val" style="color:${rateColor(s.responseRate)}">${s.responseRate}%</div><div class="stat-lbl">${t('tracker.responseRate')}</div></div></div>
        <div class="stat"><div class="stat-icon">🎤</div><div><div class="stat-val" style="color:#2a6fb0">${s.interviewRate}%</div><div class="stat-lbl">${t('tracker.interviews')}</div></div></div>
        <div class="stat"><div class="stat-icon">🏆</div><div><div class="stat-val" style="color:#27ae60">${s.offers}</div><div class="stat-lbl">${s.offers > 1 ? t('tracker.offerN') : t('tracker.offer1')}</div></div></div>
      </div>

      <div class="g2" style="margin-bottom:20px">
        <div class="card">
          <div class="card-h"><span>${t('insights.activity')}</span><span class="text-muted text-sm">${t('insights.activitySub')}</span></div>
          <div class="card-b">
            <div class="ins-trend">
              ${buckets.map(b => `<div class="ins-bar-wrap"><span class="ins-bar-n">${b.n}</span><div class="ins-bar" style="height:${Math.round(b.n / maxN * 100)}%"></div><span class="ins-bar-x">${b.off === 0 ? t('insights.wk0') : '-' + b.off}</span></div>`).join('')}
            </div>
          </div>
        </div>
        <div class="card">
          <div class="card-h"><span>${t('insights.bySource')}</span></div>
          <div class="card-b">
            ${srcRows.length ? srcRows.map(([name, v]) => { const rr = Math.round(v.resp / v.n * 100); return `
              <div class="ins-src">
                <div class="ins-src-head"><span class="ins-src-name">${esc(name)}</span><span class="ins-src-meta">${v.n} · ${rr}% ${t('insights.respShort')}</span></div>
                <div class="ins-src-bar"><div class="ins-src-fill" style="width:${rr}%;background:${rateColor(rr)}"></div></div>
              </div>`; }).join('') : `<div class="text-muted text-sm">${t('insights.noSource')}</div>`}
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-h"><span>${t('insights.needsAction')}</span><span class="text-muted text-sm">${actions.length}</span></div>
        <div class="card-b">
          ${actions.length ? actions.slice(0, 12).map(x => `
            <button class="ins-action" onclick="Router.go('#tracker')">
              <span class="ins-action-dot" style="background:${x.color}"></span>
              <span class="ins-action-main"><strong>${esc(x.a.company)}</strong> <span class="text-muted">${esc(x.a.position || '')}</span></span>
              <span class="ins-action-kind" style="color:${x.color}">${x.kind}</span>
              <span class="ta-arrow">→</span>
            </button>`).join('') : `<div class="ins-allclear">${t('insights.allClear')}</div>`}
        </div>
      </div>
      `}
    </div>
  `);
}

function renderAppCard(a) {
  const idx = APP_STATUSES.findIndex(s => s.key === a.status);
  const hasPkg = !!(a.tailoredSummary || a.tailoredLetter);
  const today = todayISO();
  const isOverdue = a.followUpDate && a.followUpDate < today && !['offer','rejected'].includes(a.status);
  const isDueSoon = a.followUpDate && a.followUpDate >= today && a.followUpDate <= new Date(Date.now()+3*864e5).toISOString().slice(0,10);
  return `<div class="kb-card${isOverdue?' kb-overdue':isDueSoon?' kb-due-soon':''}" draggable="true" data-app-id="${a.id}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:4px">
      <div style="min-width:0">
        <div class="kb-card-company">${esc(a.company)}</div>
        <div class="kb-card-pos">${esc(a.position || '—')}</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:3px;align-items:flex-end;flex-shrink:0">
        ${hasPkg ? `<span class="card-badge badge-ai">${t('tracker.badgeAI')}</span>` : ''}
        ${isOverdue ? `<span class="card-badge badge-overdue">${t('tracker.badgeOverdue')}</span>` : isDueSoon ? `<span class="card-badge badge-soon">${t('tracker.badgeSoon')}</span>` : ''}
      </div>
    </div>
    ${a.date ? `<div class="kb-card-meta">📅 ${fmtDate(a.date)}${a.remote?' · '+esc(a.remote):''}</div>` : ''}
    ${a.followUpDate ? `<div class="kb-card-meta" style="color:${isOverdue?'#e74c3c':isDueSoon?'#f0a500':'var(--muted)'}">${t('tracker.followupPrefix')} ${fmtDate(a.followUpDate)}</div>` : ''}
    ${a.contact ? `<div class="kb-card-meta">👤 ${esc(a.contact)}</div>` : ''}
    ${a.link ? `<div class="kb-card-meta"><a href="${esc(a.link)}" target="_blank" rel="noopener">${t('tracker.viewOffer')}</a></div>` : ''}
    ${a.notes ? `<div class="kb-card-notes">${esc(a.notes.slice(0,80))}${a.notes.length>80?'…':''}</div>` : ''}
    <div class="kb-card-actions">
      <button class="btn btn-xs btn-ghost" data-move="prev" data-id="${a.id}" ${idx<=0?'disabled':''}>←</button>
      <button class="btn btn-xs btn-ghost" data-move="next" data-id="${a.id}" ${idx>=APP_STATUSES.length-1?'disabled':''}>→</button>
      <button class="btn btn-xs btn-outline" data-detail-app="${a.id}" style="margin-left:auto">📂</button>
      <button class="btn btn-xs btn-ghost" data-del-app="${a.id}">🗑</button>
    </div>
    <div class="kb-card-ai">
      <button class="btn btn-xs btn-ai" data-ai-followup="${a.id}" style="flex:1">${t('tracker.btnFollowup')}</button>
      <button class="btn btn-xs btn-ai" data-ai-interview="${a.id}" style="flex:1">${t('tracker.btnInterview')}</button>
    </div>
  </div>`;
}

function renderAppDetailModal(a) {
  const st = APP_STATUSES.find(s => s.key === a.status) || APP_STATUSES[0];
  const overlay = document.createElement('div');
  overlay.className = 'app-detail-overlay';
  overlay.innerHTML = `
    <div class="app-detail-dialog">
      <div class="app-detail-head">
        <div>
          <h2>${esc(a.company)}</h2>
          <div style="font-size:13px;opacity:.8">${esc(a.position||t('tracker.internFallback'))}</div>
        </div>
        <span class="status-badge" style="background:${st.color}33;color:${st.color}">${statusLabel(st.key)}</span>
        <button class="app-detail-close" id="apd-close">✕</button>
      </div>
      <div class="app-detail-body">
        <div class="app-detail-meta">
          ${[
            [t('tracker.mCandidature'), fmtDate(a.date)],
            [t('tracker.mFollowup'), a.followUpDate ? `<input type="date" id="apd-followup" value="${esc(a.followUpDate)}" style="font-size:12px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text)">` : `<input type="date" id="apd-followup" style="font-size:12px;padding:2px 6px;border:1px solid var(--border);border-radius:4px;background:var(--bg);color:var(--text)">`],
            [t('tracker.mLink'), a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener" style="color:var(--primary);word-break:break-all">${esc(a.link.slice(0,45))}${a.link.length>45?'…':''}</a>` : '—'],
            [t('tracker.mContact'), a.contact||'—'],
            [t('tracker.mSalary'), a.salary||'—'],
            [t('tracker.mType'), a.remote||'—'],
            [t('tracker.mNotes'), a.notes||'—'],
          ].map(([l,v])=>`<div class="meta-row"><div class="meta-lbl">${l}</div><div class="meta-val">${v||'—'}</div></div>`).join('')}
        </div>
        <div class="app-detail-main">
          ${a.tailoredSummary ? `<div class="app-detail-section"><h4>${t('tracker.tailoredSummary')}</h4><pre>${esc(a.tailoredSummary)}</pre><button class="btn btn-xs btn-ghost" data-copy-txt="${esc(a.tailoredSummary)}" style="margin-top:6px">${t('common.copy')}</button></div>` : ''}
          ${a.tailoredLetter ? `<div class="app-detail-section"><h4>${t('tracker.tailoredLetter')}</h4><pre>${esc(a.tailoredLetter)}</pre><button class="btn btn-xs btn-ghost" data-copy-txt="${esc(a.tailoredLetter)}" style="margin-top:6px">${t('common.copy')}</button></div>` : ''}
          ${a.jd ? `<div class="app-detail-section"><h4>${t('tracker.jdSection')}</h4><pre>${esc(a.jd)}</pre></div>` : ''}
          ${!a.tailoredSummary && !a.tailoredLetter && !a.jd ? `<div style="color:var(--muted);font-size:13px;padding:20px 0">${t('tracker.noPkg')}</div>` : ''}
        </div>
      </div>
      <div class="app-detail-actions">
        <button class="btn btn-ai" id="apd-followup-btn">${t('tracker.aiFollowupTitle')}</button>
        <button class="btn btn-ai" id="apd-interview">${t('tracker.btnPrepInterview')}</button>
        ${a.link ? `<a href="${esc(a.link)}" target="_blank" rel="noopener" class="btn btn-outline">${t('tracker.viewOffer')}</a>` : ''}
        <button class="btn btn-ghost" id="apd-close2" style="margin-left:auto">${t('common.close')}</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#apd-close').addEventListener('click', close);
  overlay.querySelector('#apd-close2').addEventListener('click', close);
  overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
  overlay.querySelectorAll('[data-copy-txt]').forEach(btn => {
    btn.addEventListener('click', () => { navigator.clipboard?.writeText(btn.dataset.copyTxt); toast(t('common.copied')); });
  });
  overlay.querySelector('#apd-followup')?.addEventListener('change', e => {
    const app = Store.get().applications.find(x => x.id === a.id);
    if (app) { app.followUpDate = e.target.value; Store.save(); toast(t('tracker.followupSaved')); }
  });
  overlay.querySelector('#apd-followup-btn')?.addEventListener('click', () => {
    close(); AI.assist({ title: t('tracker.aiFollowupTitle'), prompt: Prompts.followUp(a), model: AI.SMART });
  });
  overlay.querySelector('#apd-interview').addEventListener('click', () => {
    close(); AI.assist({ title: t('tracker.aiInterviewTitle'), prompt: Prompts.interviewPrep(a), model: AI.SMART, web: true });
  });
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Quick Apply — tailor & track in one flow
   ════════════════════════════════════════════════════════════════ */
let _applyState = { company:'', position:'', link:'', remote:'', jd:'', source:'', atsResult:null, pkg:null };

/* Persist the Quick Apply form so a refresh/close doesn't lose a pasted offer. */
const APPLY_DRAFT_KEY = 'career_apply_draft';
const saveApplyDraft = debounce(() => {
  try {
    const { company, position, link, remote, jd, source } = _applyState;
    if (company || position || link || jd) localStorage.setItem(APPLY_DRAFT_KEY, JSON.stringify({ company, position, link, remote, jd, source }));
    else localStorage.removeItem(APPLY_DRAFT_KEY);
  } catch {}
}, 400);
function clearApplyDraft() { try { localStorage.removeItem(APPLY_DRAFT_KEY); } catch {} }
function loadApplyDraft() {
  const empty = !_applyState.company && !_applyState.position && !_applyState.link && !_applyState.jd;
  if (!empty) return;
  try {
    const d = JSON.parse(localStorage.getItem(APPLY_DRAFT_KEY) || 'null');
    if (d) Object.assign(_applyState, d);
  } catch {}
}

function viewApply() {
  loadApplyDraft();
  const st = _applyState;

  setView(`
    <div class="ph">
      <div class="ph-left">
        <div class="ph-title">${t('apply.title')}</div>
        <div class="ph-sub">${t('apply.sub')}</div>
      </div>
    </div>
    <div class="pc">
      <div id="apply-layout">

        <!-- Left: Job Info -->
        <div class="apply-step">
          <h3>${t('apply.jobInfo')}</h3>
          <div class="fr">
            <div class="fg"><label>${t('cv.lblCompany')}</label><input type="text" id="ap-company" value="${esc(st.company)}" placeholder="${t('letters.companyPh')}"></div>
            <div class="fg"><label>${t('apply.targetPosition')}</label><input type="text" id="ap-position" value="${esc(st.position)}" placeholder="${t('apply.positionPh')}"></div>
          </div>
          <div class="fr">
            <div class="fg"><label>${t('tracker.link')}</label><input type="text" id="ap-link" value="${esc(st.link)}" placeholder="https://..."></div>
            <div class="fg"><label>${t('tracker.type')}</label>
              <select id="ap-remote">
                <option value="">—</option>
                ${['Onsite','Hybrid','Remote'].map(v=>`<option${st.remote===v?' selected':''}>${v}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="fg"><label>${t('apply.jdLabel')}</label>
            <textarea id="ap-jd" rows="14" placeholder="${t('apply.jdPh')}">${esc(st.jd)}</textarea>
          </div>
          <div class="btn-group" style="margin-top:4px">
            <button class="btn btn-primary" id="ap-analyze">${t('ats.analyze')}</button>
            <button class="btn btn-ai" id="ap-adapt" ${st.jd.length<40?'disabled':''}>${t('apply.adapt')}</button>
          </div>
        </div>

        <!-- Right: Results -->
        <div id="ap-results">
          ${st.atsResult ? renderApplyResults(st) : `
          <div class="apply-step" style="text-align:center;padding:40px 20px">
            <div style="font-size:40px;margin-bottom:14px">🚀</div>
            <p style="color:var(--muted);line-height:1.7">
              1. ${t('apply.step1')}<br>
              2. ${t('apply.step2')}<br>
              3. ${t('apply.step3')}<br>
              4. ${t('apply.step4')}
            </p>
          </div>`}
        </div>
      </div>
    </div>
  `);

  const readFields = () => {
    _applyState.company  = document.getElementById('ap-company')?.value.trim() || '';
    _applyState.position = document.getElementById('ap-position')?.value.trim() || '';
    _applyState.link     = document.getElementById('ap-link')?.value.trim() || '';
    _applyState.remote   = document.getElementById('ap-remote')?.value || '';
    _applyState.jd       = document.getElementById('ap-jd')?.value.trim() || '';
  };

  // Auto-save a draft as the user types/pastes, so nothing is lost on refresh.
  ['ap-company','ap-position','ap-link','ap-remote','ap-jd'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => { readFields(); saveApplyDraft(); });
  });

  document.getElementById('ap-jd')?.addEventListener('input', () => {
    const jd = document.getElementById('ap-jd').value.trim();
    document.getElementById('ap-adapt').disabled = jd.length < 40;
  });

  document.getElementById('ap-analyze')?.addEventListener('click', () => {
    readFields();
    if (_applyState.jd.length < 40) { toast(t('apply.warnMore')); return; }
    _applyState.atsResult = analyzeATS(_applyState.jd, Store.get().cv);
    document.getElementById('ap-results').innerHTML = renderApplyResults(_applyState);
    bindApplyResults();
  });

  document.getElementById('ap-adapt')?.addEventListener('click', () => {
    readFields();
    if (_applyState.jd.length < 40) { toast(t('apply.warnMore')); return; }
    if (!_applyState.atsResult) _applyState.atsResult = analyzeATS(_applyState.jd, Store.get().cv);
    AI.assist({
      title: t('apply.adaptTitle'),
      prompt: Prompts.adaptPackage(_applyState.company, _applyState.position, _applyState.jd, _applyState.atsResult?.missing),
      model: AI.MAX,
      onApply: async (text) => {
        const pkg = await AI._parseJSONwithRepair(text);
        if (!pkg || !pkg.summary || !pkg.coverLetter) { toast(t('common.notParsable')); return; }
        _applyState.pkg = pkg;
        document.getElementById('ap-results').innerHTML = renderApplyResults(_applyState);
        bindApplyResults();
        toast(t('apply.pkgDone'));
      },
    });
  });

  bindApplyResults();
}

function renderApplyResults(st) {
  const r = st.atsResult;
  const pkg = st.pkg;
  if (!r && !pkg) return '';
  const color = r ? (r.score >= 75 ? '#27ae60' : r.score >= 60 ? '#f0a500' : '#e74c3c') : '';

  return `<div style="display:flex;flex-direction:column;gap:16px">
    ${r ? `<div class="apply-step">
      <h3>${t('apply.atsScore')} — ${r.score}%</h3>
      <div class="apply-score-bar"><div class="apply-score-fill" style="width:${r.score}%;background:${color}"></div></div>
      <div style="font-size:12px;color:var(--muted);margin-bottom:10px">${r.matched.length} ${t('apply.kwMid')} ${r.total} ${t('apply.kwEnd')}</div>
      ${r.missing.length ? `<div><div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">${t('apply.missing')}</div>
        <div class="apply-kw-row">${r.missing.map(k=>`<span class="kw kw-miss">${esc(k.word)}</span>`).join('')}</div></div>` : ''}
      ${r.matched.length > 0 ? `<div style="margin-top:10px"><div style="font-size:11px;font-weight:700;color:var(--muted);margin-bottom:6px">${t('apply.present')}</div>
        <div class="apply-kw-row">${r.matched.slice(0,20).map(k=>`<span class="kw kw-hit">${esc(k.word)}</span>`).join('')}</div></div>` : ''}
    </div>` : ''}

    ${pkg ? `<div class="apply-step">
      <h3>${t('apply.pkgTitle')}</h3>
      ${pkg.positioning ? `<div class="apply-positioning">
        <div class="ap-pos-title">🎯 ${t('apply.positioning')}</div>
        <div class="ap-pos-body">${esc(pkg.positioning).replace(/\n/g,'<br>')}</div>
      </div>` : ''}
      <div class="apply-result-block">
        <label>${t('apply.pkgSummary')} <button class="btn btn-xs btn-ghost" data-copy-pkg="summary">${t('common.copy')}</button></label>
        <textarea id="ap-pkg-summary" rows="4" style="resize:vertical">${esc(pkg.summary)}</textarea>
      </div>
      <div class="apply-result-block">
        <label>${t('apply.pkgLetter')} <button class="btn btn-xs btn-ghost" data-copy-pkg="letter">${t('common.copy')}</button></label>
        <textarea id="ap-pkg-letter" rows="10" style="resize:vertical">${esc(pkg.coverLetter)}</textarea>
      </div>
      <button class="btn btn-primary" id="ap-save-tracker" style="width:100%">${t('apply.saveTracker')}</button>
    </div>` : (r ? `<div class="apply-step">
      <div style="text-align:center;padding:16px 0;color:var(--muted);font-size:13px">
        ${t('apply.adaptHint')}
      </div>
    </div>` : '')}
  </div>`;
}

function bindApplyResults() {
  document.querySelectorAll('[data-copy-pkg]').forEach(btn => {
    btn.addEventListener('click', () => {
      const key = btn.dataset.copyPkg === 'summary' ? 'ap-pkg-summary' : 'ap-pkg-letter';
      const val = document.getElementById(key)?.value || '';
      navigator.clipboard?.writeText(val);
      toast(t('common.copiedClip'));
    });
  });

  document.getElementById('ap-save-tracker')?.addEventListener('click', () => {
    const st = _applyState;
    const summary = document.getElementById('ap-pkg-summary')?.value.trim() || st.pkg?.summary || '';
    const letter  = document.getElementById('ap-pkg-letter')?.value.trim() || st.pkg?.coverLetter || '';
    if (!st.company) { toast(t('apply.warnCompany')); return; }
    Store.get().applications.push({
      id: uid(), company: st.company, position: st.position,
      status: 'applied',
      date:   todayISO(),
      link:   st.link, remote: st.remote, contact: '', salary: '',
      jd:     st.jd, notes: '', source: st.source || '',
      tailoredSummary: summary,
      tailoredLetter:  letter,
    });
    Store.save();
    clearApplyDraft();
    _applyState = { company:'', position:'', link:'', remote:'', jd:'', source:'', atsResult:null, pkg:null };
    toast(t('apply.savedToast'));
    Router.go('#tracker'); viewTracker();
  });
}

/* ════════════════════════════════════════════════════════════════
   VIEW: Job Radar — curated job board links
   ════════════════════════════════════════════════════════════════ */
// Curated boards for markets the free live feed can't reach (Gulf, Ireland, on-site).
// Links with a `q` template become query-aware: clicking them searches the user's CURRENT
// Radar query ({q}=URL-encoded, {qs}=slug) instead of a hardcoded "network security".
const JOB_BOARDS = [
  {
    group: '🇹🇳 Tunisia', links: [
      { name: 'Keejob — IT & Networks', url: 'https://www.keejob.com/offres-emploi/?sector=4', tags: ['net','sec'] },
      { name: 'Bayt — Tunisia', url: 'https://www.bayt.com/en/tunisia/jobs/network-security-jobs/', q: 'https://www.bayt.com/en/tunisia/jobs/{qs}-jobs/', tags: ['net','sec'] },
      { name: 'TanitJobs — IT', url: 'https://tanitjobs.com/', tags: ['net','dev'] },
      { name: 'LinkedIn — Tunisia', url: 'https://www.linkedin.com/jobs/search/?keywords=network%20security&location=Tunisia', q: 'https://www.linkedin.com/jobs/search/?keywords={q}&location=Tunisia', tags: ['sec'] },
    ],
  },
  {
    group: '🌐 Gulf — English + Arabic', links: [
      { name: 'Bayt — UAE', url: 'https://www.bayt.com/en/uae/jobs/network-security-jobs/', q: 'https://www.bayt.com/en/uae/jobs/{qs}-jobs/', tags: ['net','sec'] },
      { name: 'Indeed UAE', url: 'https://ae.indeed.com/jobs?q=network+security', q: 'https://ae.indeed.com/jobs?q={q}', tags: ['net','sec'] },
      { name: 'LinkedIn — UAE', url: 'https://www.linkedin.com/jobs/search/?keywords=cybersecurity&location=United%20Arab%20Emirates', q: 'https://www.linkedin.com/jobs/search/?keywords={q}&location=United%20Arab%20Emirates', tags: ['sec'] },
      { name: 'LinkedIn — Saudi', url: 'https://www.linkedin.com/jobs/search/?keywords=network%20engineer&location=Saudi%20Arabia', q: 'https://www.linkedin.com/jobs/search/?keywords={q}&location=Saudi%20Arabia', tags: ['net'] },
      { name: 'Naukrigulf — IT & Security', url: 'https://www.naukrigulf.com/', tags: ['net','sec'] },
    ],
  },
  {
    group: '🇮🇪 Ireland · 🇬🇧 UK · 🇨🇦 Canada', links: [
      { name: 'Indeed Ireland', url: 'https://ie.indeed.com/jobs?q=network+security', q: 'https://ie.indeed.com/jobs?q={q}', tags: ['net','sec'] },
      { name: 'Indeed UK', url: 'https://uk.indeed.com/jobs?q=network+security', q: 'https://uk.indeed.com/jobs?q={q}', tags: ['net','sec'] },
      { name: 'Indeed Canada', url: 'https://ca.indeed.com/jobs?q=network+security', q: 'https://ca.indeed.com/jobs?q={q}', tags: ['net','sec'] },
      { name: 'LinkedIn — Ireland', url: 'https://www.linkedin.com/jobs/search/?keywords=security%20engineer&location=Ireland', q: 'https://www.linkedin.com/jobs/search/?keywords={q}&location=Ireland', tags: ['sec'] },
    ],
  },
  {
    group: '🛂 Visa Sponsorship / Relocation', links: [
      { name: 'Relocate.me — Jobs with relocation', url: 'https://relocate.me/', tags: ['vis','net'] },
      { name: 'Arbeitnow — Visa Sponsorship', url: 'https://www.arbeitnow.com/visa-sponsorship-jobs', tags: ['vis','dev'] },
      { name: 'Landing.jobs — Europe (visa filter)', url: 'https://landing.jobs/jobs?visa=true', tags: ['vis','dev'] },
      { name: 'Make it in Germany (English jobs)', url: 'https://www.make-it-in-germany.com/en/looking-for-foreign-professionals/jobs', tags: ['vis'] },
      { name: 'LinkedIn — Visa Sponsorship', url: 'https://www.linkedin.com/jobs/search/?keywords=cybersecurity%20visa%20sponsorship', q: 'https://www.linkedin.com/jobs/search/?keywords={q}%20visa%20sponsorship', tags: ['vis','sec'] },
    ],
  },
  {
    group: '🔒 Network & Security — Remote / Global', links: [
      { name: 'infosec-jobs.com — Security only', url: 'https://infosec-jobs.com/', q: 'https://infosec-jobs.com/?search={q}', tags: ['sec'] },
      { name: 'LinkedIn — Remote', url: 'https://www.linkedin.com/jobs/search/?keywords=network%20security&f_WT=2', q: 'https://www.linkedin.com/jobs/search/?keywords={q}&f_WT=2', tags: ['net','sec'] },
      { name: 'Indeed — Global', url: 'https://www.indeed.com/jobs?q=network+security', q: 'https://www.indeed.com/jobs?q={q}', tags: ['net','sec'] },
      { name: 'LinkedIn — Cloud Security (Remote)', url: 'https://www.linkedin.com/jobs/search/?keywords=cloud%20security&f_WT=2', q: 'https://www.linkedin.com/jobs/search/?keywords={q}&f_WT=2', tags: ['cloud','sec'] },
      { name: 'CyberSeek — Career Pathway', url: 'https://www.cyberseek.org/pathway.html', tags: ['sec'] },
    ],
  },
];

// Fill a board link's query template with the current Radar query (else its default URL).
function boardUrl(l) {
  const q = (_radar.query || '').trim();
  if (!l.q || !q) return l.url;
  return l.q.replace('{q}', encodeURIComponent(q))
            .replace('{qs}', q.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''));
}

const TAG_LABELS = { net:'Network', sec:'Security', cloud:'Cloud', dev:'Dev', vis:'Visa', int:'Internship', web:'Web', mob:'Mobile' };

/* ── Live job feed (fetched through the bridge proxy) ───────────── */
// Quick-search chips are now derived from the user's CV at render time — see cvChips().
const RADAR_SOURCES = [
  { key:'remotive',  label:'Remotive',  tipKey:'radar.srcRemotive' },
  { key:'remoteok',  label:'RemoteOK',  tipKey:'radar.srcRemoteok' },
  { key:'arbeitnow', label:'Arbeitnow', tipKey:'radar.srcArbeitnow' },
  { key:'jobicy',    label:'Jobicy',    tipKey:'radar.srcJobicy' },
  { key:'themuse',   label:'The Muse',  tipKey:'radar.srcThemuse' },
  { key:'himalayas', label:'Himalayas', tipKey:'radar.srcHimalayas' },
  { key:'adzuna',    label:'Adzuna',    tipKey:'radar.srcAdzuna' },
];
let _radar = {
  jobs: [], query: '', loading: false, error: '', errors: [], cached: false,   // query set from the CV at boot (cvQuery)
  fetched: false, intern: false, remoteOnly: false, visaOnly: false,
  english: false, regions: [],   // synced from Store.radar at boot (persisted prefs)
  sources: { remotive: true, remoteok: true, arbeitnow: true, jobicy: true, themuse: true, himalayas: true, adzuna: true },
};

// Region/country filter chips (match the bridge's REGION_RE keys).
const RADAR_REGIONS = [
  { key: 'remote',      labelKey: 'region.remote' },
  { key: 'gulf',        labelKey: 'region.gulf' },
  { key: 'ireland',     labelKey: 'region.ireland' },
  { key: 'uk',          labelKey: 'region.uk' },
  { key: 'canada',      labelKey: 'region.canada' },
  { key: 'usa',         labelKey: 'region.usa' },
  { key: 'germany',     labelKey: 'region.germany' },
  { key: 'netherlands', labelKey: 'region.netherlands' },
  { key: 'europe',      labelKey: 'region.europe' },
  { key: 'tunisia',     labelKey: 'region.tunisia' },
];

// URLs of jobs already saved to the tracker — used to flag "already tracked" in the feed.
function trackedJobUrls() {
  return new Set((Store.get().applications || []).map(a => (a.link || '').trim()).filter(Boolean));
}

function jobAge(iso) {
  if (!iso) return '';
  const days = Math.floor((Date.now() - new Date(iso + 'T00:00:00')) / 864e5);
  if (isNaN(days)) return '';
  return days <= 0 ? t('age.today') : days === 1 ? t('age.yesterday') : days < 30 ? days + ' ' + t('age.days') : Math.floor(days/30) + ' ' + t('age.months');
}

const SOURCE_COLORS = { Remotive:'#7b4dff', RemoteOK:'#ff4742', Arbeitnow:'#0a8a5f', Jobicy:'#e8a400', 'The Muse':'#e0407f', Himalayas:'#0a8acc', Adzuna:'#1ba84f' };
const ALL_SOURCE_KEYS = RADAR_SOURCES.map(s => s.key);

/* ── Proactive Radar — saved searches + "new since last visit" ───── */
function radarStore() { return Store.get().radar; }

// A job is "new" if its URL has never been folded into the seen-memory.
function radarIsNew(url) { return !!url && !radarStore().seen[url]; }

// Remember the jobs the user has now seen (so they stop counting as new). Pruned to a cap.
function radarMarkSeen(jobs) {
  const rs = radarStore();
  const now = Date.now();
  jobs.forEach(j => { if (j.url) rs.seen[j.url] = now; });
  const entries = Object.entries(rs.seen);
  if (entries.length > 1500) {
    entries.sort((a, b) => b[1] - a[1]);
    rs.seen = Object.fromEntries(entries.slice(0, 1500));
  }
  Store.save();
}

function radarSaveCurrentSearch() {
  const rs = radarStore();
  const q = (_radar.query || '').trim();
  if (!q) return;
  if (rs.saved.find(s => s.q.toLowerCase() === q.toLowerCase())) { toast(t('radar.savedAlready')); return; }
  rs.saved.unshift({ q, intern: !!_radar.intern, visa: !!_radar.visaOnly });
  rs.saved = rs.saved.slice(0, 8);
  Store.save();
  renderSavedSearches();
  toast(t('radar.searchSaved'));
  radarCheckNew();
}

function radarRemoveSaved(q) {
  const rs = radarStore();
  rs.saved = rs.saved.filter(s => s.q.toLowerCase() !== String(q).toLowerCase());
  Store.save();
  renderSavedSearches();
  radarCheckNew();
}

// Show/hide the count badge on the Job Radar nav link.
function radarSetNavBadge(n) {
  const badge = document.getElementById('nav-radar-badge');
  if (!badge) return;
  if (n > 0) { badge.textContent = n > 99 ? '99+' : String(n); badge.hidden = false; }
  else badge.hidden = true;
}

let _radarChecking = false;
// Count jobs across saved searches the user hasn't seen yet → nav badge. Needs the bridge.
async function radarCheckNew({ silent = true } = {}) {
  const rs = radarStore();
  if (!rs.saved.length) { rs.newCount = 0; Store.save(); radarSetNavBadge(0); return; }
  if (_radarChecking) return;
  _radarChecking = true;
  if (!silent) toast(t('radar.checkingNew'));
  try {
    const alive = await AI._health();
    if (!alive) { radarSetNavBadge(rs.newCount || 0); if (!silent) toast(t('radar.noBridgeShort')); return; }
    const newUrls = new Set();
    const bySearch = {};   // q → how many new jobs that saved search has (so the view can explain the badge)
    await Promise.all(rs.saved.slice(0, 8).map(async s => {
      try {
        const params = new URLSearchParams({ q: s.q, sources: ALL_SOURCE_KEYS.join(',') });
        if (s.intern) params.set('intern', '1');
        if (s.visa) params.set('visa', '1');
        if (_radar.english) params.set('english', '1');
        if (_radar.regions.length) params.set('regions', _radar.regions.join(','));
        const ctrl = new AbortController();
        const tm = setTimeout(() => ctrl.abort(), 12000);   // never let a hung fetch freeze the badge check
        let j;
        try { const r = await fetch(AI.BRIDGE + '/jobs?' + params, { signal: ctrl.signal }); j = await r.json(); }
        finally { clearTimeout(tm); }
        let c = 0;
        (j.jobs || []).forEach(job => { if (job.url && !rs.seen[job.url]) { newUrls.add(job.url); c++; } });
        if (c) bySearch[s.q] = c;
      } catch {}
    }));
    rs.newCount = newUrls.size;
    rs.newBySearch = bySearch;
    Store.save();
    radarSetNavBadge(rs.newCount);
    if (!silent) toast(rs.newCount ? '🔔 ' + rs.newCount + ' ' + t('radar.newWord') : t('radar.noNew'));
  } finally { _radarChecking = false; }
}
const _radarBadgeRefresh = debounce(() => radarCheckNew(), 900);

async function radarFetch() {
  const srcs = Object.entries(_radar.sources).filter(([,v]) => v).map(([k]) => k);
  if (!srcs.length) { _radar.error = t('radar.selectSrc'); _radar.jobs = []; renderRadarFeed(); return; }
  _radar.loading = true; _radar.error = ''; renderRadarFeed();
  // Remember this search so the Radar reopens on it next time (instead of the CV default).
  const _rs = Store.get().radar; if (_rs.lastQuery !== _radar.query) { _rs.lastQuery = _radar.query; Store.save(); }
  try {
    const params = new URLSearchParams({ q: _radar.query, sources: srcs.join(',') });
    if (_radar.intern) params.set('intern', '1');
    if (_radar.visaOnly) params.set('visa', '1');
    if (_radar.english) params.set('english', '1');
    if (_radar.regions.length) params.set('regions', _radar.regions.join(','));
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 30000);
    const r = await fetch(AI.BRIDGE + '/jobs?' + params, { signal: ctrl.signal });
    clearTimeout(timer);
    const j = await r.json();
    if (!j.ok) throw new Error(j.error || 'bridge error');
    _radar.jobs = j.jobs || [];
    // Local CV-fit: score each job by overlap with the user's CV skills (free, no quota).
    const matchers = cvSkillMatchers();
    _radar.jobs.forEach(job => {
      job._isNew = radarIsNew(job.url);   // flag before marking seen
      const f = jobFit(job, matchers);
      job._fit = f ? f.pct : null;
      job._fitMatched = f ? f.matched : [];
    });
    // Best CV-fit first (stable sort keeps the bridge's relevance order on ties).
    _radar.jobs.sort((a, b) => (b._fit ?? -1) - (a._fit ?? -1));
    _radar.errors = j.errors || [];
    _radar.cached = !!j.cached;
    _radar.fetched = true;
    _radar.aiRanked = false;   // fresh results — clear any previous AI ranking
    _radar.market = '';        // clear any previous AI market read
    if (!_radar.jobs.length) _radar.error = t('radar.none');
  } catch (e) {
    _radar.jobs = []; _radar.errors = [];
    _radar.error = e.name === 'AbortError' ? t('radar.timeout') : t('radar.noBridge');
  } finally {
    _radar.loading = false; renderRadarFeed();
    if (_radar.jobs.length) {
      radarMarkSeen(_radar.jobs);     // these are now "seen" → won't count as new next time
      _radarBadgeRefresh();           // recompute the nav badge (debounced, cache-backed)
      if (radarStore().autoMatch && !_radar.aiRanked) radarAIMatch({ auto: true });
    }
  }
}

function renderRadarFeed() {
  const el = document.getElementById('radar-feed');
  if (!el) return;

  if (_radar.loading) {
    el.innerHTML = `<div class="radar-loading"><div class="spinner"></div> ${t('radar.loading')}</div>`;
    return;
  }
  if (_radar.error && !_radar.jobs.length) {
    el.innerHTML = `<div class="radar-msg">${_radar.error}</div>`;
    return;
  }
  if (!_radar.fetched) {
    el.innerHTML = `<div class="radar-msg">${t('radar.notLaunched')}</div>`;
    return;
  }

  const tracked = trackedJobUrls();
  const shown = _radar.remoteOnly ? _radar.jobs.filter(j => j.remote) : _radar.jobs;

  const matchColor = s => s >= 80 ? '#27ae60' : s >= 60 ? '#f0a500' : '#6c757d';
  const fitColor = s => s >= 70 ? '#27ae60' : s >= 45 ? '#f0a500' : '#8a94a6';

  el.innerHTML = `
    <div class="radar-feed-head">
      <span><strong>${shown.length}</strong> ${shown.length>1?t('radar.offerN'):t('radar.offer1')} — “${esc(_radar.query)}”${_radar.intern?t('radar.internSuffix'):''} ${_radar.cached?`<span class="radar-cache">${t('radar.cachedNote')}</span>`:''}${_radar.aiRanked?` <span class="radar-cache">· ${t('radar.aiRanked')}</span>`:''}</span>
      ${shown.length ? `<span class="radar-feed-actions">
        ${_radar.aiRanked?`<button class="btn btn-xs btn-ghost" id="radar-aiclear">${t('radar.aiClear')}</button>`:''}
        <button class="btn btn-xs btn-ai" id="radar-aimatch">${t('radar.aiMatch')}</button>
      </span>` : ''}
    </div>
    ${_radar.errors && _radar.errors.length ? `<div class="radar-srcerr">${t('radar.sourceErr')} ${esc(_radar.errors.map(e=>String(e).split(':')[0]).join(', '))}</div>` : ''}
    ${renderRadarInsights(shown)}
    ${shown.length === 0 ? `<div class="radar-msg">${t('radar.none')}</div>` : ''}
    <div class="job-grid">
      ${shown.map((j) => {
        const i = _radar.jobs.indexOf(j);
        const isTracked = tracked.has((j.url || '').trim());
        return `
        <div class="job-card${isTracked?' job-tracked':''}${j.aiScore!=null?' job-matched':''}">
          <div class="job-card-top">
            <span style="display:flex;align-items:center;gap:6px">
              <span class="job-src" style="--sc:${SOURCE_COLORS[j.source]||'#888'}">${esc(j.source)}</span>
              ${j.lang&&j.lang!=='en'?`<span class="job-lang" title="${esc(t('radar.langTip'))}">${esc(j.lang.toUpperCase())}</span>`:''}
              ${j._isNew?`<span class="job-new" title="${esc(t('radar.newTip'))}">${t('radar.newBadge')}</span>`:''}
            </span>
            <span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;justify-content:flex-end">
              ${j._fit!=null?`<span class="job-fit" style="--fc:${fitColor(j._fit)}" title="${esc(t('radar.fitTip'))}${j._fitMatched&&j._fitMatched.length?': '+esc(j._fitMatched.join(', ')):''}">🧩 ${j._fit}%</span>`:''}
              ${j.aiScore!=null?`<span class="job-match" style="--mc:${matchColor(j.aiScore)}" title="${esc(t('radar.matchTip'))}">🎯 ${j.aiScore}%</span>`:''}
              ${j.visa?`<span class="job-visa" title="${esc(t('radar.visaTip'))}">${t('radar.visaBadge')}</span>`:''}
              ${j.remote?`<span class="job-remote">${t('radar.remoteBadge')}</span>`:''}
              ${j.date ? `<span class="job-age">${jobAge(j.date)}</span>` : ''}
            </span>
          </div>
          <div class="job-title">${esc(j.title)}</div>
          <div class="job-company">${esc(j.company)}${j.location?` · <span class="job-loc">${esc(j.location)}</span>`:''}</div>
          ${j.salary?`<div class="job-salary">💰 ${esc(j.salary)}</div>`:''}
          ${j.aiReason?`<div class="job-reason">💡 ${esc(j.aiReason)}</div>`:''}
          ${j.tags && j.tags.length ? `<div class="job-tags">${j.tags.slice(0,5).map(tag=>`<span class="job-tag">${esc(tag)}</span>`).join('')}</div>` : ''}
          <div class="job-actions">
            <button class="btn btn-xs btn-ai" data-job-adapt="${i}" style="flex:1">${t('radar.adapt')}</button>
            ${isTracked
              ? `<span class="job-tracked-badge" title="${esc(t('radar.trackedTip'))}">${t('radar.tracked')}</span>`
              : `<button class="btn btn-xs btn-outline" data-job-save="${i}" title="${esc(t('radar.saveTip'))}">${t('radar.save')}</button>`}
            <a href="${esc(j.url)}" target="_blank" rel="noopener" class="btn btn-xs btn-outline" title="${esc(t('radar.view'))}">🔗</a>
          </div>
        </div>`;
      }).join('')}
    </div>`;

  el.querySelectorAll('[data-job-adapt]').forEach(btn => {
    btn.addEventListener('click', () => radarAdapt(Number(btn.dataset.jobAdapt)));
  });
  el.querySelectorAll('[data-job-save]').forEach(btn => {
    btn.addEventListener('click', () => radarSave(Number(btn.dataset.jobSave)));
  });
  document.getElementById('radar-aimatch')?.addEventListener('click', radarAIMatch);
  document.getElementById('radar-market')?.addEventListener('click', radarMarketRead);
  el.querySelectorAll('.ins-skill[data-skill]').forEach(b => {
    b.addEventListener('click', e => { e.stopPropagation(); radarSkillMenu(b); });
  });
  document.getElementById('radar-aiclear')?.addEventListener('click', () => {
    _radar.jobs.forEach(j => { j.aiScore = null; j.aiReason = ''; });
    _radar.aiRanked = false;
    renderRadarFeed();
  });
}

// ── Radar insights: read the whole loaded result set (free, client-side) ──────────
// Which in-demand skills appear across the loaded postings, split into the ones the
// user already has (in their CV) vs the ones they're missing (CV gaps).
function radarSkillDemand(shown) {
  const texts = shown.map(j => normText((j.title || '') + ' ' + (j.tags || []).join(' ') + ' ' + (j.description || '')));
  const cvText = cvFullText(Store.get().cv);
  const have = [], missing = [];
  SKILL_VOCAB.forEach(sk => {
    const needle = ' ' + sk + ' ';
    let df = 0;                       // document frequency = how many jobs mention it
    for (const tx of texts) if (tx.includes(needle)) df++;
    if (!df) return;
    (cvText.includes(needle) ? have : missing).push({ sk, df });
  });
  have.sort((a, b) => b.df - a.df); missing.sort((a, b) => b.df - a.df);
  return { have: have.slice(0, 8), missing: missing.slice(0, 10) };
}

// Summary strip + skill demand/gaps + an on-demand AI market read button.
function renderRadarInsights(shown) {
  if (!shown.length) return '';
  const fits = shown.map(j => j._fit).filter(v => v != null);
  const strong = fits.filter(v => v >= 70).length;
  const partial = fits.filter(v => v >= 45 && v < 70).length;
  const low = fits.filter(v => v < 45).length;
  const avg = fits.length ? Math.round(fits.reduce((a, b) => a + b, 0) / fits.length) : 0;
  const remote = shown.filter(j => j.remote).length;
  const visa = shown.filter(j => j.visa).length;
  const salary = shown.filter(j => j.salary).length;
  const loc = new Map();
  shown.forEach(j => { const k = (j.location || '').trim() || (j.remote ? t('radar.remoteBadge') : '—'); loc.set(k, (loc.get(k) || 0) + 1); });
  const topLoc = [...loc.entries()].filter(([k]) => k !== '—').sort((a, b) => b[1] - a[1]).slice(0, 3);
  const dem = radarSkillDemand(shown);
  const chip = (d, cls, have) => `<button type="button" class="ins-skill ${cls}" data-skill="${esc(d.sk)}" data-have="${have ? 1 : 0}" title="${esc(t('radar.skTip'))}">${esc(d.sk)} <b>${d.df}</b></button>`;

  return `<div class="radar-ins">
    <div class="radar-ins-row">
      <span class="ins-stat"><span class="ins-fitlbl">${t('radar.insFitLabel')}</span>
        <span class="ins-dot" style="--c:#27ae60"></span>${strong} ${t('radar.insStrong')}
        <span class="ins-dot" style="--c:#f0a500"></span>${partial} ${t('radar.insPartial')}
        <span class="ins-dot" style="--c:#8a94a6"></span>${low} ${t('radar.insLow')}
        · ${t('radar.insAvg')} <b>${avg}%</b></span>
      <span class="ins-sep"></span>
      <span class="ins-stat">🌍 <b>${remote}</b> ${t('radar.insRemote')}</span>
      <span class="ins-stat">🛂 <b>${visa}</b> ${t('radar.insVisa')}</span>
      <span class="ins-stat">💰 <b>${salary}</b> ${t('radar.insSalary')}</span>
      ${topLoc.length ? `<span class="ins-sep"></span><span class="ins-stat">📍 ${topLoc.map(([k, n]) => `${esc(k)} (${n})`).join(' · ')}</span>` : ''}
    </div>
    ${(dem.have.length || dem.missing.length) ? `
    <div class="radar-ins-skills">
      ${dem.have.length ? `<div class="ins-skill-line"><span class="ins-skill-lbl">✅ ${t('radar.insHave')}</span>${dem.have.map(d => chip(d, 'ins-have', true)).join('')}</div>` : ''}
      ${dem.missing.length ? `<div class="ins-skill-line"><span class="ins-skill-lbl">⬜ ${t('radar.insMissing')}</span>${dem.missing.map(d => chip(d, 'ins-miss', false)).join('')}</div>` : ''}
    </div>` : `<div class="radar-ins-skills text-muted text-sm">${t('radar.insNoSkills')}</div>`}
    <div class="radar-ins-market">
      <button class="btn btn-xs btn-ai" id="radar-market">${t('radar.insMarket')}</button>
      <span class="ins-market-hint">${t('radar.insMarketHint')}</span>
      <div id="radar-market-out" class="ins-market-out"${_radar.market ? '' : ' hidden'}>${_radar.market ? esc(_radar.market) : ''}</div>
    </div>
  </div>`;
}

// Click a skill chip → small action menu (find jobs / learn / add a missing skill to the CV).
function radarSkillMenu(btn) {
  document.querySelectorAll('.sk-menu').forEach(m => m.remove());   // close any open menu
  const skill = btn.dataset.skill;
  const have = btn.dataset.have === '1';
  const items = [`<button type="button" class="sk-menu-item" data-act="find">${t('radar.skFind')}</button>`,
                 `<button type="button" class="sk-menu-item" data-act="learn">${t('radar.skLearn')}</button>`];
  if (!have) items.push(`<button type="button" class="sk-menu-item" data-act="add">${t('radar.skAddCv')}</button>`);
  const menu = document.createElement('div');
  menu.className = 'sk-menu';
  menu.innerHTML = `<div class="sk-menu-h">${esc(skill)}</div>${items.join('')}`;
  document.body.appendChild(menu);
  const r = btn.getBoundingClientRect();
  menu.style.top = (window.scrollY + r.bottom + 4) + 'px';
  menu.style.left = Math.max(8, Math.min(window.scrollX + r.left, window.scrollX + document.documentElement.clientWidth - menu.offsetWidth - 12)) + 'px';
  const close = () => { menu.remove(); document.removeEventListener('click', close); };
  setTimeout(() => document.addEventListener('click', close), 0);
  menu.querySelector('[data-act="find"]').addEventListener('click', () => { close(); radarSkillFind(skill); });
  menu.querySelector('[data-act="learn"]').addEventListener('click', () => { close(); window.open('https://www.google.com/search?q=' + encodeURIComponent(skill + ' course certification tutorial'), '_blank', 'noopener'); });
  menu.querySelector('[data-act="add"]')?.addEventListener('click', () => { close(); radarSkillAddToCv(skill); });
}

// Re-aim the Radar search at a single skill.
function radarSkillFind(skill) {
  _radar.query = skill;
  const q = document.getElementById('radar-q'); if (q) q.value = skill;
  document.querySelectorAll('.radar-chip').forEach(c => c.classList.toggle('active', c.dataset.chip === skill));
  radarFetch();
}

// "I already have this" → add an in-demand skill the matcher didn't find to the CV (first category).
function radarSkillAddToCv(skill) {
  const cv = Store.get().cv;
  const cat = (cv.skills || [])[0];
  if (!cat) { toast(t('radar.skNoCat')); return; }
  if (!Array.isArray(cat.items)) cat.items = [];
  if (cat.items.some(i => (i.text || '').toLowerCase() === skill.toLowerCase())) { toast(t('radar.skDup')); return; }
  const display = prettySkill(skill);   // write a professionally-cased label, not the lowercase detection form
  cat.items.push({ id: uid(), text: display, hidden: false });
  Store.save();
  toast(`✅ "${display}" ${t('radar.skAddedToast')} (${cat.category})`);
  renderRadarFeed();   // re-render so the chip flips from ⬜ missing → ✅ have
}

// AI market read: Claude summarises the loaded jobs vs the user's profile (bridge, fallback modal).
async function radarMarketRead() {
  if (!_radar.jobs.length) { toast(t('radar.aiNeedJobs')); return; }
  const shown = _radar.remoteOnly ? _radar.jobs.filter(j => j.remote) : _radar.jobs;
  const prompt = Prompts.marketRead(shown.slice(0, 25));
  const apply = txt => { _radar.market = String(txt || '').trim(); renderRadarFeed(); };

  let alive = false;
  try { alive = _bridgeOk === true ? true : await AI._health(); } catch {}
  const btn = document.getElementById('radar-market');
  if (alive) {
    if (btn) { btn.disabled = true; btn.textContent = t('radar.insMarketRun'); }
    try { apply(await AI._generate(prompt, AI.SMART)); }
    catch (e) { toast(t('ai.bridgeErrPre') + (e.message || e)); if (btn) { btn.disabled = false; btn.textContent = t('radar.insMarket'); } }
  } else {
    AI.assist({ title: t('radar.insMarket'), prompt, onApply: async (text) => apply(text) });
  }
}

// Ask Claude to rank the loaded jobs against the CV profile (bridge, with copy-paste fallback).
// opts.auto = triggered automatically after a fetch → stay silent if the bridge is off.
async function radarAIMatch(opts = {}) {
  if (!_radar.jobs.length) { if (!opts.auto) toast(t('radar.aiNeedJobs')); return; }
  const prompt = Prompts.matchJobs(_radar.jobs.slice(0, 30));

  const applyRanking = async (text) => {
    const arr = await AI._parseJSONwithRepair(text);
    if (!Array.isArray(arr)) return false;
    _radar.jobs.forEach(j => { j.aiScore = null; j.aiReason = ''; });
    arr.forEach(m => {
      const j = _radar.jobs[m.i];
      if (j && m.score != null) {
        j.aiScore = Math.max(0, Math.min(100, Math.round(Number(m.score)) || 0));
        j.aiReason = String(m.reason || '').slice(0, 120);
      }
    });
    _radar.aiRanked = true;
    _radar.jobs.sort((a, b) => (b.aiScore ?? -1) - (a.aiScore ?? -1));
    renderRadarFeed();
    toast(t('radar.aiMatchDone'));
    return true;
  };

  const btn = document.getElementById('radar-aimatch');
  let alive = false;
  // Trust the status pill's _bridgeOk (polled every 25s) instead of an extra /health ping.
  try { if (btn) { btn.disabled = true; btn.textContent = t('radar.aiMatching'); } alive = _bridgeOk === true ? true : await AI._health(); } catch {}

  if (alive) {
    try {
      const text = await AI._generate(prompt, AI.SMART);
      if (!(await applyRanking(text))) toast(t('common.notParsable'));
    } catch (e) {
      if (!opts.auto) toast(t('ai.bridgeErrPre') + (e.message || e));   // stay silent in auto mode
    } finally {
      renderRadarFeed();   // restores the button (and shows ranking if applied)
    }
  } else if (!opts.auto) {
    // Bridge off → copy-paste modal; onApply parses the JSON and ranks.
    renderRadarFeed();
    AI.assist({ title: t('radar.aiMatchTitle'), prompt, onApply: async (text) => { if (!(await applyRanking(text))) toast(t('common.notParsable')); } });
  } else {
    renderRadarFeed();   // auto mode + bridge off → silently restore the button
  }
}

function radarAdapt(idx) {
  const j = _radar.jobs[idx];
  if (!j) return;
  _applyState = {
    company: j.company, position: j.title, link: j.url,
    remote: j.remote ? 'Remote' : '',
    jd: j.description || '', source: j.source || '', atsResult: null, pkg: null,
  };
  saveApplyDraft();
  toast(t('radar.loadedToast'));
  Router.go('#apply'); viewApply();
}

// Quick-shortlist a job into the tracker as "wishlist" (no AI tailoring) for later triage.
function radarSave(idx) {
  const j = _radar.jobs[idx];
  if (!j) return;
  Store.get().applications.push({
    id: uid(), company: j.company, position: j.title,
    status: 'wishlist', date: todayISO(),
    link: j.url, remote: j.remote ? 'Remote' : '', contact: '', salary: j.salary || '',
    jd: j.description || '', notes: '', source: j.source || '', tailoredSummary: '', tailoredLetter: '', followUpDate: '',
  });
  Store.save();
  toast(t('radar.savedToast2'));
  renderRadarFeed();   // refresh so the card flips to "tracked"
}

function viewRadar() {
  setView(`
    <div class="ph">
      <div class="ph-left">
        <div class="ph-title">${t('radar.title')}</div>
        <div class="ph-sub">${t('radar.sub')}</div>
      </div>
      <div class="ph-right">
        <button class="btn btn-ai" id="radar-strategy">${t('radar.strategy')}</button>
      </div>
    </div>
    <div class="pc">

      <!-- ── Live feed ─────────────────────────────────────── -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-h"><span>${t('radar.feedTitle')}</span><span class="text-muted text-sm">${t('radar.feedVia')}</span></div>
        <div class="card-b">
          <div class="radar-controls">
            <div class="radar-search-row">
              <input type="text" id="radar-q" value="${esc(_radar.query)}" placeholder="${esc(t('radar.searchPh'))}">
              <button class="btn btn-primary" id="radar-search">${t('radar.searchBtn')}</button>
            </div>
            <div class="radar-chips">
              <span class="radar-chips-label">${t('radar.chipsLabel')}</span>
              ${cvChips().map(c=>`<button class="radar-chip${_radar.query===c?' active':''}" data-chip="${esc(c)}">${esc(c)}</button>`).join('')}
            </div>
            <div class="radar-saved" id="radar-saved"></div>
            <div class="radar-regions" id="radar-regions"></div>
            <div class="radar-filters">
              <div class="radar-fgroup">
                <span class="radar-fgroup-label">${t('radar.filtersLabel')}</span>
                <label class="radar-check" title="${esc(t('radar.helpSenior').replace(/<[^>]+>/g,''))}"><input type="checkbox" id="radar-intern" ${_radar.intern?'checked':''}> ${t('radar.internOnly')}</label>
                <label class="radar-check" title="${esc(t('radar.helpRemote').replace(/<[^>]+>/g,''))}"><input type="checkbox" id="radar-remote" ${_radar.remoteOnly?'checked':''}> ${t('radar.remoteOnly')}</label>
                <label class="radar-check radar-check-visa" title="${esc(t('radar.helpVisa').replace(/<[^>]+>/g,''))}"><input type="checkbox" id="radar-visa" ${_radar.visaOnly?'checked':''}> ${t('radar.visaOnly')}</label>
                <label class="radar-check" title="${esc(t('radar.helpEnglish').replace(/<[^>]+>/g,''))}"><input type="checkbox" id="radar-english" ${_radar.english?'checked':''}> ${t('radar.englishOnly')}</label>
                <label class="radar-check" title="${esc(t('radar.helpAuto').replace(/<[^>]+>/g,''))}"><input type="checkbox" id="radar-automatch" ${radarStore().autoMatch?'checked':''}> ${t('radar.autoMatch')}</label>
              </div>
              <div class="radar-fgroup">
                <span class="radar-fgroup-label">${t('radar.sources')} <span class="radar-src-count">${Object.values(_radar.sources).filter(Boolean).length}/${RADAR_SOURCES.length}</span></span>
                ${RADAR_SOURCES.map(s=>`<label class="radar-check" title="${esc(t(s.tipKey))}"><input type="checkbox" data-src="${s.key}" ${_radar.sources[s.key]?'checked':''}> <span class="radar-src-dot" style="--sc:${SOURCE_COLORS[s.label]||'#888'}"></span>${s.label}</label>`).join('')}
                <span class="radar-src-actions"><button type="button" class="radar-mini" id="radar-src-all">${t('radar.selectAll')}</button><button type="button" class="radar-mini" id="radar-src-none">${t('radar.selectNone')}</button></span>
              </div>
            </div>
            <details class="radar-help-d" open>
              <summary>${t('radar.helpToggle')}</summary>
              <div class="radar-help">
                <div>${t('radar.helpKeyword')}</div>
                <div>${t('radar.helpSenior')}</div>
                <div>${t('radar.helpRemote')}</div>
                <div>${t('radar.helpVisa')}</div>
                <div>${t('radar.helpEnglish')}</div>
                <div>${t('radar.helpRegion')}</div>
                <div>${t('radar.helpSaved')}</div>
                <div>${t('radar.helpSources')}</div>
                <div>${t('radar.helpAi')}</div>
                <div>${t('radar.helpAuto')}</div>
              </div>
            </details>
          </div>
          ${(() => {
            const nb = radarStore().newBySearch || {};
            const entries = Object.entries(nb).filter(([, c]) => c > 0);
            if (!entries.length) return '';
            return `<div class="radar-newbanner" id="radar-newbanner">
              <span>🔔 <strong>${radarStore().newCount || 0}</strong> ${t('radar.newWord')} ${t('radar.newAcross')}</span>
              ${entries.map(([q, c]) => `<button class="radar-newchip" data-newq="${esc(q)}">${esc(q)} <b>${c}</b></button>`).join('')}
            </div>`;
          })()}
          <div id="radar-feed"></div>
        </div>
      </div>

      <!-- ── How it works ──────────────────────────────────── -->
      <div class="card" style="margin-bottom:20px;background:linear-gradient(135deg,rgba(30,58,95,.08),rgba(123,77,255,.07));border:1px solid rgba(30,58,95,.15)">
        <div class="card-b" style="font-size:13px;line-height:1.7;color:var(--text)">
          ${t('radar.tipBody')}
        </div>
      </div>

      <!-- ── Curated boards ────────────────────────────────── -->
      <div class="board-section-title">${t('radar.boardsTitle')}</div>
      ${_radar.query ? `<div class="board-q-hint">🔎 ${t('radar.boardsQuery')} <strong>${esc(_radar.query)}</strong></div>` : ''}
      <div class="radar-grid">
        ${JOB_BOARDS.map(group => `
          <div class="board-group">
            <div class="board-group-title">${group.group}</div>
            ${group.links.map(l => `
              <a href="${esc(boardUrl(l))}" target="_blank" rel="noopener" class="board-link"${l.q && _radar.query ? ` title="${esc(t('radar.boardsQuery'))} ${esc(_radar.query)}"` : ''}>
                <span>${esc(l.name)}</span>
                <span style="display:flex;gap:4px">
                  ${l.tags.map(t=>`<span class="board-tag tag-${t}">${TAG_LABELS[t]||t}</span>`).join('')}
                </span>
              </a>`).join('')}
          </div>`).join('')}
      </div>
    </div>
  `);

  document.getElementById('radar-strategy').addEventListener('click', () => {
    AI.assist({ title: t('radar.strategyTitle'), prompt: Prompts.jobStrategy(), model: AI.SMART, web: true });
  });

  const runSearch = () => {
    _radar.query = document.getElementById('radar-q').value.trim() || cvQuery();
    radarFetch();
    // reflect active chip
    document.querySelectorAll('.radar-chip').forEach(c => c.classList.toggle('active', c.dataset.chip === _radar.query));
  };
  document.getElementById('radar-search').addEventListener('click', runSearch);
  document.getElementById('radar-q').addEventListener('keydown', e => { if (e.key === 'Enter') runSearch(); });
  document.querySelectorAll('.radar-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.getElementById('radar-q').value = chip.dataset.chip;
      runSearch();
    });
  });
  // "New since last visit" banner: each chip loads that saved search (and applies its filters),
  // reconciling the nav badge's count with what the feed actually shows.
  document.querySelectorAll('.radar-newchip').forEach(b => b.addEventListener('click', () => {
    const q = b.dataset.newq;
    document.getElementById('radar-q').value = q;
    _radar.query = q;
    const s = (radarStore().saved || []).find(x => x.q.toLowerCase() === q.toLowerCase());
    if (s) {
      _radar.intern = !!s.intern; _radar.visaOnly = !!s.visa;
      const i = document.getElementById('radar-intern'); if (i) i.checked = _radar.intern;
      const v = document.getElementById('radar-visa');   if (v) v.checked = _radar.visaOnly;
    }
    b.remove();   // they're viewing it now → drop the chip
    document.querySelectorAll('.radar-chip').forEach(c => c.classList.toggle('active', c.dataset.chip === q));
    radarFetch();
  }));
  document.getElementById('radar-intern').addEventListener('change', e => { _radar.intern = e.target.checked; radarFetch(); });
  // Remote-only is a client-side filter — no need to re-hit the bridge.
  document.getElementById('radar-remote').addEventListener('change', e => { _radar.remoteOnly = e.target.checked; renderRadarFeed(); });
  // Visa/relocation is filtered server-side so rare matches aren't crowded out of the result cap.
  document.getElementById('radar-visa').addEventListener('change', e => { _radar.visaOnly = e.target.checked; radarFetch(); });
  // The source toggles + count live in the static controls template (radarFetch only
  // re-renders the feed), so keep the "N/6" badge in sync by hand on every change.
  const updateSrcCount = () => {
    const cnt = document.querySelector('.radar-src-count');
    if (cnt) cnt.textContent = `${Object.values(_radar.sources).filter(Boolean).length}/${RADAR_SOURCES.length}`;
  };
  document.querySelectorAll('[data-src]').forEach(cb => {
    cb.addEventListener('change', e => { _radar.sources[e.target.dataset.src] = e.target.checked; updateSrcCount(); radarFetch(); });
  });
  const setAllSources = on => {
    RADAR_SOURCES.forEach(s => { _radar.sources[s.key] = on; });
    document.querySelectorAll('[data-src]').forEach(cb => { cb.checked = on; });
    updateSrcCount();
    radarFetch();
  };
  document.getElementById('radar-src-all').addEventListener('click', () => setAllSources(true));
  document.getElementById('radar-src-none').addEventListener('click', () => setAllSources(false));
  document.getElementById('radar-automatch').addEventListener('change', e => {
    Store.get().radar.autoMatch = e.target.checked; Store.save();
    if (e.target.checked && _radar.jobs.length && !_radar.aiRanked) radarAIMatch({ auto: true });
  });
  // English-only hides postings in languages you don't read (server-side, before the result cap).
  document.getElementById('radar-english').addEventListener('change', e => {
    _radar.english = e.target.checked; Store.get().radar.english = e.target.checked; Store.save(); radarFetch();
  });

  renderSavedSearches();
  renderRegionChips();

  // Auto-load on first visit; keep cached results on later visits.
  if (_radar.fetched || _radar.loading) renderRadarFeed();
  else radarFetch();
}

// Saved-search chips + Save / Check-for-new actions (the proactive part of the Radar).
function renderSavedSearches() {
  const el = document.getElementById('radar-saved');
  if (!el) return;
  const saved = radarStore().saved || [];
  el.innerHTML = `
    <span class="radar-chips-label">${t('radar.savedLabel')}</span>
    ${saved.length ? saved.map(s => `
      <span class="radar-saved-chip${_radar.query===s.q?' active':''}">
        <button type="button" class="rss-go" data-saved="${esc(s.q)}" data-intern="${s.intern?1:0}" data-visa="${s.visa?1:0}">${esc(s.q)}${s.visa?' 🛂':''}${s.intern?' ·jr':''}</button>
        <button type="button" class="rss-del" data-saveddel="${esc(s.q)}" title="${esc(t('radar.removeSaved'))}">×</button>
      </span>`).join('') : `<span class="radar-saved-empty">${t('radar.noSaved')}</span>`}
    <button type="button" class="radar-mini radar-mini-star" id="radar-save-search" title="${esc(t('radar.saveSearchTip'))}">★ ${t('radar.saveSearch')}</button>
    ${saved.length ? `<button type="button" class="radar-mini" id="radar-check-new">↻ ${t('radar.checkNew')}</button>` : ''}
  `;
  el.querySelectorAll('[data-saved]').forEach(b => b.addEventListener('click', () => {
    _radar.query = b.dataset.saved;
    _radar.intern = b.dataset.intern === '1';
    _radar.visaOnly = b.dataset.visa === '1';
    const q = document.getElementById('radar-q'); if (q) q.value = _radar.query;
    const ci = document.getElementById('radar-intern'); if (ci) ci.checked = _radar.intern;
    const cv = document.getElementById('radar-visa');   if (cv) cv.checked = _radar.visaOnly;
    document.querySelectorAll('.radar-chip').forEach(c => c.classList.toggle('active', c.dataset.chip === _radar.query));
    radarFetch();
    renderSavedSearches();
  }));
  el.querySelectorAll('[data-saveddel]').forEach(b => b.addEventListener('click', () => radarRemoveSaved(b.dataset.saveddel)));
  document.getElementById('radar-save-search')?.addEventListener('click', radarSaveCurrentSearch);
  document.getElementById('radar-check-new')?.addEventListener('click', () => radarCheckNew({ silent: false }));
}

// Region/country filter chips (multi-select; none selected = all regions). Persisted in Store.
function renderRegionChips() {
  const el = document.getElementById('radar-regions');
  if (!el) return;
  el.innerHTML = `<span class="radar-chips-label">${t('radar.regionLabel')}</span>` +
    RADAR_REGIONS.map(r => `<button type="button" class="radar-chip region-chip${_radar.regions.includes(r.key) ? ' active' : ''}" data-region="${r.key}">${t(r.labelKey)}</button>`).join('') +
    (_radar.regions.length ? `<button type="button" class="radar-mini" id="radar-region-clear">✕ ${t('radar.regionClear')}</button>` : '');
  const persist = () => { Store.get().radar.regions = _radar.regions.slice(); Store.save(); };
  el.querySelectorAll('[data-region]').forEach(b => b.addEventListener('click', () => {
    const k = b.dataset.region, i = _radar.regions.indexOf(k);
    if (i >= 0) _radar.regions.splice(i, 1); else _radar.regions.push(k);
    persist(); renderRegionChips(); radarFetch();
  }));
  document.getElementById('radar-region-clear')?.addEventListener('click', () => {
    _radar.regions = []; persist(); renderRegionChips(); radarFetch();
  });
}

/* ════════════════════════════════════════════════════════════════
   Backup / Restore + Completeness score
   ════════════════════════════════════════════════════════════════ */
function exportBackup() {
  const blob = new Blob([JSON.stringify(Store.get(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `career-dashboard-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
  toast(t('data.backupDownloaded'));
}

function importBackup(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const obj = JSON.parse(reader.result);
      if (!obj.cv) throw new Error('format');
      Store.replaceAll(obj);
      toast(t('data.restored'));
      Router.go('#home'); viewHome();
    } catch { toast(t('data.invalidBackup')); }
  };
  reader.readAsText(file);
}

function completenessScore() {
  const cv = Store.get().cv;
  const checks = [
    { ok: !!cv.personal.name,                       label: t('cv.check.name') },
    { ok: !!cv.personal.email,                      label: t('cv.check.email') },
    { ok: !!cv.personal.phone,                      label: t('cv.check.phone') },
    { ok: !!cv.personal.linkedin,                   label: t('cv.check.linkedin') },
    { ok: !!(cv.summary && cv.summary.length>40),   label: t('cv.check.summary') },
    { ok: cv.education.length >= 1,                 label: t('cv.check.education') },
    { ok: cv.skills.length >= 3,                    label: t('cv.check.skills') },
    { ok: cv.projects.length >= 2,                  label: t('cv.check.projects') },
    { ok: cv.projects.every(p=>p.description),      label: t('cv.check.projectsDesc') },
    { ok: (cv.achievements||[]).length >= 1,        label: t('cv.check.achievements') },
    { ok: cv.languages.length >= 2,                 label: t('cv.check.languages') },
  ];
  const done = checks.filter(c => c.ok).length;
  return { pct: Math.round(done/checks.length*100), done, total: checks.length, checks };
}

/* ── Bridge status + auto-backup (Phase 1: reliability) ──────────── */
const BRIDGE_MIN_VERSION = 12;   // must match BUILD in bridge/server.mjs
let _bridgeOk = false;

async function checkBridge() {
  try {
    const ctrl = new AbortController();
    const tm = setTimeout(() => ctrl.abort(), 1500);
    const r = await fetch(AI.BRIDGE + '/health', { signal: ctrl.signal });
    clearTimeout(tm);
    const j = await r.json();
    return { ok: !!j.ok, version: j.version || 0 };
  } catch { return { ok: false, version: 0 }; }
}

function renderBridgeStatus({ ok, version }) {
  _bridgeOk = ok;
  const el = document.getElementById('bridge-status');
  const txt = document.getElementById('bridge-status-text');
  if (!el || !txt) return;
  el.classList.remove('is-checking', 'is-on', 'is-off', 'is-stale');
  if (!ok)                          { el.classList.add('is-off');   txt.textContent = t('bridge.off');   el.title = t('bridge.offTip'); }
  else if (version < BRIDGE_MIN_VERSION) { el.classList.add('is-stale'); txt.textContent = t('bridge.stale'); el.title = t('bridge.staleTip'); }
  else                              { el.classList.add('is-on');    txt.textContent = t('bridge.on');    el.title = t('bridge.onTip'); }
}

async function updateBridgeStatus() { renderBridgeStatus(await checkBridge()); }

// Silent daily snapshot to disk via the bridge — protects the localStorage-only data.
async function maybeAutoBackup() {
  const s = Store.get().settings;
  if (s.lastBackup === todayISO()) return;
  const { ok } = await checkBridge();
  if (!ok) return;                       // bridge writes the file; skip if it's off
  try {
    const r = await fetch(AI.BRIDGE + '/backup', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: Store.get() }),
    });
    const j = await r.json();
    if (j.ok) { s.lastBackup = todayISO(); Store.save(); console.log('Auto-backup saved:', j.file); }
  } catch {}
}

Store.init();
TagEngine.init();
AI.init();
applyTheme(Store.get().settings.theme || 'light');
setLang(Store.get().settings.lang || 'fr');

Router.register('home',    viewHome);
Router.register('profile', viewProfile);
Router.register('cv',      viewCV);
Router.register('letters', viewLetters);
Router.register('letter',  viewLetterEditor);
Router.register('ats',     viewATS);
Router.register('tracker', viewTracker);
Router.register('apply',   viewApply);
Router.register('radar',   viewRadar);
Router.register('insights', viewInsights);

Router.init();
applyStaticI18n();   // translate the static shell (sidebar, modal) on load

// Load persisted Radar filter prefs (English-only + regions) into session state.
_radar.english = !!Store.get().radar.english;
_radar.regions = (Store.get().radar.regions || []).slice();
// Restore the last search if there is one, else default to the CV-derived query.
_radar.query = (Store.get().radar.lastQuery || '').trim() || cvQuery();

// Proactive Radar: show last-known new count immediately, then refresh in the background,
// and re-check every 10 min while the app is open (cheap — the bridge caches for ~8 min).
radarSetNavBadge(Store.get().radar.newCount || 0);
radarCheckNew();
setInterval(() => radarCheckNew(), 10 * 60 * 1000);

// Bridge status pill: check now, poll every 25s, and re-check on click. Auto-backup once/day.
updateBridgeStatus();
setInterval(updateBridgeStatus, 25000);
maybeAutoBackup();
document.getElementById('bridge-status').addEventListener('click', async () => {
  await updateBridgeStatus();
  toast(_bridgeOk ? t('bridge.onTip') : t('bridge.offTip'), 4500);
  if (_bridgeOk) maybeAutoBackup();
});

// Language toggle (FR / EN)
document.getElementById('btn-lang').addEventListener('click', () => {
  const next = (Store.get().settings.lang || 'fr') === 'fr' ? 'en' : 'fr';
  Store.get().settings.lang = next;
  Store.save();
  setLang(next);
  applyStaticI18n();
  updateBridgeStatus();   // status text is set dynamically (not data-i18n) — re-translate it
  Router.refresh();   // re-render the current view in the new language
});

// Reset button
document.getElementById('btn-reset').addEventListener('click', () => {
  if (!confirm(t('data.confirmReset'))) return;
  Store.reset();
  Store.save();
  toast(t('data.resetDone'));
  Router.go('#home');
  viewHome();
});

// Backup / Restore
document.getElementById('btn-backup').addEventListener('click', exportBackup);
document.getElementById('btn-restore').addEventListener('click', () => document.getElementById('restore-file').click());
document.getElementById('restore-file').addEventListener('change', (e) => {
  if (e.target.files[0]) importBackup(e.target.files[0]);
  e.target.value = '';
});

// Theme toggle
document.getElementById('btn-theme').addEventListener('click', () => {
  const current = Store.get().settings.theme || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  Store.get().settings.theme = next;
  Store.save();
  applyTheme(next);
});

// Mobile nav drawer (hamburger + scrim); close after navigating.
document.getElementById('nav-toggle')?.addEventListener('click', () => document.body.classList.toggle('nav-open'));
document.getElementById('nav-scrim')?.addEventListener('click', () => document.body.classList.remove('nav-open'));
document.querySelectorAll('.nav-link').forEach(l => l.addEventListener('click', () => document.body.classList.remove('nav-open')));

// PWA: register the service worker (only works over http(s)/localhost, not file://).
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

// Make functions available globally for inline onclick
window.deleteLetter = deleteLetter;
window.Export = Export;
window.Router = Router;
window.__t = t;   // i18n lookup for inline onclick handlers (run in global scope)