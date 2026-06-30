/* ============ Lumina demo catalog & seed data ============ */

const VIDS = [
  'BigBuckBunny', 'ElephantsDream', 'ForBiggerBlazes', 'ForBiggerEscapes',
  'ForBiggerFun', 'ForBiggerJoyrides', 'ForBiggerMeltdowns', 'Sintel',
  'SubaruOutbackOnStreetAndDirt', 'TearsOfSteel'
].map(n => `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${n}.mp4`);

const CATALOG = [
  {
    id: 'data-foundations', title: 'Data Foundations', cat: 'Analytics', grad: 5, icon: '🧮',
    level: 'Beginner', rating: 4.8, learners: 412, ai: true,
    desc: 'The shared language of data at work: types, distributions, sampling, and the classic traps that make smart people draw wrong conclusions.',
    modules: ['Why data literacy matters', 'Types of data', 'Averages lie: distributions', 'Sampling & bias', 'Correlation vs causation', 'Reading charts critically']
  },
  {
    id: 'sql-dm', title: 'SQL for Decision Makers', cat: 'Analytics', grad: 2, icon: '🗄️',
    level: 'Beginner', rating: 4.7, learners: 298, ai: true,
    desc: 'Enough SQL to answer your own questions: SELECT, JOIN, GROUP BY, and how to sanity-check a query before you trust it.',
    modules: ['Your first SELECT', 'Filtering with WHERE', 'JOINs without fear', 'Aggregations & GROUP BY', 'Window functions, gently', 'Sanity-checking results']
  },
  {
    id: 'leading-data', title: 'Leading with Data', cat: 'Analytics', grad: 1, icon: '📊',
    level: 'Intermediate', rating: 4.9, learners: 312, ai: true, featured: true,
    desc: 'Master the analytics mindset your role demands. This program adapts to your pace — Lumina\'s AI rebuilds your module order after every assessment, skipping what you already know.',
    modules: ['The analytics mindset', 'Asking decision-first questions', 'Metrics vs KPIs', 'North-star thinking', 'Choosing the right metric', 'Vanity vs actionable metrics', 'Building a metric tree', 'Dashboards people actually read', 'Running a metrics review', 'Data-informed vs data-driven', 'Influencing with evidence', 'Final assessment']
  },
  {
    id: 'storytelling', title: 'Storytelling with Dashboards', cat: 'Analytics', grad: 5, icon: '📈',
    level: 'Intermediate', rating: 4.9, learners: 187, ai: true,
    desc: 'Turn charts into narratives. Visual hierarchy, the one-message-per-view rule, and dashboards that drive meetings instead of decorating them.',
    modules: ['One message per view', 'Visual hierarchy', 'Color with intent', 'Annotating insight', 'The executive summary view', 'Live critique: real dashboards']
  },
  {
    id: 'ab-testing', title: 'Experimentation & A/B Testing', cat: 'Analytics', grad: 1, icon: '🧪',
    level: 'Advanced', rating: 4.8, learners: 143,
    desc: 'Design experiments that survive scrutiny: hypotheses, power, peeking problems, and what to do when results are "almost significant".',
    modules: ['Hypothesis design', 'Sample size & power', 'The peeking problem', 'Segmenting safely', 'Shipping decisions from tests']
  },
  {
    id: 'capstone', title: 'Capstone: Board Briefing', cat: 'Analytics', grad: 6, icon: '🏆',
    level: 'Advanced', rating: 4.9, learners: 96, ai: true,
    desc: 'The graded finale: build and present a 5-minute data briefing for a simulated board. Lumina AI scores structure, evidence, and clarity.',
    modules: ['Brief structure', 'Building your evidence base', 'Dry-run with AI feedback', 'Record your briefing', 'AI-graded review']
  },
  {
    id: 'prompt-eng', title: 'Prompt Engineering at Work', cat: 'AI Skills', grad: 6, icon: '🧠',
    level: 'Beginner', rating: 4.9, learners: 284, trending: 1,
    desc: 'Get reliably great output from AI tools: role prompting, context windows, iteration loops, and building your personal prompt library.',
    modules: ['How models “think”', 'Role & context prompting', 'Iterating to quality', 'Structured outputs', 'Your prompt library', 'AI in your daily workflow', 'Team patterns', 'Evaluating output', 'Common failure modes', 'Capstone: automate one task']
  },
  {
    id: 'ai-agents', title: 'Automating with AI Agents', cat: 'AI Skills', grad: 4, icon: '⚡',
    level: 'Intermediate', rating: 4.9, learners: 176, trending: 3,
    desc: 'From chat to automation: when agents beat scripts, how to scope them safely, and three build-along automations for real office work.',
    modules: ['What agents actually are', 'Scoping safe automations', 'Build-along: inbox triage', 'Build-along: report drafting', 'Guardrails & review', 'Measuring time saved']
  },
  {
    id: 'negotiation', title: 'Negotiation Mastery', cat: 'Leadership', grad: 3, icon: '🎯',
    level: 'Intermediate', rating: 4.8, learners: 167,
    desc: 'Prepare, anchor, and trade concessions like a pro. Includes recorded role-plays with AI feedback on your tone and framing.',
    modules: ['Preparation beats talent', 'Anchoring & framing', 'Trading, not conceding', 'Difficult counterparts', 'Role-play: salary talk', 'Role-play: vendor deal', 'Closing & follow-through', 'Final role-play, AI-scored']
  },
  {
    id: 'difficult-conv', title: 'Difficult Conversations', cat: 'Leadership', grad: 2, icon: '💬',
    level: 'Intermediate', rating: 4.8, learners: 201, trending: 2,
    desc: 'Scripts and frameworks for the talks you postpone: feedback, conflict, and bad news — delivered with care and spine.',
    modules: ['Why we avoid them', 'The SBI framework', 'Listening under pressure', 'Delivering hard feedback', 'Repairing after conflict']
  },
  {
    id: 'security', title: 'Security Awareness 2026', cat: 'Compliance', grad: 5, icon: '🔐',
    level: 'All levels', rating: 4.5, learners: 540, required: true, due: 'Due in 3 days',
    desc: 'This year\'s threat landscape in plain language: AI-assisted phishing, deepfake fraud, password hygiene, and how to report incidents fast.',
    modules: ['The 2026 threat landscape', 'AI-assisted phishing', 'Deepfake & voice fraud', 'Passwords & passkeys', 'Safe data handling', 'Devices & travel', 'Social engineering drills', 'Reporting incidents', 'Certification check']
  },
  {
    id: 'gdpr', title: 'GDPR Essentials', cat: 'Compliance', grad: 8, icon: '⚖️',
    level: 'All levels', rating: 4.4, learners: 489, required: true,
    desc: 'What GDPR means for your day-to-day: lawful bases, data subject rights, and what to do (fast) when something goes wrong.',
    modules: ['GDPR in 10 minutes', 'Lawful bases', 'Data subject rights', 'Breach response', 'Certification check']
  },
  {
    id: 'coaching', title: 'Coaching Your First Team', cat: 'Management', grad: 7, icon: '🌱',
    level: 'Beginner', rating: 4.7, learners: 132, ai: true,
    desc: 'The shift from doing to enabling: 1:1s that matter, delegation without dumping, and growing people who outgrow you.',
    modules: ['The player-to-coach shift', '1:1s that matter', 'Delegation without dumping', 'Feedback as a habit', 'Growing your people', 'Your 90-day coaching plan']
  },
  {
    id: 'new-manager', title: 'New Manager Track', cat: 'Management', grad: 2, icon: '🧭',
    level: 'Beginner', rating: 4.8, learners: 154, ai: true,
    desc: 'A 5-course adaptive track for first-time managers, sequenced by Lumina AI around your strengths assessment.',
    modules: ['Orientation & assessment', 'Managing yourself first', 'Hiring & onboarding', 'Performance conversations', 'Leading through change']
  },
  {
    id: 'empathy', title: 'Customer Empathy Sprint', cat: 'CX', grad: 4, icon: '🤝',
    level: 'All levels', rating: 4.6, learners: 178, due: 'Due June 30', teamGoal: true,
    desc: 'A one-week team sprint: shadow real support tickets, map friction, and present one fix worth shipping.',
    modules: ['Sprint kickoff', 'Ticket shadowing', 'Friction mapping', 'Pitch your fix']
  },
  {
    id: 'forecasting', title: 'Forecasting for PMs', cat: 'Analytics', grad: 6, icon: '🔮',
    level: 'Intermediate', rating: 4.7, learners: 119,
    desc: 'Honest forecasts under uncertainty: baselines, ranges instead of points, and how to communicate confidence without theater.',
    modules: ['Baselines first', 'Ranges, not points', 'Seasonality & shocks', 'Communicating confidence']
  },
  {
    id: 'metrics', title: 'Metrics that Matter', cat: 'Strategy', grad: 2, icon: '🗺️',
    level: 'Intermediate', rating: 4.6, learners: 108,
    desc: 'Choose the handful of numbers that actually steer the business — and retire the dashboard zombies that don\'t.',
    modules: ['The metric audit', 'Leading vs lagging', 'Counter-metrics', 'The one-page scorecard']
  },
  {
    id: 'systems', title: 'Systems Thinking Primer', cat: 'Strategy', grad: 1, icon: '📐',
    level: 'Intermediate', rating: 4.7, learners: 89, isNew: true,
    desc: 'See loops, not lines: feedback, delays, and leverage points — the mental toolkit for problems that keep coming back.',
    modules: ['Events vs structures', 'Feedback loops', 'Delays & oscillation', 'Finding leverage points']
  },
  {
    id: 'wellbeing', title: 'Wellbeing for High Performers', cat: 'Culture', grad: 7, icon: '🪴',
    level: 'All levels', rating: 4.8, learners: 226,
    desc: 'A 6-episode series on sustainable ambition: energy management, recovery, focus rituals, and saying no with grace.',
    modules: ['Energy, not time', 'Recovery is training', 'Focus rituals', 'Boundaries & no', 'Sleep for performers', 'Your sustainability plan']
  }
];

