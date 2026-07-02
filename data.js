/* ============ EdenRise Academy — catalog & seed data ============ */

const VIDS = [
  'BigBuckBunny', 'ElephantsDream', 'ForBiggerBlazes', 'ForBiggerEscapes',
  'ForBiggerFun', 'ForBiggerJoyrides', 'ForBiggerMeltdowns', 'Sintel',
  'SubaruOutbackOnStreetAndDirt', 'TearsOfSteel'
].map(n => `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${n}.mp4`);

/* ---- Video hosting ----
   Lesson videos live in the repo /media folder and are served through the free
   jsDelivr global CDN (no account, no card, correct video/mp4 MIME, HTTP range
   for seeking). To move to another host later, just change MEDIA_BASE:
     - Cloudflare R2:  'https://pub-xxxx.r2.dev/'            (free 10GB, needs a card to enable)
     - Cloudinary:     'https://res.cloudinary.com/.../'     (free tier, email signup, no card)
     - local/Pages:    ''                                    (empty → serve from /media)
   One switch flips every lesson. */
const MEDIA_BASE = 'https://cdn.jsdelivr.net/gh/meridante-dev/lumina-learning@main/media/';
const mediaUrl = name => (MEDIA_BASE ? MEDIA_BASE.replace(/\/?$/, '/') : 'media/') + name;

/* The six EdenRise pillars — shown as a band under the hero */
const PILLARS = [
  { icon: 'leaf', label: 'Regenerative' },
  { icon: 'tree', label: 'Rooted' },
  { icon: 'sun', label: 'Restorative' },
  { icon: 'people', label: 'Connected' },
  { icon: 'waves', label: 'Elemental' },
  { icon: 'heart', label: 'Meaningful' }
];

const CATALOG = [
  {
    id: 'land-team-journey', title: 'Land Team Journey', cat: 'Leadership', grad: 4, icon: 'compass',
    level: 'All levels', rating: 4.9, learners: 340, ai: true, featured: true, poster: 'media/above-below-line-cover.jpg',
    desc: 'The Land Team\'s journey of growth — the mindset and habits that shape how we work the land, and each other. It begins with one question that changes how you show up.',
    modules: ['Above the Line, Below the Line', 'No Failure, Only Feedback', 'Coming soon', 'Coming soon'],
    moduleMedia: [
      { type: 'vimeo', id: '1206132511' },
      { type: 'vimeo', id: '1206132221' },
      { type: 'soon' },
      { type: 'soon' }
    ]
  },
  {
    id: 'land-literacy', title: 'Reading the Land', cat: 'Nature Connection', grad: 6, icon: 'compass',
    level: 'Beginner', rating: 4.9, learners: 412, ai: true,
    desc: 'Before you change a landscape, learn to read it. Slope, water, soil, sun and succession — the literacy that every act of stewardship begins with.',
    modules: ['Standing still: how to observe', 'Reading slope & water', 'Soil by feel & sight', 'Sun, shade & aspect', 'Succession & what land wants', 'Mapping your patch']
  },
  {
    id: 'living-soil', title: 'Living Soil', cat: 'Land & Soil', grad: 7, icon: 'sprout',
    level: 'Beginner', rating: 4.8, learners: 356, ai: true,
    desc: 'Soil is not dirt — it is a living community. Meet the microbiome beneath your feet and the practices that feed it instead of mining it.',
    modules: ['The soil food web', 'Why we stopped tilling', 'Compost as inoculant', 'Cover crops & living roots', 'Mulch & bare-soil rules', 'Reading a soil test']
  },
  {
    id: 'water-cycles', title: 'Water & the Living Landscape', cat: 'Water & Climate', grad: 5, icon: 'drop',
    level: 'Intermediate', rating: 4.9, learners: 298, ai: true,
    desc: 'Master the small water cycle your land depends on. This program adapts to your terrain — EdenRise\'s AI re-sequences each module around what your last assessment showed you already know.',
    modules: ['The small water cycle', 'Where your water goes', 'Slowing, spreading, sinking', 'Swales & on-contour design', 'Ponds & keypoint dams', 'Rehydrating dry land', 'Greywater, gently', 'Drought-proofing a garden', 'Reading a catchment', 'Springs & soaks', 'Measuring infiltration', 'Final assessment']
  },
  {
    id: 'agroforestry', title: 'Agroforestry & the Edible Forest', cat: 'Food & Forest', grad: 1, icon: 'tree',
    level: 'Intermediate', rating: 4.9, learners: 187, ai: true,
    desc: 'Stack a forest that feeds you. Seven layers, nitrogen fixers, and the patient art of designing a system that grows more abundant every year.',
    modules: ['The seven layers', 'Choosing your canopy', 'Nitrogen fixers & support species', 'Guilds that work together', 'Planting for succession', 'Tending the young forest']
  },
  {
    id: 'regen-design', title: 'Designing with Nature', cat: 'Stewardship', grad: 6, icon: 'leaf',
    level: 'Advanced', rating: 4.8, learners: 143,
    desc: 'Permaculture design from observation to plan: zones, sectors, and how to place every element so the land does the work, not you.',
    modules: ['Observation before action', 'Zones & sectors', 'Placing elements by relationship', 'Patterns to details', 'The whole-site plan']
  },
  {
    id: 'capstone-land', title: 'Capstone: Your Land Plan', cat: 'Stewardship', grad: 8, icon: 'mountain',
    level: 'Advanced', rating: 4.9, learners: 96, ai: true,
    desc: 'The graded finale: produce and present a one-year regeneration plan for a real piece of land. EdenRise AI reviews it for water, soil, and sequence.',
    modules: ['Briefing your site', 'Water-first design', 'Sequencing the first year', 'Dry-run with AI feedback', 'AI-graded review']
  },
  {
    id: 'composting', title: 'The Art of Compost', cat: 'Land & Soil', grad: 7, icon: 'sprout',
    level: 'Beginner', rating: 4.7, learners: 224, trending: 3,
    desc: 'Turn waste into black gold. Hot piles, cold piles, worms and the simple ratios that make compost reliably, without the smell.',
    modules: ['Greens & browns', 'Building a hot pile', 'Worms & vermicompost', 'Compost tea & extracts', 'Troubleshooting smells', 'Using finished compost']
  },
  {
    id: 'seed-saving', title: 'Seed Saving & Heritage Varieties', cat: 'Food & Forest', grad: 4, icon: 'seed',
    level: 'Intermediate', rating: 4.8, learners: 132, ai: true,
    desc: 'Keep the lineage alive. Save, dry and store seed from your own garden — and the open-pollinated varieties worth protecting in the Alentejo.',
    modules: ['Why open-pollinated matters', 'Isolation & purity', 'Wet & dry seed processing', 'Drying & storage', 'A community seed library']
  },
  {
    id: 'foraging', title: 'Foraging the Alentejo', cat: 'Food & Forest', grad: 2, icon: 'basket',
    level: 'Beginner', rating: 4.9, learners: 284, trending: 1,
    desc: 'Walk out and come back fed. Wild greens, mushrooms, herbs and the golden rule of foraging — identify with certainty, harvest with care.',
    modules: ['The forager\'s mindset', 'Identify with certainty', 'Wild greens of the meadow', 'Mushrooms: respect & caution', 'Wild herbs & teas', 'Harvest ethics', 'Seasonal calendar', 'Preserving the wild harvest', 'Look-alikes to never confuse', 'A first foraging walk']
  },
  {
    id: 'native-flora', title: 'Native Flora & Pollinators', cat: 'Nature Connection', grad: 3, icon: 'flower',
    level: 'Beginner', rating: 4.7, learners: 167,
    desc: 'Bring the buzz back. Native plants, hedgerows and the small changes that turn a quiet garden into a pollinator corridor.',
    modules: ['Who are your pollinators', 'Native plants first', 'Hedgerows & corridors', 'Year-round flowering', 'A pollinator patch']
  },
  {
    id: 'rainwater', title: 'Rainwater Harvesting & Swales', cat: 'Water & Climate', grad: 5, icon: 'drop',
    level: 'Intermediate', rating: 4.8, learners: 119,
    desc: 'Catch every drop. Roofs, tanks, swales and earthworks that store the winter rains in the ground for the long Alentejo summer.',
    modules: ['Sizing your catchment', 'Tanks & first-flush', 'Digging on contour', 'Overflow & safety', 'Storing water in soil']
  },
  {
    id: 'rewilding', title: 'Rewilding & Habitat', cat: 'Stewardship', grad: 7, icon: 'bird',
    level: 'Intermediate', rating: 4.7, learners: 108, isNew: true,
    desc: 'Step back and let life return. Where to intervene, where to wait, and how to measure a landscape coming back to life.',
    modules: ['Reading what\'s missing', 'Keystone species', 'When to do nothing', 'Ponds, logs & edges', 'Measuring return']
  },
  {
    id: 'cork-oak', title: 'The Montado & Cork Oak', cat: 'Food & Forest', grad: 1, icon: 'tree',
    level: 'Intermediate', rating: 4.9, learners: 201, trending: 2,
    desc: 'The Alentejo\'s living masterpiece. How the cork-oak savannah feeds people, livestock and wildlife together — and how to tend it for centuries.',
    modules: ['What is a montado', 'The cork harvest cycle', 'Grazing under the trees', 'Acorns, pigs & people', 'Regenerating old oaks']
  },
  {
    id: 'natural-building', title: 'Natural Building with Earth', cat: 'Craft & Hands', grad: 3, icon: 'hands',
    level: 'Intermediate', rating: 4.8, learners: 176,
    desc: 'Build with what the land gives. Cob, lime, earth plaster and the warm, breathing walls that have sheltered the Alentejo for generations.',
    modules: ['Earth as a material', 'Testing your soil mix', 'Cob & adobe basics', 'Lime & earth plasters', 'Finishes that last']
  },
  {
    id: 'herbal', title: 'The Herbal Apothecary', cat: 'Wellbeing', grad: 6, icon: 'flower',
    level: 'Beginner', rating: 4.8, learners: 226,
    desc: 'Grow your medicine. A garden of healing herbs and the simple preparations — teas, tinctures, salves — that turn a harvest into a home apothecary.',
    modules: ['A healing garden', 'Harvesting at the right time', 'Drying & storing herbs', 'Teas, tinctures & infusions', 'Salves & balms', 'Your home apothecary']
  },
  {
    id: 'fire-safety', title: 'Fire Safety on the Land', cat: 'Stewardship', grad: 4, icon: 'fire',
    level: 'All levels', rating: 4.6, learners: 540, required: true, due: 'Due in 3 days',
    desc: 'The Alentejo summer asks for respect. Defensible space, safe burning windows, equipment and what to do in the first sixty seconds of a wildfire.',
    modules: ['The 2026 fire season', 'Defensible space around buildings', 'Safe burning windows', 'Tools & water on hand', 'Reading wind & terrain', 'The first 60 seconds', 'Reporting & evacuation', 'Land-clearing the right way', 'Certification check']
  },
  {
    id: 'ethics', title: 'Stewardship Ethics & Land Rights', cat: 'Community', grad: 8, icon: 'compass',
    level: 'All levels', rating: 4.5, learners: 489, required: true,
    desc: 'Stewardship is a relationship of duty. Land rights, water rights, neighbours and the quiet ethics of leaving a place better than you found it.',
    modules: ['Land as relationship, not asset', 'Water rights & sharing', 'Working with neighbours', 'Leaving it better', 'Certification check']
  },
  {
    id: 'seasonal-rhythm', title: 'Living by the Seasons', cat: 'Wellbeing', grad: 6, icon: 'moon',
    level: 'All levels', rating: 4.8, learners: 178, teamGoal: true, due: 'Due June 30',
    desc: 'Re-tune your life to the land\'s calendar. A six-part series on working with the seasons of the Alentejo instead of against them.',
    modules: ['The wheel of the year', 'Spring: planting & energy', 'Summer: tending & rest', 'Autumn: harvest & storing', 'Winter: stillness & planning']
  },
  {
    id: 'nature-connection', title: 'The Art of Noticing', cat: 'Nature Connection', grad: 2, icon: 'leaf',
    level: 'Beginner', rating: 4.7, learners: 154, ai: true,
    desc: 'A practice of attention. Slow walks, sit-spots and the daily habit of noticing that turns a place you live into a place you belong to.',
    modules: ['Your sit-spot', 'Widening the senses', 'A daily nature journal', 'Tracking change over weeks', 'Belonging to a place', 'Sharing what you see']
  },
  {
    id: 'community-land', title: 'Community & the Commons', cat: 'Community', grad: 5, icon: 'people',
    level: 'Beginner', rating: 4.7, learners: 132, ai: true,
    desc: 'Land heals faster together. Shared tools, work parties, and the old-and-new structures that let a community steward a place as one.',
    modules: ['Why the commons works', 'Sharing tools & labour', 'Running a work party', 'Decisions without burnout', 'A 90-day community plan']
  }
];

const LIVE_SESSIONS = [
  { id: 'live-now', title: 'Field Hours: Live Soil Clinic', host: 'Marta Oliveira · Head of Regeneration', when: 'LIVE NOW', live: true, viewers: 47, grad: 7, icon: 'sprout', desc: 'Bring a photo or sample of your soil — Marta reads it live and prescribes the first three things to do.' },
  { id: 'exec-ama', title: 'Founder AMA: Why Regeneration', host: 'João Amaral · Founder', when: 'Fri 14:00 WET', grad: 1, icon: 'tree', desc: 'Unfiltered Q&A on building EdenRise and stewarding land in the Baixo Alentejo.' },
  { id: 'water-workshop', title: 'Workshop: Map Your Water', host: 'Dev Santos · Water Lead', when: 'Tue 17 · 16:00 WET', grad: 5, icon: 'drop', desc: 'Hands-on, 90 minutes. Bring a map of your land and leave with a water plan sketched on contour.' },
  { id: 'season-circle', title: 'Seasonal Circle: Midsummer', host: 'Marta Oliveira · Head of Regeneration', when: 'Thu 19 · 19:00 WET', grad: 6, icon: 'sun', desc: 'A gathering to mark midsummer — what to tend, what to harvest, what to let rest.' }
];