const LIVE_SESSIONS = [
  { id: 'live-now', title: 'Office Hours: Dashboards Live Critique', host: 'Maya Chen · Head of Analytics', when: 'LIVE NOW', live: true, viewers: 47, grad: 1, icon: '📈', desc: 'Bring your dashboard, leave with a sharper one. Maya reworks viewer submissions in real time.' },
  { id: 'exec-ama', title: 'Exec AMA: Scaling Teams', host: 'Sofia Reis · COO', when: 'Fri 14:00 WET', grad: 3, icon: '🎤', desc: 'Unfiltered Q&A on growing from 50 to 200 without losing the culture.' },
  { id: 'ai-workshop', title: 'Workshop: Build Your First AI Agent', host: 'Dev Patel · Staff Engineer', when: 'Tue 17 · 16:00 WET', grad: 4, icon: '⚡', desc: 'Hands-on, 90 minutes, no code required. Leave with a working inbox-triage agent.' },
  { id: 'storytime', title: 'Data Storytime: Q2 Numbers Decoded', host: 'Maya Chen · Head of Analytics', when: 'Thu 19 · 11:00 WET', grad: 5, icon: '📊', desc: 'The quarterly numbers, narrated like a story — what moved, why, and what we do next.' }
];

const QUIZ_BANK = {
  'Analytics': [
    { q: 'What separates an actionable metric from a vanity metric?', opts: ['It is bigger', 'It changes a decision when it moves', 'It is reported weekly', 'Executives ask for it'], a: 1 },
    { q: 'Every metric on a healthy scorecard needs…', opts: ['A trend arrow', 'An owner, a threshold, and an action', 'A benchmark from competitors', 'A monthly review meeting'], a: 1 },
    { q: 'Your conversion rate doubled after a tiny sample. First move?', opts: ['Ship it everywhere', 'Check sample size & significance', 'Report it to leadership', 'Run a press release'], a: 1 }
  ],
  'AI Skills': [
    { q: 'The single highest-leverage way to improve AI output is…', opts: ['Longer prompts', 'Giving clear role + context + examples', 'Asking it to “be smart”', 'Using more exclamation marks'], a: 1 },
    { q: 'When should an AI agent require human review?', opts: ['Never, that defeats the point', 'When actions are irreversible or external', 'Only in regulated industries', 'Every single step'], a: 1 },
    { q: 'A model keeps inventing facts. Best fix?', opts: ['Threaten it', 'Ground it with source documents and ask for citations', 'Lower the temperature to 0 and trust it', 'Switch to a bigger model only'], a: 1 }
  ],
  'Leadership': [
    { q: 'In the SBI feedback framework, “B” stands for…', opts: ['Belief', 'Behavior', 'Benchmark', 'Boundary'], a: 1 },
    { q: 'The strongest predictor of negotiation outcomes is…', opts: ['Charisma', 'Preparation', 'Aggression', 'Seniority'], a: 1 },
    { q: 'Best opening for a difficult conversation?', opts: ['Soften with 10 minutes of small talk', 'State intent and the issue directly, with care', 'Email first, then talk', 'Start with everything they did right'], a: 1 }
  ],
  'Compliance': [
    { q: 'You receive a too-good invoice from a known supplier with a new IBAN. You…', opts: ['Pay it, you know them', 'Verify via a known channel before paying', 'Forward to a colleague', 'Ignore it'], a: 1 },
    { q: 'Under GDPR, a personal data breach must be reported to the authority within…', opts: ['24 hours', '72 hours', '7 days', '30 days'], a: 1 },
    { q: 'A caller who sounds exactly like your CEO asks for an urgent transfer. You…', opts: ['Comply, it is the CEO', 'Verify through an independent channel — voice can be cloned', 'Ask them a personal question', 'Transfer half as a compromise'], a: 1 }
  ],
  '_default': [
    { q: 'What is the most reliable way to make learning stick?', opts: ['Re-watching videos', 'Active recall and spaced practice', 'Highlighting notes', 'Longer sessions'], a: 1 },
    { q: 'You disagree with a module\'s advice. Best move?', opts: ['Skip the course', 'Test it in a low-stakes situation and compare results', 'Assume the course is wrong', 'Assume you are wrong'], a: 1 },
    { q: 'The point of a capstone project is to…', opts: ['Fill time', 'Prove transfer: apply skills to a realistic problem', 'Earn a badge', 'Review every module'], a: 1 }
  ]
};