const QUIZ_BANK = {
  'Land & Soil': [
    { q: 'What is the single best indicator of healthy, living soil?', opts: ['Dark colour alone', 'Abundant life — worms, fungi, structure & smell', 'A high price per kilo', 'Being completely weed-free'], a: 1 },
    { q: 'Why do regenerative growers avoid tilling where they can?', opts: ['It looks untidy', 'Tillage destroys soil structure and the fungal network', 'It is illegal', 'Tractors are expensive'], a: 1 },
    { q: 'Bare soil between plants is mainly a problem because…', opts: ['It is ugly', 'It loses water, carbon and life to sun and rain', 'Neighbours complain', 'It attracts birds'], a: 1 }
  ],
  'Water & Climate': [
    { q: 'The core principle of slowing runoff on a landscape is…', opts: ['Drain it away fast', 'Slow it, spread it, sink it', 'Pump it uphill', 'Cover everything in concrete'], a: 1 },
    { q: 'A swale dug on contour primarily…', opts: ['Looks decorative', 'Catches water and lets it soak into the ground', 'Drains the land', 'Marks a boundary'], a: 1 },
    { q: 'The biggest reservoir you can build on most land is…', opts: ['A plastic tank', 'The soil itself, full of organic matter', 'A swimming pool', 'A water tower'], a: 1 }
  ],
  'Food & Forest': [
    { q: 'In a food forest, nitrogen-fixing plants are there to…', opts: ['Look pretty', 'Feed the system by fixing nitrogen for their neighbours', 'Keep people out', 'Be harvested first'], a: 1 },
    { q: 'The golden rule of foraging is…', opts: ['Take as much as you can', 'Identify with absolute certainty before you eat anything', 'Forage only at night', 'Avoid all mushrooms forever'], a: 1 },
    { q: 'A montado (cork-oak savannah) is special because it…', opts: ['Grows the fastest', 'Produces food, cork and habitat from one living system', 'Needs no care', 'Is purely ornamental'], a: 1 }
  ],
  'Stewardship': [
    { q: 'In permaculture design, what comes before any intervention?', opts: ['Buying machinery', 'Long, patient observation of the site', 'Pouring a foundation', 'Planting everything at once'], a: 1 },
    { q: 'Defensible space around a building in fire season means…', opts: ['A tall fence', 'Cleared, managed vegetation that slows an approaching fire', 'A bigger house', 'Nothing — fire is unpredictable'], a: 1 },
    { q: 'Good stewardship measures success over…', opts: ['A single season', 'Years and decades — leaving the land better', 'One harvest', 'A weekend'], a: 1 }
  ],
  '_default': [
    { q: 'What makes a practice truly "regenerative" rather than just sustainable?', opts: ['It costs more', 'It actively rebuilds soil, water and life over time', 'It uses new technology', 'It is certified organic'], a: 1 },
    { q: 'You disagree with a technique taught in a module. Best move?', opts: ['Ignore the course', 'Trial it on a small patch and observe the results yourself', 'Assume the course is wrong', 'Give up'], a: 1 },
    { q: 'The point of the capstone land plan is to…', opts: ['Fill time', 'Apply everything to a real piece of land you can act on', 'Earn a badge', 'Re-watch the videos'], a: 1 }
  ]
};

const PATH_RATIONALES = [
  'You read soil confidently in your last assessment, so the AI skipped two soil modules and moved Water earlier — your terrain quiz showed water is your real bottleneck.',
  'Fresh re-sequence: Agroforestry now follows Water — your answers showed strong plant instincts but shaky earthworks vocabulary.',
  'The AI pulled Rainwater Harvesting into your path: three of your recent tutor questions were about summer drought, and it pairs with your current module.',
  'Capstone moved one step closer — your average score (94%) suggests you can compress the remaining design theory and start planning your own land.'
];

const TEAM = [
  { name: 'João Amaral', initials: 'JA', role: 'Founder & Steward (you)', grad: 1, pct: 72, done: 3, last: 'Now', risk: false },
  { name: 'Marta Oliveira', initials: 'MO', role: 'Head of Regeneration', grad: 7, pct: 91, done: 7, last: '2h ago', risk: false },
  { name: 'Dev Santos', initials: 'DS', role: 'Water Lead', grad: 5, pct: 84, done: 6, last: 'Today', risk: false },
  { name: 'Sofia Reis', initials: 'SR', role: 'Land Manager', grad: 6, pct: 58, done: 4, last: 'Yesterday', risk: false },
  { name: 'Liam Walsh', initials: 'LW', role: 'Volunteer Coordinator', grad: 2, pct: 31, done: 1, last: '6d ago', risk: true },
  { name: 'Ana Duarte', initials: 'AD', role: 'Hospitality & Visitors', grad: 3, pct: 66, done: 5, last: 'Today', risk: false },
  { name: 'Tom Becker', initials: 'TB', role: 'Forest Crew', grad: 4, pct: 22, done: 1, last: '12d ago', risk: true },
  { name: 'Inês Costa', initials: 'IC', role: 'Seed & Nursery', grad: 8, pct: 77, done: 5, last: '1h ago', risk: false }
];

const GOAL_PRESETS = {
  'Regenerative Steward': ['land-literacy', 'living-soil', 'land-team-journey', 'agroforestry', 'regen-design', 'capstone-land'],
  'Food Forester': ['living-soil', 'seed-saving', 'agroforestry', 'cork-oak', 'foraging'],
  'Land Restorer': ['land-literacy', 'water-cycles', 'rewilding', 'rainwater', 'regen-design'],
  'Rooted Living': ['nature-connection', 'seasonal-rhythm', 'herbal', 'community-land']
};

const ROLE_OPTIONS = [
  { key: 'land', label: 'Land & Farming', icon: 'sprout', goals: ['Regenerative Steward', 'Food Forester'] },
  { key: 'nature', label: 'Nature & Wellbeing', icon: 'leaf', goals: ['Rooted Living', 'Land Restorer'] },
  { key: 'water', label: 'Water & Climate', icon: 'drop', goals: ['Land Restorer', 'Regenerative Steward'] },
  { key: 'community', label: 'Community & Place', icon: 'people', goals: ['Rooted Living', 'Food Forester'] }
];

/* Gamification — growth-themed levels (nature) + subtle badges. Tuned to lift completion. */
const LEVELS = [
  { xp: 0, name: 'Seed' },
  { xp: 150, name: 'Seedling' },
  { xp: 400, name: 'Sprout' },
  { xp: 800, name: 'Sapling' },
  { xp: 1400, name: 'Young Tree' },
  { xp: 2200, name: 'Grove Keeper' },
  { xp: 3200, name: 'Elder Oak' }
];
const XP = { module: 20, quiz: 50, course: 100, cert: 50 };
const BADGES = [
  { id: 'first-steps', icon: 'sprout', title: 'First Steps', desc: 'Complete your first module' },
  { id: 'rooted', icon: 'tree', title: 'Rooted', desc: 'Finish your first course' },
  { id: 'quiz-ace', icon: 'compass', title: 'Quiz Ace', desc: 'Pass a checkpoint quiz' },
  { id: 'grove', icon: 'leaf', title: 'Grove Keeper', desc: 'Finish three courses' },
  { id: 'streak-7', icon: 'sun', title: 'Seven Suns', desc: 'Keep a 7-day streak' },
  { id: 'pathfinder', icon: 'mountain', title: 'Pathfinder', desc: 'Complete a full learning path' },
  { id: 'curious', icon: 'bird', title: 'Curious Mind', desc: 'Learn across three departments' },
  { id: 'certified', icon: 'flower', title: 'Certified', desc: 'Earn a course certificate' }
];

const DEFAULT_STATE = {
  onboarded: false,
  lang: 'en',
  xp: null,          /* seeded from progress on first boot */
  badges: [],
  streak: 12,
  role: null,
  assignments: [],
  notes: {},
  apiKey: '',
  aiModel: 'claude-opus-4-8',
  goal: 'Regenerative Steward',
  path: ['land-literacy', 'living-soil', 'land-team-journey', 'agroforestry', 'regen-design', 'capstone-land'],
  progress: {
    'land-literacy': { done: true, score: 92 },
    'living-soil': { done: true, score: 92, note: '2 modules skipped by AI' },
    'ethics': { done: true, score: 88, cert: true },
    'land-team-journey': { mod: 0, pct: 20 },
    'fire-safety': { mod: 6, pct: 78 },
    'foraging': { mod: 3, pct: 42 },
    'agroforestry': { mod: 1, pct: 23 },
    'nature-connection': { mod: 0, pct: 6 }
  },
  review: {},
  reminders: [],
  rationaleIdx: 0,
  quizzesPassed: 0,
  week: [38, 52, 24, 65, 41, 0, 32]
};

/* ================= email nudge delivery (Google Apps Script webhook) =================
   Deploy apps-script/nudge-mailer.gs as a web app and paste its /exec URL below.
   Empty webhook = delivery off (UI degrades to "not connected" toasts).
   Sends are consent-gated client-side AND rate-capped server-side (1/person/week). */
const MAIL = {
  webhook: '',
  secret: '67763609855821fded169452'
};