const PATH_RATIONALES = [
  'You aced joins & aggregations, so the AI skipped two SQL modules and moved Storytelling earlier — your assessment showed visualization is your biggest gap.',
  'Fresh reshuffle: Experimentation now precedes Storytelling — your last quiz showed strong visual instincts but shaky stats vocabulary.',
  'The AI pulled Forecasting into your path: three of your recent tutor questions were about projections, and it pairs well with your current module.',
  'Capstone moved one step closer — your average score (94%) suggests you can compress the remaining theory modules.'
];

const TEAM = [
  { name: 'João Amaral', initials: 'JA', role: 'Analytics Lead (you)', grad: 3, pct: 72, done: 3, last: 'Now', risk: false },
  { name: 'Maya Chen', initials: 'MC', role: 'Head of Analytics', grad: 1, pct: 91, done: 7, last: '2h ago', risk: false },
  { name: 'Dev Patel', initials: 'DP', role: 'Staff Engineer', grad: 2, pct: 84, done: 6, last: 'Today', risk: false },
  { name: 'Sofia Reis', initials: 'SR', role: 'COO', grad: 6, pct: 58, done: 4, last: 'Yesterday', risk: false },
  { name: 'Liam Walsh', initials: 'LW', role: 'Account Executive', grad: 4, pct: 31, done: 1, last: '6d ago', risk: true },
  { name: 'Ana Duarte', initials: 'AD', role: 'Support Lead', grad: 7, pct: 66, done: 5, last: 'Today', risk: false },
  { name: 'Tom Becker', initials: 'TB', role: 'Product Manager', grad: 5, pct: 22, done: 1, last: '12d ago', risk: true },
  { name: 'Inês Costa', initials: 'IC', role: 'Designer', grad: 3, pct: 77, done: 5, last: '1h ago', risk: false }
];