/* ================= i18n — English / Português ================= */
const _lang = () => (typeof S !== 'undefined' && S.lang) || 'en';
const UI = {
  en: {
    nav_home:'Home', nav_library:'Library', nav_paths:'Paths', nav_live:'Live', nav_progress:'Progress', nav_analytics:'Analytics', nav_admin:'Admin', nav_community:'Community',
    comm_title:'Community', comm_sub:'Learn together. Ask questions, share wins and help each other grow — organised by learning path.', comm_channels:'Community', comm_paths:'Learning paths', ch_intro:'Introductions', ch_general:'General', ch_wins:'Wins & harvests',
    comm_new:'Start a discussion', comm_title_ph:'Title — ask a question or start a topic', comm_body_ph:'Share your thoughts…', comm_msg_ph:'Write a message…', comm_post:'Post', comm_send:'Send', comm_reply:'Reply', comm_replies:'replies', comm_reply_one:'reply',
    comm_signin_post:'Sign in to join the conversation', comm_empty:'No posts here yet — be the first to start the conversation 🌱', comm_empty_replies:'No replies yet. Be the first.', comm_back:'Back', comm_posted:'Posted to the community', comm_members:'members learning here', comm_just_now:'just now',
    nudge_bell:'Nudges', nudge_empty:'All caught up 🌿 Nothing needs you right now.', nudge_board_t:"Someone's gaining on you", nudge_board_b:'{name} is {xp} XP ahead — finish one lesson to catch up 🌿', nudge_top_t:"You're leading 🌟", nudge_top_b:'Top of the board this week. One lesson keeps you there.',
    nudge_level_t:'Almost a new level', nudge_level_b:'Just {xp} XP from {lvl} — a quiz gets you there.', nudge_streak_t:'{n}-day streak 🔥', nudge_streak_b:'Do one lesson today to keep it alive.', nudge_lesson_t:'Pick up where you left off', nudge_lesson_b:'“{mod}” in {course} is waiting.', nudge_badge_t:'One course from a badge', nudge_badge_b:'Finish one more course to unlock Grove Keeper 🏅', nudge_welcome:'Welcome back, {name} 🌱',
    notif_title:'Notifications', notif_sub:'Choose how EdenRise nudges you back. Opt-in and GDPR-friendly — change anytime.', notif_browser:'Browser notifications', notif_browser_d:'Gentle desktop reminders — works right away.', notif_email:'Email', notif_email_d:'A weekly nudge to your inbox.', notif_whatsapp:'WhatsApp', notif_whatsapp_d:'Streak & leaderboard pings on WhatsApp.', notif_phone_ph:'WhatsApp number (+351…)', notif_soon:'ready once delivery is connected', notif_on:'Notifications on 🌿', notif_blocked:'Your browser blocked notifications — enable them in site settings.',
    mail_not_connected:'Email delivery isn’t connected yet — deploy the mailer first', mail_sent:'Encouragement sent 🌿', mail_rate_limited:'Already nudged this week — we keep it gentle 🌿', mail_no_email:'No email on this account', mail_not_opted:'hasn’t opted into email nudges — consent first 🌿', mail_optin_sent:'Welcome email sent — check your inbox 📬', mail_failed:'Couldn’t send — try again in a moment',
    search_ph:'Search courses, the land…', org:'EdenRise · Academy',
    featured_eyebrow:'Featured Program · Curated for you by AI', match:'match', modules:'modules', certified:'CERTIFIED',
    all_levels:'All levels', Beginner:'Beginner', Intermediate:'Intermediate', Advanced:'Advanced', 'All levels':'All levels',
    resume_module:'Resume Module', start_learning:'Start learning', start_course:'Start course', rewatch:'Rewatch',
    ai_overview:'AI Overview', my_path:'+ My Path', in_my_path:'✓ In My Path', complete:'complete', est:'est.', left:'left',
    your_ai_path:'Your AI learning path', completed:'Completed', scored:'scored', modules_skipped:'modules skipped by AI',
    in_progress:'In progress', adapted_today:'adapted today', unlocks_after:'Unlocks after assessment', next_up:'Next up', locked:'Locked',
    continue_learning:'Continue learning', synced_devices:'Synced across your devices', assigned_you:'Assigned to you', from_stewardship:'From EdenRise · Stewardship',
    trending:'Trending at EdenRise', community_learning:'What the EdenRise community is learning', because_completed:'Because you completed', ai_recommendations:'AI recommendations', see_all:'See all →',
    generated_by_ai:'✦ Generated by EdenRise AI · updated 2h ago', your_path_to:'Your path to', path_intro:'Built from your role, your last 6 assessments, and the skills gap analysis your manager shared. It reshapes itself every time you learn.', regenerate_path:'Regenerate path ↺', why_order:'Why this order?',
    learning_streak:'Learning streak', personal_best:'▲ Personal best', this_week:'This week', vs_last_week:'▲ 38% vs last week', skills_verified:'Skills verified', from_quizzes:'from quizzes', avg_score:'Avg. assessment score', top_5:'— Top 5% at EdenRise',
    ai_path_chip:'✦ AI PATH', required:'REQUIRED', team_goal:'TEAM GOAL', new:'NEW', module:'MODULE', this_week_rank:'THIS WEEK', cert_issued:'cert issued', due:'Due',
    library_title:'Library', courses_tended:'courses · tended by the EdenRise team, sequenced by EdenRise AI.', filter_library:'Filter the library…', all:'All', nothing_matches:'Nothing matches — try another filter or ask the AI tutor to find it.',
    in_ai_rotation:'✦ In AI rotation', learners:'learners', quiz_me:'Quiz me', modules_h:'Modules', tap_module:'Tap any module to play', coming_soon:'Coming soon', more_in:'More in', related_courses:'Related courses',
    ask_tutor:'✦ Ask the tutor', notes_transcript:'📝 Notes & transcript', mark_complete:'✓ Mark module complete', soon_sub:"This lesson is being filmed for the Land Team Journey — we'll let you know the moment it's ready.", play_lesson:'▶ Play lesson',
    live_title:'Live', live_sub:'Sessions with real humans — office hours, AMAs and workshops. Replays land in the Library within a day.', watching:'watching', join_now:'Join now', remind_me:'Remind me',
    my_progress:'My Progress', progress_sub:'Your growth at EdenRise. The more you learn, the more the grove grows — points, streaks and badges are here to keep you finishing what you start.',
    level_ab:'Lv', xp:'XP', xp_to:'XP to', highest_level:'Highest level — Elder Oak 🌳', board_rank:"Leader's board rank", of:'of', badges_earned:'Badges earned', nice_work:'▲ Nice work', earn_first:'Earn your first', courses_finished:'Courses finished',
    badges_h:'Badges', badges_sub:'Small marks of growth — earned for finishing, not just starting.', locked_dot:'Locked ·', leaders_board:"Leader's board · this week", board_sub:'Friendly, resets every Monday. A little competition keeps everyone finishing.', keep_alive:'▲ Keep it alive',
    you:'you', xp_ahead_1:'is just', xp_ahead_2:'ahead of you — finish one module to catch up 🌿', top_board:"You're top of the board this week. Keep the grove growing.", path_points:'Every step completed is points on the board.',
    ob_welcome:'Welcome to EdenRise', ob_step:'Step', ob_hi:'Welcome,', ob_pick_handle:"Pick a username — it's how others see you in the community.", ob_role_q:'And what do you do?', ob_q1:'What do you do, João?', ob_q1_sub:'The AI uses your role to seed your first learning path. You can change everything later.', ob_skip:'Skip — explore on my own', ob_continue:'Continue →',
    ob_destination:'Your destination', ob_q2:'Pick a goal to work toward', ob_q2_sub:'The AI sequences courses toward this goal and re-plans as you prove skills.', ob_build:'Build my path ✦', ob_building:'Building your path to', courses_adaptive:'courses · adaptive', track_more:'track & more',
    tutor_name:'EdenRise Tutor', tutor_demo:'● Demo mode · scripted replies', summarize_course:'Summarize this course', quiz_now:'Quiz me now', whats_due:"What's due?", build_path:'Build me a path', ask_anything:'Ask anything about your land or courses…',
    connect_ai:'✦ Connect real AI', api_note:"Paste an Anthropic API key to power the tutor with Claude. The key is stored only in this browser's localStorage and sent only to api.anthropic.com.", save:'Save', use_demo:'Use demo mode',
    footer_tag:'· The learning academy of EdenRise',
    prof_title:'Profile', prof_sub:'Your account and how you appear across EdenRise.', prof_edit:'Edit profile', prof_name:'Full name', prof_username:'Username', prof_role:'What you do', prof_goal:'Your learning goal', prof_save:'Save changes', prof_saved:'Profile saved', prof_via:'via', prof_signout:'Sign out', prof_guest:"You're exploring as a guest. Sign in to save your profile and progress to the cloud.", prof_signin:'Sign in',
    auth_welcome:'Welcome to EdenRise Academy', auth_sub:'Sign in to save your progress across every device.', auth_google:'Continue with Google', auth_or:'or', auth_email:'Email', auth_password:'Password', auth_name:'Your name',
    auth_signin:'Sign in', auth_signup:'Create account', auth_to_signup:'New here? Create an account', auth_to_signin:'Already have an account? Sign in', auth_guest:'Continue as guest',
    auth_consent:'I agree to EdenRise storing my learning progress to sync it across my devices (GDPR).', auth_consent_req:'Please accept the privacy notice to continue.', auth_working:'One moment…', auth_signout:'Sign out', auth_signed_as:'Signed in as',
    auth_forgot:'Forgot password?', auth_reset_sent:'Reset link sent — check your inbox 🌿', auth_reset_need_email:'Type your email above first, then tap "Forgot password?" again.', auth_verify_sent:'Welcome! We sent a verification link to your email 🌿'
  },
  pt: {
    nav_home:'Início', nav_library:'Biblioteca', nav_paths:'Percursos', nav_live:'Ao Vivo', nav_progress:'Progresso', nav_analytics:'Análises', nav_admin:'Admin', nav_community:'Comunidade',
    comm_title:'Comunidade', comm_sub:'Aprendam juntos. Façam perguntas, partilhem conquistas e ajudem-se a crescer — organizado por percurso.', comm_channels:'Comunidade', comm_paths:'Percursos', ch_intro:'Apresentações', ch_general:'Geral', ch_wins:'Conquistas',
    comm_new:'Iniciar uma discussão', comm_title_ph:'Título — faça uma pergunta ou inicie um tema', comm_body_ph:'Partilhe as suas ideias…', comm_msg_ph:'Escreva uma mensagem…', comm_post:'Publicar', comm_send:'Enviar', comm_reply:'Responder', comm_replies:'respostas', comm_reply_one:'resposta',
    comm_signin_post:'Entre para participar na conversa', comm_empty:'Ainda sem publicações — seja o primeiro a começar a conversa 🌱', comm_empty_replies:'Ainda sem respostas. Seja o primeiro.', comm_back:'Voltar', comm_posted:'Publicado na comunidade', comm_members:'a aprender aqui', comm_just_now:'agora',
    nudge_bell:'Lembretes', nudge_empty:'Tudo em dia 🌿 Nada precisa de si agora.', nudge_board_t:'Estão a aproximar-se de si', nudge_board_b:'{name} está {xp} XP à frente — termine uma lição para alcançar 🌿', nudge_top_t:'Está na liderança 🌟', nudge_top_b:'No topo do ranking esta semana. Uma lição mantém-no lá.',
    nudge_level_t:'Quase um novo nível', nudge_level_b:'A apenas {xp} XP de {lvl} — um teste leva-o lá.', nudge_streak_t:'Sequência de {n} dias 🔥', nudge_streak_b:'Faça uma lição hoje para a manter viva.', nudge_lesson_t:'Continue de onde parou', nudge_lesson_b:'“{mod}” em {course} está à espera.', nudge_badge_t:'A um curso de um distintivo', nudge_badge_b:'Termine mais um curso para desbloquear Guardião do Bosque 🏅', nudge_welcome:'Bem-vindo de volta, {name} 🌱',
    notif_title:'Notificações', notif_sub:'Escolha como a EdenRise o incentiva a voltar. Opcional e compatível com o RGPD — mude quando quiser.', notif_browser:'Notificações do navegador', notif_browser_d:'Lembretes suaves no ecrã — funcionam já.', notif_email:'Email', notif_email_d:'Um lembrete semanal no seu email.', notif_whatsapp:'WhatsApp', notif_whatsapp_d:'Avisos de sequência e ranking no WhatsApp.', notif_phone_ph:'Número de WhatsApp (+351…)', notif_soon:'pronto assim que o envio for ligado', notif_on:'Notificações ativas 🌿', notif_blocked:'O navegador bloqueou as notificações — ative-as nas definições do site.',
    mail_not_connected:'O envio de emails ainda não está ligado — implemente primeiro o mailer', mail_sent:'Incentivo enviado 🌿', mail_rate_limited:'Já foi incentivado esta semana — mantemos a suavidade 🌿', mail_no_email:'Esta conta não tem email', mail_not_opted:'não ativou os lembretes por email — consentimento primeiro 🌿', mail_optin_sent:'Email de boas-vindas enviado — veja a sua caixa 📬', mail_failed:'Não foi possível enviar — tente novamente',
    search_ph:'Procurar cursos, a terra…', org:'EdenRise · Academia',
    featured_eyebrow:'Programa em Destaque · Escolhido para si pela IA', match:'compatível', modules:'módulos', certified:'CERTIFICADO',
    all_levels:'Todos os níveis', Beginner:'Iniciante', Intermediate:'Intermédio', Advanced:'Avançado', 'All levels':'Todos os níveis',
    resume_module:'Retomar Módulo', start_learning:'Começar', start_course:'Começar curso', rewatch:'Rever',
    ai_overview:'Visão da IA', my_path:'+ Meu Percurso', in_my_path:'✓ No Meu Percurso', complete:'concluído', est:'aprox.', left:'restantes',
    your_ai_path:'O seu percurso com IA', completed:'Concluído', scored:'nota', modules_skipped:'módulos ignorados pela IA',
    in_progress:'Em curso', adapted_today:'adaptado hoje', unlocks_after:'Desbloqueia após avaliação', next_up:'A seguir', locked:'Bloqueado',
    continue_learning:'Continuar a aprender', synced_devices:'Sincronizado nos seus dispositivos', assigned_you:'Atribuído a si', from_stewardship:'De EdenRise · Zeladoria',
    trending:'Em Destaque na EdenRise', community_learning:'O que a comunidade EdenRise está a aprender', because_completed:'Porque concluiu', ai_recommendations:'Recomendações da IA', see_all:'Ver tudo →',
    generated_by_ai:'✦ Gerado pela IA da EdenRise · atualizado há 2h', your_path_to:'O seu percurso para', path_intro:'Criado a partir da sua função, das suas últimas 6 avaliações e da análise de lacunas de competências. Reorganiza-se sempre que aprende.', regenerate_path:'Regenerar percurso ↺', why_order:'Porquê esta ordem?',
    learning_streak:'Sequência de estudo', personal_best:'▲ Recorde pessoal', this_week:'Esta semana', vs_last_week:'▲ 38% vs semana passada', skills_verified:'Competências verificadas', from_quizzes:'de questionários', avg_score:'Nota média das avaliações', top_5:'— Top 5% na EdenRise',
    ai_path_chip:'✦ PERCURSO IA', required:'OBRIGATÓRIO', team_goal:'META DE EQUIPA', new:'NOVO', module:'MÓDULO', this_week_rank:'ESTA SEMANA', cert_issued:'certificado emitido', due:'Prazo',
    library_title:'Biblioteca', courses_tended:'cursos · cuidados pela equipa EdenRise, sequenciados pela IA da EdenRise.', filter_library:'Filtrar a biblioteca…', all:'Todos', nothing_matches:'Nada corresponde — experimente outro filtro ou peça ao tutor de IA.',
    in_ai_rotation:'✦ Em rotação de IA', learners:'alunos', quiz_me:'Testar-me', modules_h:'Módulos', tap_module:'Toque num módulo para reproduzir', coming_soon:'Em breve', more_in:'Mais em', related_courses:'Cursos relacionados',
    ask_tutor:'✦ Perguntar ao tutor', notes_transcript:'📝 Notas e transcrição', mark_complete:'✓ Marcar como concluído', soon_sub:'Esta lição está a ser filmada para a Jornada da Equipa da Terra — avisamos assim que estiver pronta.', play_lesson:'▶ Reproduzir lição',
    live_title:'Ao Vivo', live_sub:'Sessões com pessoas reais — horas abertas, perguntas e respostas e workshops. As gravações ficam na Biblioteca em um dia.', watching:'a assistir', join_now:'Entrar agora', remind_me:'Lembrar-me',
    my_progress:'O Meu Progresso', progress_sub:'O seu crescimento na EdenRise. Quanto mais aprende, mais o bosque cresce — pontos, sequências e distintivos ajudam-no a terminar o que começa.',
    level_ab:'Nv', xp:'XP', xp_to:'XP para', highest_level:'Nível máximo — Carvalho Ancião 🌳', board_rank:'Posição no ranking', of:'de', badges_earned:'Distintivos ganhos', nice_work:'▲ Bom trabalho', earn_first:'Ganhe o seu primeiro', courses_finished:'Cursos terminados',
    badges_h:'Distintivos', badges_sub:'Pequenas marcas de crescimento — ganhas por terminar, não apenas por começar.', locked_dot:'Bloqueado ·', leaders_board:'Ranking · esta semana', board_sub:'Amigável, reinicia todas as segundas. Uma competição saudável mantém todos a terminar.', keep_alive:'▲ Mantenha viva',
    you:'você', xp_ahead_1:'está apenas', xp_ahead_2:'à sua frente — termine um módulo para alcançar 🌿', top_board:'Está no topo do ranking esta semana. Continue a fazer crescer o bosque.', path_points:'Cada passo concluído são pontos no ranking.',
    ob_welcome:'Bem-vindo à EdenRise', ob_step:'Passo', ob_hi:'Bem-vindo,', ob_pick_handle:'Escolha um nome de utilizador — é assim que os outros o veem na comunidade.', ob_role_q:'E o que faz?', ob_q1:'O que faz, João?', ob_q1_sub:'A IA usa a sua função para criar o seu primeiro percurso. Pode mudar tudo mais tarde.', ob_skip:'Ignorar — explorar sozinho', ob_continue:'Continuar →',
    ob_destination:'O seu destino', ob_q2:'Escolha um objetivo', ob_q2_sub:'A IA sequencia cursos para este objetivo e replaneia à medida que prova competências.', ob_build:'Criar o meu percurso ✦', ob_building:'A criar o seu percurso para', courses_adaptive:'cursos · adaptativo', track_more:'percurso e mais',
    tutor_name:'Tutor EdenRise', tutor_demo:'● Modo demo · respostas guionadas', summarize_course:'Resumir este curso', quiz_now:'Testar-me agora', whats_due:'O que falta entregar?', build_path:'Criar um percurso', ask_anything:'Pergunte sobre a sua terra ou cursos…',
    connect_ai:'✦ Ligar IA real', api_note:'Cole uma chave da API Anthropic para o tutor usar o Claude. A chave fica apenas neste navegador (localStorage) e é enviada apenas para api.anthropic.com.', save:'Guardar', use_demo:'Usar modo demo',
    footer_tag:'· A academia de aprendizagem da EdenRise',
    prof_title:'Perfil', prof_sub:'A sua conta e como aparece na EdenRise.', prof_edit:'Editar perfil', prof_name:'Nome completo', prof_username:'Nome de utilizador', prof_role:'O que faz', prof_goal:'O seu objetivo de aprendizagem', prof_save:'Guardar alterações', prof_saved:'Perfil guardado', prof_via:'via', prof_signout:'Sair', prof_guest:'Está a explorar como convidado. Entre para guardar o seu perfil e progresso na cloud.', prof_signin:'Entrar',
    auth_welcome:'Bem-vindo à EdenRise Academy', auth_sub:'Entre para guardar o seu progresso em todos os dispositivos.', auth_google:'Continuar com Google', auth_or:'ou', auth_email:'Email', auth_password:'Palavra-passe', auth_name:'O seu nome',
    auth_signin:'Entrar', auth_signup:'Criar conta', auth_to_signup:'Novo por aqui? Criar conta', auth_to_signin:'Já tem conta? Entrar', auth_guest:'Continuar como convidado',
    auth_consent:'Concordo que a EdenRise guarde o meu progresso para o sincronizar entre dispositivos (RGPD).', auth_consent_req:'Aceite o aviso de privacidade para continuar.', auth_working:'Um momento…', auth_signout:'Sair', auth_signed_as:'Sessão iniciada como',
    auth_forgot:'Esqueceu a palavra-passe?', auth_reset_sent:'Link de recuperação enviado — veja o seu email 🌿', auth_reset_need_email:'Escreva o seu email acima e toque de novo em "Esqueceu a palavra-passe?".', auth_verify_sent:'Bem-vindo! Enviámos um link de verificação para o seu email 🌿'
  }
};
function t(k){ const l = _lang(); return (UI[l] && UI[l][k] != null ? UI[l][k] : UI.en[k]) ?? k; }

const CATS_PT = { 'Leadership':'Liderança', 'Nature Connection':'Ligação à Natureza', 'Land & Soil':'Terra e Solo', 'Water & Climate':'Água e Clima', 'Food & Forest':'Comida e Floresta', 'Stewardship':'Zeladoria', 'Craft & Hands':'Ofício e Mãos', 'Wellbeing':'Bem-estar', 'Community':'Comunidade' };
const tcat = c => _lang() === 'pt' ? (CATS_PT[c] || c) : c;
const PILLARS_PT = { 'Regenerative':'Regenerativo', 'Rooted':'Enraizado', 'Restorative':'Restaurador', 'Connected':'Conectado', 'Elemental':'Elemental', 'Meaningful':'Significativo' };
const tpillar = l => _lang() === 'pt' ? (PILLARS_PT[l] || l) : l;
const LEVELS_PT = ['Semente','Rebento','Broto','Muda','Árvore Jovem','Guardião do Bosque','Carvalho Ancião'];
const tlevel = i => _lang() === 'pt' ? (LEVELS_PT[i] || LEVELS[i].name) : LEVELS[i].name;
const ROLES_PT = { land:'Terra e Agricultura', nature:'Natureza e Bem-estar', water:'Água e Clima', community:'Comunidade e Lugar' };
const trole = r => _lang() === 'pt' ? (ROLES_PT[r.key] || r.label) : r.label;
const GOALS_PT = { 'Regenerative Steward':'Zelador Regenerativo', 'Food Forester':'Guardião da Floresta Alimentar', 'Land Restorer':'Restaurador da Terra', 'Rooted Living':'Vida Enraizada' };
const tgoal = g => _lang() === 'pt' ? (GOALS_PT[g] || g) : g;
const BADGES_PT = {
  'first-steps':['Primeiros Passos','Conclua o seu primeiro módulo'], 'rooted':['Enraizado','Termine o seu primeiro curso'],
  'quiz-ace':['Ás dos Testes','Passe num questionário'], 'grove':['Guardião do Bosque','Termine três cursos'],
  'streak-7':['Sete Sóis','Mantenha uma sequência de 7 dias'], 'pathfinder':['Desbravador','Complete um percurso inteiro'],
  'curious':['Mente Curiosa','Aprenda em três departamentos'], 'certified':['Certificado','Ganhe um certificado de curso']
};
const tbadge = (b, f) => { if (_lang() === 'pt' && BADGES_PT[b.id]) return f === 'title' ? BADGES_PT[b.id][0] : BADGES_PT[b.id][1]; return f === 'title' ? b.title : b.desc; };