const GOAL_PRESETS = {
  'Analytics Lead': ['data-foundations', 'sql-dm', 'leading-data', 'storytelling', 'ab-testing', 'capstone'],
  'People Manager': ['coaching', 'difficult-conv', 'negotiation', 'new-manager', 'wellbeing'],
  'AI Power User': ['prompt-eng', 'ai-agents', 'systems', 'metrics'],
  'CX Champion': ['empathy', 'difficult-conv', 'metrics', 'storytelling']
};

const ROLE_OPTIONS = [
  { key: 'analytics', label: 'Analytics & Data', icon: '📊', goals: ['Analytics Lead', 'AI Power User'] },
  { key: 'management', label: 'Management', icon: '🧭', goals: ['People Manager', 'Analytics Lead'] },
  { key: 'ai', label: 'AI & Automation', icon: '⚡', goals: ['AI Power User', 'Analytics Lead'] },
  { key: 'cx', label: 'Customer Experience', icon: '🤝', goals: ['CX Champion', 'People Manager'] }
];

const DEFAULT_STATE = {
  onboarded: false,
  role: null,
  assignments: [],
  notes: {},
  apiKey: '',
  aiModel: 'claude-opus-4-8',
  goal: 'Analytics Lead',
  path: ['data-foundations', 'sql-dm', 'leading-data', 'storytelling', 'ab-testing', 'capstone'],
  progress: {
    'data-foundations': { done: true, score: 92 },
    'sql-dm': { done: true, score: 92, note: '2 modules skipped by AI' },
    'gdpr': { done: true, score: 88, cert: true },
    'leading-data': { mod: 4, pct: 64 },
    'security': { mod: 6, pct: 78 },
    'prompt-eng': { mod: 3, pct: 42 },
    'negotiation': { mod: 1, pct: 23 },
    'coaching': { mod: 0, pct: 6 }
  },
  review: {},
  reminders: [],
  rationaleIdx: 0,
  quizzesPassed: 0,
  week: [38, 52, 24, 65, 41, 0, 32] /* minutes Mon..Sun */
};