/* Course content — Portuguese (title / desc / modules). Missing fields fall back to English. */
const COURSE_PT = {
  'land-team-journey': { title:'Jornada da Equipa da Terra', desc:'A jornada de crescimento da Equipa da Terra — a mentalidade e os hábitos que moldam como trabalhamos a terra, e uns aos outros. Começa com uma pergunta que muda a forma como aparecemos.', modules:['Acima da Linha, Abaixo da Linha','Não Há Fracasso, Só Feedback','Em breve','Em breve'] },
  'land-literacy': { title:'Ler a Terra', desc:'Antes de mudar uma paisagem, aprenda a lê-la. Declive, água, solo, sol e sucessão — a literacia com que começa todo o ato de zeladoria.', modules:['Ficar quieto: como observar','Ler o declive e a água','O solo ao toque e à vista','Sol, sombra e exposição','Sucessão e o que a terra quer','Mapear o seu terreno'] },
  'living-soil': { title:'Solo Vivo', desc:'O solo não é terra morta — é uma comunidade viva. Conheça o microbioma sob os seus pés e as práticas que o alimentam em vez de o esgotar.', modules:['A teia alimentar do solo','Porque deixámos de lavrar','Compostagem como inoculante','Culturas de cobertura e raízes vivas','Cobertura morta e solo nu','Ler uma análise de solo'] },
  'water-cycles': { title:'A Água e a Paisagem Viva', desc:'Domine o pequeno ciclo da água de que a sua terra depende. Este programa adapta-se ao seu terreno — a IA da EdenRise reordena cada módulo conforme o que já sabe.', modules:['O pequeno ciclo da água','Para onde vai a sua água','Abrandar, espalhar, infiltrar','Valas de infiltração em curva de nível','Charcos e represas','Reidratar terra seca','Águas cinzentas, com cuidado','Proteger uma horta da seca','Ler uma bacia','Nascentes e olheiros','Medir a infiltração','Avaliação final'] },
  'agroforestry': { title:'Agrofloresta e a Floresta Comestível', desc:'Construa uma floresta que o alimenta. Sete camadas, fixadores de azoto e a arte paciente de desenhar um sistema cada vez mais abundante.', modules:['As sete camadas','Escolher o dossel','Fixadores de azoto e espécies de apoio','Consórcios que funcionam','Plantar para a sucessão','Cuidar da floresta jovem'] },
  'regen-design': { title:'Desenhar com a Natureza', desc:'Desenho de permacultura da observação ao plano: zonas, setores e como colocar cada elemento para que a terra faça o trabalho.', modules:['Observar antes de agir','Zonas e setores','Colocar elementos por relação','Dos padrões aos detalhes','O plano do sítio inteiro'] },
  'capstone-land': { title:'Projeto Final: O Seu Plano de Terra', desc:'O final avaliado: produza e apresente um plano de regeneração de um ano para uma terra real. A IA da EdenRise avalia água, solo e sequência.', modules:['Apresentar o seu sítio','Desenho a começar pela água','Sequenciar o primeiro ano','Ensaio com feedback da IA','Revisão avaliada por IA'] },
  'composting': { title:'A Arte da Compostagem', desc:'Transforme resíduos em ouro negro. Pilhas quentes, frias, minhocas e as proporções simples que fazem composto de forma fiável, sem cheiro.', modules:['Verdes e castanhos','Fazer uma pilha quente','Minhocas e vermicomposto','Chá de composto e extratos','Resolver maus cheiros','Usar o composto pronto'] },
  'seed-saving': { title:'Guardar Sementes e Variedades Antigas', desc:'Mantenha a linhagem viva. Guarde, seque e armazene semente da sua horta — e as variedades de polinização aberta a proteger no Alentejo.', modules:['Porque importa a polinização aberta','Isolamento e pureza','Processar semente húmida e seca','Secar e armazenar','Uma biblioteca de sementes'] },
  'foraging': { title:'Colher no Alentejo', desc:'Saia e volte alimentado. Ervas silvestres, cogumelos, plantas e a regra de ouro — identifique com certeza, colha com cuidado.', modules:['A mentalidade do colhedor','Identificar com certeza','Verduras silvestres do prado','Cogumelos: respeito e cautela','Ervas e chás silvestres','Ética da colheita','Calendário sazonal','Conservar a colheita silvestre','Sósias a nunca confundir','Um primeiro passeio de colheita'] },
  'native-flora': { title:'Flora Nativa e Polinizadores', desc:'Traga de volta o zumbido. Plantas nativas, sebes e as pequenas mudanças que tornam um jardim num corredor de polinizadores.', modules:['Quem são os seus polinizadores','Plantas nativas primeiro','Sebes e corredores','Floração todo o ano','Um canteiro de polinizadores'] },
  'rainwater': { title:'Captação de Água da Chuva e Valas', desc:'Aproveite cada gota. Telhados, tanques, valas e terraplenagens que guardam as chuvas de inverno no solo para o longo verão alentejano.', modules:['Dimensionar a bacia','Tanques e primeiro fluxo','Cavar em curva de nível','Extravasamento e segurança','Guardar água no solo'] },
  'rewilding': { title:'Rewilding e Habitat', desc:'Recue e deixe a vida regressar. Onde intervir, onde esperar e como medir uma paisagem a voltar à vida.', modules:['Ler o que falta','Espécies-chave','Quando não fazer nada','Charcos, troncos e limites','Medir o regresso'] },
  'cork-oak': { title:'O Montado e o Sobreiro', desc:'A obra-prima viva do Alentejo. Como a savana de sobreiros alimenta pessoas, gado e vida selvagem — e como cuidá-la por séculos.', modules:['O que é um montado','O ciclo da cortiça','Pastoreio sob as árvores','Bolota, porcos e pessoas','Regenerar sobreiros velhos'] },
  'natural-building': { title:'Construção Natural com Terra', desc:'Construa com o que a terra dá. Taipa, cal, reboco de terra e as paredes quentes que abrigam o Alentejo há gerações.', modules:['A terra como material','Testar a sua mistura','Bases de taipa e adobe','Rebocos de cal e terra','Acabamentos que duram'] },
  'herbal': { title:'A Botica de Ervas', desc:'Cultive o seu remédio. Um jardim de ervas medicinais e as preparações simples — chás, tinturas, pomadas — que fazem de uma colheita uma botica.', modules:['Um jardim que cura','Colher na altura certa','Secar e guardar ervas','Chás, tinturas e infusões','Pomadas e bálsamos','A sua botica caseira'] },
  'fire-safety': { title:'Segurança contra Incêndios na Terra', desc:'O verão alentejano pede respeito. Espaço defensável, janelas de queima seguras, equipamento e o que fazer nos primeiros sessenta segundos.', modules:['A época de fogos de 2026','Espaço defensável junto a edifícios','Janelas de queima seguras','Ferramentas e água à mão','Ler o vento e o terreno','Os primeiros 60 segundos','Alertar e evacuar','Limpar terreno em segurança','Verificação de certificação'] },
  'ethics': { title:'Ética da Zeladoria e Direitos da Terra', desc:'A zeladoria é uma relação de dever. Direitos da terra, direitos de água, vizinhos e a ética de deixar um lugar melhor do que o encontrou.', modules:['A terra como relação, não bem','Direitos de água e partilha','Trabalhar com vizinhos','Deixar melhor','Verificação de certificação'] },
  'seasonal-rhythm': { title:'Viver ao Ritmo das Estações', desc:'Reafine a sua vida ao calendário da terra. Uma série em seis partes sobre trabalhar com as estações do Alentejo, e não contra elas.', modules:['A roda do ano','Primavera: plantar e energia','Verão: cuidar e descansar','Outono: colher e guardar','Inverno: quietude e planeamento'] },
  'nature-connection': { title:'A Arte de Reparar', desc:'Uma prática de atenção. Caminhadas lentas, lugares de contemplação e o hábito diário de reparar que transforma onde vive num lugar a que pertence.', modules:['O seu lugar de contemplação','Alargar os sentidos','Um diário diário da natureza','Acompanhar mudanças ao longo de semanas','Pertencer a um lugar','Partilhar o que vê'] },
  'community-land': { title:'Comunidade e os Bens Comuns', desc:'A terra cura mais depressa em conjunto. Ferramentas partilhadas, mutirões e as estruturas que permitem a uma comunidade cuidar de um lugar como um só.', modules:['Porque funcionam os comuns','Partilhar ferramentas e trabalho','Organizar um mutirão','Decidir sem esgotamento','Um plano comunitário de 90 dias'] }
};
const ctitle = c => (_lang() === 'pt' && COURSE_PT[c.id] && COURSE_PT[c.id].title) || c.title;
const cdesc = c => (_lang() === 'pt' && COURSE_PT[c.id] && COURSE_PT[c.id].desc) || c.desc;
const cmods = c => (_lang() === 'pt' && COURSE_PT[c.id] && COURSE_PT[c.id].modules) || c.modules;
const tnote = n => _lang() === 'pt' ? String(n).replace('modules skipped by AI', 'módulos ignorados pela IA').replace('module skipped by AI', 'módulo ignorado pela IA') : n;
