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
    id: 'land-team-journey', title: 'Above the Line', cat: 'Leadership', grad: 4, icon: 'compass',
    level: 'All levels', rating: 4.9, learners: 340, ai: true, featured: true, poster: 'media/above-below-line-cover.jpg',
    desc: 'The Land Team\'s journey of growth — the mindset and habits that shape how we work the land, and each other. It begins with one question that changes how you show up.',
    modules: ['Above the Line, Below the Line', 'No Failure, Only Feedback', 'Attention to Detail', 'Total Responsibility', 'A Learner for Life', "Don't Assume, Clarify", 'The Benchmark of Excellence'],
    moduleDurations: [5, 5, 4, 3, 3, 4, 4],   /* real Vimeo lengths: 5:06 4:29 4:05 3:27 3:27 4:15 3:38 */
    moduleMedia: [
      { type: 'vimeo', id: '1206810959' },   /* 1. Acima da Linha, Abaixo da Linha */
      { type: 'vimeo', id: '1206811136' },   /* 2. Não Há Fracasso, Só Feedback */
      { type: 'vimeo', id: '1206817926' },   /* 3. Atenção ao Detalhe */
      { type: 'vimeo', id: '1207365126' },   /* 4. Responsabilidade Total */
      { type: 'vimeo', id: '1207365326' },   /* 5. Seja um Aprendiz para a Vida */
      { type: 'vimeo', id: '1207317081' },   /* 6. Não Presuma, Esclareça */
      { type: 'vimeo', id: '1207317283' }    /* 7. Benchmark de Excelência */
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
    id: 'fire-safety', title: 'Fire Safety on the Land', cat: 'Stewardship', grad: 4, icon: 'fire', recertMonths: 12,
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
  },
  {
    id: 'fire-truck-training', title: 'Fire Truck Training', cat: 'Stewardship', grad: 4, icon: 'fire', recertMonths: 12, featured: true,
    level: 'All levels', rating: 5.0, learners: 0, isNew: true, poster: 'media/covers/fire-truck-training.jpg',
    desc: 'Hands-on operation of the land’s fire truck — start it, drive it, fill it, and put water exactly where it’s needed. When fire season comes, everyone should know how to move water.',
    modules: ['Starting & Driving the Truck', 'Filling the Water Tank', 'Off-Road, Pump & Spray', 'Power, Safety & the Drill'],
    moduleDurations: [6, 10, 10, 9],   /* real Vimeo lengths: 5:55 10:11 9:49 9:28 */
    moduleMedia: [
      { type: 'vimeo', id: '1207710846' },   /* 1. Start & Drive */
      { type: 'vimeo', id: '1208024648' },   /* 2. Water Fill */
      { type: 'vimeo', id: '1208024647' },   /* 3. Off-road, Pump & Spray */
      { type: 'vimeo', id: '1208024649' }     /* 4. Power, Safety & Drill */
    ]
  }
];
/* designed brand covers — every course ships with art (land-team-journey keeps its filmed cover) */
CATALOG.forEach(c => { if (!c.poster) c.poster = 'media/covers/' + c.id + '.jpg'; });

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
  streak: 0,
  bestStreak: 0,
  mins: {},          /* real minutes learned, by day */
  quizScores: [],
  role: null,
  assignments: [],
  notes: {},
  apiKey: '',
  aiModel: 'claude-opus-4-8',
  goal: 'Regenerative Steward',
  path: ['land-literacy', 'living-soil', 'land-team-journey', 'agroforestry', 'regen-design', 'capstone-land'],
  progress: {},      /* truth only — earned, never seeded */
  review: {},
  reminders: [],
  rationaleIdx: 0,
  quizzesPassed: 0,
  trainingLog: []   /* append-only continuous-training hours ledger (40h compliance) */
};

/* ================= course invitation copy — hook headline + subheadline =================
   MasterClass-style invites: every course opens with a line that pulls you in. */
const COURSE_HOOKS = {
  'fire-truck-training': ['When fire comes, know the truck.', 'Start it, drive it, fill it, and put water where it’s needed — hands-on, step by step.'],
  'land-team-journey': ['One question changes how you show up.', 'Above the line or below it — the mindset the whole journey grows from.'],
  'land-literacy': ['Learn to read the land like a story.', 'Slope, soil, water, wind — see what the land has been telling you all along.'],
  'living-soil': ['There’s a universe under your feet.', 'Feed the soil, and everything above it thrives.'],
  'water-cycles': ['Water writes the landscape.', 'Slow it, sink it, store it — become fluent in the land’s oldest language.'],
  'agroforestry': ['Plant a forest you can eat.', 'Layers, guilds and time — design abundance that outlives you.'],
  'regen-design': ['Design the way nature does.', 'Patterns, edges and flows — turn observation into regeneration.'],
  'capstone-land': ['Your land. Your plan.', 'Bring everything together into a living plan for a real place.'],
  'composting': ['Turn waste into wealth.', 'The quiet alchemy of decay — master the art of living compost.'],
  'seed-saving': ['Every seed is a memory.', 'Save, select and pass on the varieties that belong to this land.'],
  'foraging': ['The Alentejo is already a pantry.', 'What’s edible, medicinal and sacred on the paths you walk every day.'],
  'native-flora': ['Meet your wild neighbours.', 'Native plants and pollinators — the quiet workforce of a living land.'],
  'rainwater': ['Catch the rain before it runs.', 'Swales, tanks and soil — harvest the winter for the summer.'],
  'rewilding': ['Let the wild come home.', 'Habitat, corridors and patience — invite life back in.'],
  'cork-oak': ['The montado is a masterpiece.', 'Portugal’s cork oak landscape — tending a thousand-year system.'],
  'natural-building': ['Build with what the land gives.', 'Earth, straw and lime — structures that breathe.'],
  'herbal': ['Your pharmacy grows outside.', 'Gather, dry and prepare the plants that heal.'],
  'fire-safety': ['Fire season is coming. Be ready.', 'Defensible space, fuel breaks and calm plans for hot days.'],
  'ethics': ['Whose land is it, really?', 'Stewardship, rights and responsibility — the ethics beneath everything.'],
  'seasonal-rhythm': ['Live at the speed of seasons.', 'Plant, harvest, rest — sync your year with the land’s calendar.'],
  'nature-connection': ['Slow down. Notice everything.', 'The art of attention — the skill every other skill grows from.'],
  'community-land': ['No one stewards alone.', 'Commons, councils and shared care for shared ground.']
};
const COURSE_HOOKS_PT = {
  'fire-truck-training': ['Quando o fogo vem, conheça o camião.', 'Arrancar, conduzir, encher e pôr água onde é preciso — na prática, passo a passo.'],
  'land-team-journey': ['Uma pergunta muda como aparecemos.', 'Acima ou abaixo da linha — a mentalidade de onde cresce toda a jornada.'],
  'land-literacy': ['Aprenda a ler a terra como uma história.', 'Declive, solo, água, vento — veja o que a terra sempre lhe quis dizer.'],
  'living-soil': ['Há um universo debaixo dos seus pés.', 'Alimente o solo, e tudo acima dele floresce.'],
  'water-cycles': ['A água escreve a paisagem.', 'Abrande-a, infiltre-a, guarde-a — fale a língua mais antiga da terra.'],
  'agroforestry': ['Plante uma floresta que se come.', 'Camadas, consórcios e tempo — desenhe uma abundância que lhe sobrevive.'],
  'regen-design': ['Desenhe como a natureza desenha.', 'Padrões, margens e fluxos — transforme observação em regeneração.'],
  'capstone-land': ['A sua terra. O seu plano.', 'Junte tudo num plano vivo para um lugar real.'],
  'composting': ['Transforme resto em riqueza.', 'A alquimia silenciosa da decomposição — a arte do composto vivo.'],
  'seed-saving': ['Cada semente é uma memória.', 'Guarde, selecione e transmita as variedades que pertencem a esta terra.'],
  'foraging': ['O Alentejo já é uma despensa.', 'O que é comestível, medicinal e sagrado nos caminhos que percorre.'],
  'native-flora': ['Conheça os seus vizinhos selvagens.', 'Flora nativa e polinizadores — a força de trabalho silenciosa da terra.'],
  'rainwater': ['Apanhe a chuva antes que fuja.', 'Valas, cisternas e solo — colha o inverno para o verão.'],
  'rewilding': ['Deixe o selvagem voltar a casa.', 'Habitat, corredores e paciência — convide a vida a regressar.'],
  'cork-oak': ['O montado é uma obra-prima.', 'A paisagem do sobreiro — cuidar de um sistema com mil anos.'],
  'natural-building': ['Construa com o que a terra dá.', 'Terra, palha e cal — estruturas que respiram.'],
  'herbal': ['A sua farmácia cresce lá fora.', 'Colha, seque e prepare as plantas que curam.'],
  'fire-safety': ['A época dos fogos vem aí. Esteja pronto.', 'Espaço defensável, faixas de gestão e planos serenos para dias quentes.'],
  'ethics': ['De quem é a terra, realmente?', 'Zeladoria, direitos e responsabilidade — a ética por baixo de tudo.'],
  'seasonal-rhythm': ['Viva ao ritmo das estações.', 'Plantar, colher, descansar — sincronize o ano com o calendário da terra.'],
  'nature-connection': ['Abrande. Repare em tudo.', 'A arte da atenção — a competência de onde crescem todas as outras.'],
  'community-land': ['Ninguém cuida sozinho.', 'Baldios, conselhos e cuidado partilhado por um chão partilhado.']
};
const chook = c => ((_lang() === 'pt' ? (COURSE_HOOKS_PT[c.id] || (c.pt && c.pt.hook && [c.pt.hook, c.pt.hookSub])) : (COURSE_HOOKS[c.id] || (c.hook && [c.hook, c.hookSub]))) || COURSE_HOOKS[c.id] || (c.hook && [c.hook, c.hookSub]) || [ctitle(c), ''])[0];
const chooksub = c => ((_lang() === 'pt' ? (COURSE_HOOKS_PT[c.id] || (c.pt && c.pt.hook && [c.pt.hook, c.pt.hookSub])) : (COURSE_HOOKS[c.id] || (c.hook && [c.hook, c.hookSub]))) || COURSE_HOOKS[c.id] || (c.hook && [c.hook, c.hookSub]) || ['', cdesc(c)])[1];

/* ================= per-course quizzes — real content first =================
   COURSE_QUIZ beats the generic category bank; grounded in the actual lessons. */
const COURSE_QUIZ = {
  'fire-truck-training': {
    en: [
      { q: 'Driving the truck off-road with a full tank, the biggest change to handle is…', opts: ['The radio volume', 'The shifting weight of the water moving the truck around', 'The colour of the dashboard', 'Nothing changes'], a: 1 },
      { q: 'When filling the water tank you should…', opts: ['Fill past the top for extra water', 'Watch the level, stop before it overflows, and secure the cap', 'Leave it unattended', 'Fill with the pump running dry'], a: 1 },
      { q: 'To get water from the pump to the hose, the truck’s power take-off (PTO) must be…', opts: ['Switched off', 'Engaged, with the engine at the right RPM', 'Removed', 'Painted red'], a: 1 },
      { q: 'The most important habit in a fire drill is…', opts: ['Working alone to be faster', 'Knowing your role and where the water is before you need it', 'Skipping the walk-through', 'Leaving the keys out of the truck'], a: 1 }
    ],
    pt: [
      { q: 'A conduzir o camião em todo-o-terreno com o depósito cheio, a maior mudança a controlar é…', opts: ['O volume do rádio', 'O peso da água a deslocar-se, que move o camião', 'A cor do painel', 'Nada muda'], a: 1 },
      { q: 'Ao encher o depósito de água deve…', opts: ['Encher acima do limite para ter mais água', 'Vigiar o nível, parar antes de transbordar e fechar bem a tampa', 'Deixar sem vigilância', 'Encher com a bomba a trabalhar em seco'], a: 1 },
      { q: 'Para levar a água da bomba à mangueira, a tomada de força (PTO) do camião tem de estar…', opts: ['Desligada', 'Engatada, com o motor nas rotações certas', 'Retirada', 'Pintada de vermelho'], a: 1 },
      { q: 'O hábito mais importante num exercício de incêndio é…', opts: ['Trabalhar sozinho para ser mais rápido', 'Saber a sua função e onde está a água antes de precisar', 'Saltar o reconhecimento', 'Deixar as chaves fora do camião'], a: 1 }
    ]
  },
  'land-team-journey': {
    en: [
      { q: 'You catch yourself defending a decision instead of listening. Where are you?', opts: ['Above the line', 'Below the line', 'On the line', 'It depends on who is right'], a: 1 },
      { q: 'What is the fastest way to shift from below the line back above it?', opts: ['Prove your point more firmly', 'Wait for the feeling to pass', 'Notice it and ask “where am I right now?”', 'Change the subject'], a: 2 },
      { q: 'In a “no failure, only feedback” culture, a mistake on the land is treated as…', opts: ['A reason to assign blame', 'Information about the system to learn from', 'Something to hide until it is fixed', 'Proof someone is not capable'], a: 1 },
      { q: 'Which question belongs ABOVE the line?', opts: ['“Whose fault is this?”', '“Why does this always happen to me?”', '“What is this teaching us?”', '“Who told you to do that?”'], a: 2 }
    ],
    pt: [
      { q: 'Apanha-se a defender uma decisão em vez de escutar. Onde está?', opts: ['Acima da linha', 'Abaixo da linha', 'Em cima da linha', 'Depende de quem tem razão'], a: 1 },
      { q: 'Qual é a forma mais rápida de voltar de baixo da linha para cima?', opts: ['Defender o seu ponto com mais força', 'Esperar que a sensação passe', 'Reparar e perguntar “onde estou agora?”', 'Mudar de assunto'], a: 2 },
      { q: 'Numa cultura de “não há fracasso, só feedback”, um erro na terra é tratado como…', opts: ['Um motivo para atribuir culpa', 'Informação sobre o sistema, para aprender', 'Algo a esconder até estar resolvido', 'Prova de que alguém não é capaz'], a: 1 },
      { q: 'Qual destas perguntas pertence ACIMA da linha?', opts: ['“De quem é a culpa?”', '“Porque é que isto me acontece sempre a mim?”', '“O que é que isto nos está a ensinar?”', '“Quem te mandou fazer isso?”'], a: 2 }
    ]
  }
};

/* per-module takeaways — "what you take with you" (real content courses) */
const TAKEAWAYS = {
  'fire-truck-training': {
    en: [
      ['Know the truck cold: ignition sequence, gears, brakes and the gauges that matter before you move.',
       'A loaded water truck handles slow and heavy — anticipate, brake early, take corners wide.',
       'Do the walk-around first: tyres, leaks, water level, and a clear path out.'],
      ['Fill from a known source; watch the level and stop before it overflows.',
       'Secure the cap and valves — a loose fitting sprays or drains when you least want it.',
       'A full tank changes the truck’s weight and balance — re-check handling before you set off.'],
      ['Engage the PTO and bring the engine to the right RPM before you expect pressure at the hose.',
       'On rough ground, stabilise and level the truck before you pump — never spray from an unsafe position.',
       'Control the jet: right pressure, right pattern, aimed at the base of the fire, not the flames.'],
      ['Learn the power system — PTO, pump and cut-offs — and how to shut it all down safely.',
       'Never work alone at the pump; know your role, your water source and your exit before the drill starts.',
       'Drill it until it’s muscle memory — in a real fire there’s no time to read the manual.']
    ],
    pt: [
      ['Conheça o camião de cor: sequência de arranque, mudanças, travões e os indicadores que importam antes de andar.',
       'Um camião com água conduz-se pesado e lento — antecipe, trave cedo, faça as curvas largas.',
       'Faça a volta de inspeção primeiro: pneus, fugas, nível de água e um caminho de saída livre.'],
      ['Encha de uma fonte conhecida; vigie o nível e pare antes de transbordar.',
       'Feche bem a tampa e as válvulas — uma ligação solta esguicha ou esvazia na pior altura.',
       'Um depósito cheio muda o peso e o equilíbrio do camião — reconfirme a condução antes de partir.'],
      ['Engate a tomada de força (PTO) e leve o motor às rotações certas antes de esperar pressão na mangueira.',
       'Em terreno acidentado, estabilize e nivele o camião antes de bombear — nunca projete de uma posição insegura.',
       'Controle o jato: pressão certa, padrão certo, apontado à base do fogo e não às chamas.'],
      ['Aprenda o sistema de potência — PTO, bomba e cortes — e como desligar tudo em segurança.',
       'Nunca trabalhe sozinho na bomba; saiba a sua função, a sua fonte de água e a sua saída antes de começar.',
       'Treine até ser memória muscular — num incêndio real não há tempo para ler o manual.']
    ]
  },
  'land-team-journey': {
    en: [
      ['Above the line is openness, curiosity and commitment to learning; below it is defensiveness, blame and needing to be right.',
       'Everyone drifts below the line — the skill is noticing it in the moment, without judgement.',
       'One honest question shifts everything: “Where am I right now?”'],
      ['Failure is data — every result is information about the system, not a verdict on you.',
       'Teams that treat mistakes as feedback learn faster and hide less.',
       'Ask “what is this teaching us?” before “whose fault is this?”'],
      ['Excellence lives in the details others walk past — the loose gate, the mislabelled seedling, the half-finished job.',
       'Attention to detail is a form of respect: for the land, the work, and whoever comes after you.',
       'Before you call it done, look once more — what would the most careful version of you check?'],
      ['Total responsibility means owning the result, not just your slice of it — no “that wasn’t my job.”',
       'When something goes wrong, the strong question is “what could I have done differently?” not “who’s to blame?”',
       'Taking full ownership is what turns a worker into someone the team can rely on.'],
      ['The land never stops teaching — the day you think you know it all is the day you stop growing.',
       'Every task, mistake and season is a lesson if you stay curious enough to receive it.',
       'Ask more than you assume; the best on the team never stopped being students.'],
      ['Most mistakes on the land begin as a misunderstanding nobody checked.',
       'Don’t assume you understood — say it back, ask the question, confirm before you act.',
       'Clear beats clever: a short “let me make sure I’ve got this” saves hours of redoing.'],
      ['Set the standard by how you’d want it done if this were your own land.',
       'Excellence isn’t a burst of effort — it’s the standard you hold when nobody is watching.',
       'Be the benchmark others measure against; raise the bar and the whole team rises with you.']
    ],
    pt: [
      ['Acima da linha é abertura, curiosidade e vontade de aprender; abaixo é defesa, culpa e precisar de ter razão.',
       'Todos deslizamos para baixo da linha — a competência é reparar no momento, sem julgamento.',
       'Uma pergunta honesta muda tudo: “Onde estou agora?”'],
      ['O fracasso é informação — cada resultado fala do sistema, não é um veredicto sobre si.',
       'Equipas que tratam erros como feedback aprendem mais depressa e escondem menos.',
       'Pergunte “o que nos está a ensinar?” antes de “de quem é a culpa?”'],
      ['A excelência vive nos detalhes que os outros ignoram — o portão solto, a muda mal etiquetada, o trabalho a meio.',
       'A atenção ao detalhe é uma forma de respeito: pela terra, pelo trabalho e por quem vem a seguir.',
       'Antes de dizer que está feito, olhe mais uma vez — o que verificaria a sua versão mais cuidadosa?'],
      ['Responsabilidade total é assumir o resultado, não só a sua parte — nada de “isso não era comigo.”',
       'Quando algo corre mal, a pergunta forte é “o que poderia eu ter feito diferente?” e não “de quem é a culpa?”',
       'Assumir por inteiro é o que transforma um trabalhador em alguém com quem a equipa pode contar.'],
      ['A terra nunca deixa de ensinar — o dia em que julga saber tudo é o dia em que deixa de crescer.',
       'Cada tarefa, erro e estação é uma lição, se mantiver a curiosidade para a receber.',
       'Pergunte mais do que presume; os melhores da equipa nunca deixaram de ser aprendizes.'],
      ['A maioria dos erros na terra começa num mal-entendido que ninguém confirmou.',
       'Não presuma que percebeu — repita por palavras suas, faça a pergunta, confirme antes de agir.',
       'Claro vale mais que esperto: um breve “deixa-me confirmar” poupa horas de retrabalho.'],
      ['Defina o padrão pela forma como o quereria feito se a terra fosse sua.',
       'A excelência não é um rasgo de esforço — é o padrão que mantém quando ninguém está a ver.',
       'Seja a referência pela qual os outros se medem; eleve a fasquia e toda a equipa sobe consigo.']
    ]
  }
};

/* ================= email nudge delivery (Google Apps Script webhook) =================
   Deploy apps-script/nudge-mailer.gs as a web app and paste its /exec URL below.
   Empty webhook = delivery off (UI degrades to "not connected" toasts).
   Sends are consent-gated client-side AND rate-capped server-side (1/person/week). */
const MAIL = {
  webhook: 'https://script.google.com/macros/s/AKfycbzb7uQRPEGwiPtUKeMA8ww1AbXqmK3dFUfd7xIWajFnGf2Tcocyfj44d-Rcb06gH428/exec',
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
    comm_online:'Online now', comm_top:'Leader’s board', comm_newest:'New in the community', comm_next_live:'Next live session', comm_members:'Members', comm_all_members:'See all members →', comm_member_since:'here since', comm_add_poll:'+ Poll', comm_poll_opt:'Option', comm_poll_votes:'votes', comm_vote:'Vote', comm_no_members:'The community grows as the team signs in 🌱',
    comm_pinned:'Pinned', comm_official:'Official',
    cert_title:'Certificate of Completion', cert_awarded:'Awarded to', cert_for:'for completing', cert_dl:'Download certificate', cert_li:'Add to LinkedIn', certs_h:'Certificates', certs_sub:'Every course you finish earns one — share it proudly.', cert_none:'Finish a course to earn your first certificate.',
    asg_assigned:'Assigned to you', asg_due:'Due', asg_overdue:'Overdue', asg_start:'Start', dept_label:'Department', dept_none:'Choose your department', mod_locked:'Finish the previous module to unlock this one',
    mis_h:'Field Mission', mis_sub:'Take what you learned onto the land — photo proof earns real XP.', mis_note_ph:'What did you notice? What did you do?', mis_photo:'Add photo proof', mis_submit:'Submit for review', mis_pending:'Submitted — awaiting review 🌾', mis_approved:'Mission approved!', mis_claim:'Claim', mis_declined:'Not approved this time — read the brief again and resubmit.', mis_done:'Mission complete', mis_signin:'Sign in to take on field missions', mis_photo_fail:'That photo couldn’t be used — try a JPG or PNG, or a smaller image.',
    coach_h:'Practice arena', coach_sub:'A safe place to practice the hard conversation — with an AI playing the other side.', coach_goal:'Your goal', coach_start:'Start the conversation', coach_end:'End & get feedback', coach_again:'Practice again', coach_ph:'Your reply…', coach_score:'Your feedback', coach_thinking:'…', coach_err:'Connection hiccup — your last message wasn’t lost. Send it again, or check the AI key in Settings.',
    rate_h:'How was this course?', rate_thanks:'Thank you — this helps us grow the library.',
    res_h:'Resources', cal_add:'Add to calendar',
    ask_h:'Ask the Academy', ask_sub:'Any question about the land — answered from your team\u2019s own courses.', ask_ph:'e.g. How do I slow erosion on the slope path?', ask_go:'Ask', ask_refs:'Learn more in', ask_thinking:'Reading the library…', ask_fail:'Could not answer right now — try again.',
    skills_h:'Skills', skills_sub:'What your learning is building — course by course.',
    comp_expired:'Certification expired', comp_expiring:'Expires soon', comp_renew:'Renew', nudge_recert_t:'Time to recertify', nudge_recert_b:'Your {course} certification {when} — a quick rewatch renews it.',
    jour_h:'Journeys', jour_sub:'Structured paths with milestones, field missions and a capstone.', jour_stage:'Stage', jour_mission_tag:'+ field mission', jour_capstone:'Capstone', jour_done:'Journey complete', jour_cert:'Journey certificate', jour_progress:'complete', jour_start:'Begin the journey', jour_continue:'Continue the journey',
    flash_h:'Review deck', flash_sub:'Five quick cards from what you\u2019ve learned — keep it fresh.', flash_flip:'Tap to flip', flash_next:'Next', flash_got:'Got it', flash_done:'Deck done — see you tomorrow 🌱', flash_empty:'Finish a course to build your review deck.', flash_open:'Review 5 cards',
    board_all:'All time', board_week:'This week', board_dept:'My department', live_attended:'Attendance counted — enjoy the session!',
    tour_welcome_t:'Welcome to EdenRise Academy 🌱', tour_welcome_b:'A two-minute walk through your new learning home. You can leave anytime.', tour_path_t:'Your path', tour_path_b:'The AI plans a course sequence toward your goal — start here, and it adapts as you learn.', tour_ask_t:'Ask the Academy', tour_ask_b:'Any question about the land — answered from our own courses, with links to the exact lesson.', tour_comm_t:'Community', tour_comm_b:'Questions, wins and polls with the whole team — organised by learning path.', tour_prog_t:'Your progress', tour_prog_b:'XP, streaks, skills, certificates and field missions — everything you\u2019ve earned lives here.', tour_bell_t:'Gentle nudges', tour_bell_b:'Encouraging reminders, never spam — and you control every channel in your profile.', tour_done_t:'That\u2019s the tour 🌿', tour_done_b:'Enjoy the academy — and remember: what you learn here is meant for the land.', tour_next:'Next', tour_back:'Back', tour_skip:'Skip tour', tour_finish:'Begin', tour_replay:'Take the tour',
    comp_h:'Training compliance', comp_sub:'Your mandatory continuous-training hours for the year — Portuguese Código do Trabalho, art. 131.º (40h/year).', comp_target:'Annual target', comp_done:'Completed', comp_left:'remaining', comp_ontrack:'On track', comp_behind:'Behind pace', comp_pace_by:'By now, aim for', comp_log:'Credited sessions', comp_none:'No hours credited yet — complete a lesson to begin.', comp_nif_prompt:'Add your NIF and contract details in your profile to activate the legal training record.', comp_confirmed:'Attendance confirmed', comp_h_unit:'h',
    prof_nif:'Tax number (NIF)', prof_empno:'Employee no.', prof_contract:'Contract type', prof_fte:'Working time', prof_hire:'Start date',
    contract_permanent:'Permanent', contract_fixed:'Fixed-term', contract_part:'Part-time', fte_full:'Full-time', fte_half:'Part-time (50%)', ck_40h:'40h',
    ready_h:'Role readiness', ready_sub:'How prepared you are for your role — skill by skill.', ready_gap:'Biggest gap', ready_rec:'Recommended for this gap', ready_of:'of target', ready_none:'Pick a role on your profile to see your readiness.',
    ask_more:'Ask the Academy: ', dig_h:'This week at EdenRise', dig_sub:'Two minutes per department — stay connected to the whole.', pwa_t:'Take the academy with you', pwa_b:'Add EdenRise to your home screen — one tap from anywhere, even offline.', pwa_btn:'Install', pwa_ios:'On iPhone: tap Share, then \u201cAdd to Home Screen\u201d.', comm_pin:'Pin', comm_unpin:'Unpin', comm_delete:'Delete', comm_confirm_del:'Delete this post for everyone?', comm_confirm_del_reply:'Delete this reply?', comm_deleted:'Deleted', comm_privacy:'Your progress is stored in your EdenRise account (Firestore, EU) and only you — and EdenRise admins — can see it. Turn nudges on or off anytime in your profile.',
    take_title:'What you take with you', take_sub:'Three things worth keeping from this module.', take_continue:'Keep going →', take_done:'Finish course 🎉',
    match_goal:'For your goal', missing_ask:'Not seeing what you need? Tell the AI →', missing_prompt:'Tell me what you’re looking for — a topic, a problem on the land, a skill — and I’ll find it or flag it for the EdenRise team to add. Your path only gets smarter when you push back on it.',
    assigned_tag:'Assigned', chosen_tag:'Your pick',
    voice_listening:'Listening…', voice_hint:'Say it naturally — “I’m looking for something about soil”', voice_unsupported:'Voice search needs Safari or Chrome', voice_search:'Voice search',
    quiz_q:'Question', quiz_of:'of', quiz_ai_building:'✦ Claude is writing fresh questions from this course…', quiz_ai_tag:'✦ AI-generated from this course', take_quiz:'Take the quiz 🎯',
    nudge_refresh_t:'A 2-minute refresher', nudge_refresh_b:'“{course}” was {n} days ago — one look keeps it rooted 🌱',
    offline_note:'Offline — your progress is safe on this device and will sync when you’re back', online_note:'Back online — progress synced 🌿',
    stats_today:'today', stats_best:'best', stats_quizzes:'quizzes taken', board_grow:'The board grows as the team joins — invite someone 🌱', no_data:'—',
    daily_title:'Today’s question', daily_sub:'Thirty seconds to keep it rooted', daily_from:'from', daily_correct:'Rooted! +10 XP 🌱', daily_wrong:'Good try — now it’ll stick.', daily_tomorrow:'Come back tomorrow for the next one 🌿', daily_streak:'day streak',
    gdpr_title:'Privacy & your data', gdpr_sub:'Your data belongs to you — take it with you or erase it, anytime (GDPR).', gdpr_export:'Download my data', gdpr_exported:'Your data file is downloading 🌿', gdpr_delete:'Delete my account', gdpr_delete_warn:'This permanently erases your account, progress, XP and badges for everyone. Type DELETE to confirm.', gdpr_deleted:'Account deleted. Be well 🌿', gdpr_recent_login:'For safety, sign in again first — then delete works.', gdpr_guest_note:'Guest data lives only on this device — deleting clears it here.',
    orgkey_title:'Team AI key', orgkey_sub:'One key for the whole team — every signed-in member gets the tutor, AI quizzes and the Studio automatically. Personal keys (tutor settings) override it.', orgkey_saved:'Team AI key saved — live for everyone signed in 🌿',
    studio_title:'AI Course Studio', studio_sub:'Paste a transcript or lesson notes, add the video link — the AI writes the whole bilingual course: modules, invitation, takeaways and quiz. You approve before it goes live.', studio_gen:'Write the course ✦', studio_generating:'Writing the course — modules, takeaways, quiz, both languages…', studio_need_key:'Connect a Claude key first (✦ orb → ⚙ settings) — the Studio writes with your key.', studio_publish:'Publish to Library 🌿', studio_draft:'Draft — review before publishing', studio_published:'Published — it’s in everyone’s Library now 🌿', studio_video_ph:'Vimeo or YouTube link (optional)', studio_text_ph:'Paste the transcript, notes, or a rich description of the lesson…', studio_title_ph:'Working title (optional)', studio_discard:'Discard', studio_custom:'Published by your team', studio_delete_confirm:'Remove this course for everyone?', studio_failed:'Couldn’t generate — try again (check your key/credits)',
    nudge_bell:'Nudges', nudge_empty:'All caught up 🌿 Nothing needs you right now.', nudge_board_t:"Someone's gaining on you", nudge_board_b:'{name} is {xp} XP ahead — finish one lesson to catch up 🌿', nudge_top_t:"You're leading 🌟", nudge_top_b:'Top of the board this week. One lesson keeps you there.',
    nudge_level_t:'Almost a new level', nudge_level_b:'Just {xp} XP from {lvl} — a quiz gets you there.', nudge_streak_t:'{n}-day streak 🔥', nudge_streak_b:'Do one lesson today to keep it alive.', nudge_lesson_t:'Pick up where you left off', nudge_lesson_b:'“{mod}” in {course} is waiting.', nudge_badge_t:'One course from a badge', nudge_badge_b:'Finish one more course to unlock Grove Keeper 🏅', nudge_welcome:'Welcome back, {name} 🌱',
    notif_title:'Notifications', notif_sub:'Choose how EdenRise nudges you back. Opt-in and GDPR-friendly — change anytime.', notif_browser:'Browser notifications', notif_browser_d:'Gentle desktop reminders — works right away.', notif_email:'Email', notif_email_d:'A weekly nudge to your inbox.', notif_whatsapp:'WhatsApp', notif_whatsapp_d:'Streak & leaderboard pings on WhatsApp.', notif_phone_ph:'WhatsApp number (+351…)', notif_soon:'ready once delivery is connected', notif_on:'Notifications on 🌿', notif_blocked:'Your browser blocked notifications — enable them in site settings.',
    mail_not_connected:'Email delivery isn’t connected yet — deploy the mailer first', mail_sent:'Encouragement sent 🌿', mail_rate_limited:'Already nudged this week — we keep it gentle 🌿', mail_no_email:'No email on this account', mail_not_opted:'hasn’t opted into email nudges — consent first 🌿', mail_optin_sent:'Welcome email sent — check your inbox 📬', mail_failed:'Couldn’t send — try again in a moment',
    search_ph:'Search courses, the land…', org:'EdenRise · Academy',
    featured_eyebrow:'Featured Program · Curated for you by AI', match:'match', modules:'modules', certified:'CERTIFIED', featured_h:'Featured', featured_sub:'Essential programs, front and centre',
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
    comm_online:'Online agora', comm_top:'Ranking', comm_newest:'Novos na comunidade', comm_next_live:'Próxima sessão ao vivo', comm_members:'Membros', comm_all_members:'Ver todos os membros →', comm_member_since:'aqui desde', comm_add_poll:'+ Sondagem', comm_poll_opt:'Opção', comm_poll_votes:'votos', comm_vote:'Votar', comm_no_members:'A comunidade cresce à medida que a equipa entra 🌱',
    comm_pinned:'Fixado', comm_official:'Oficial',
    cert_title:'Certificado de Conclusão', cert_awarded:'Atribuído a', cert_for:'pela conclusão de', cert_dl:'Transferir certificado', cert_li:'Adicionar ao LinkedIn', certs_h:'Certificados', certs_sub:'Cada curso terminado vale um — partilhe com orgulho.', cert_none:'Termine um curso para ganhar o seu primeiro certificado.',
    asg_assigned:'Atribuído a si', asg_due:'Prazo', asg_overdue:'Em atraso', asg_start:'Começar', dept_label:'Departamento', dept_none:'Escolha o seu departamento', mod_locked:'Termine o módulo anterior para desbloquear este',
    mis_h:'Missão de Campo', mis_sub:'Leve o que aprendeu para o terreno — a prova fotográfica vale XP real.', mis_note_ph:'O que reparou? O que fez?', mis_photo:'Adicionar foto', mis_submit:'Submeter para revisão', mis_pending:'Submetido — em revisão 🌾', mis_approved:'Missão aprovada!', mis_claim:'Reclamar', mis_declined:'Não aprovada desta vez — releia o guião e volte a submeter.', mis_done:'Missão concluída', mis_signin:'Inicie sessão para aceitar missões de campo', mis_photo_fail:'Não foi possível usar essa foto — tente um JPG ou PNG, ou uma imagem mais pequena.',
    coach_h:'Arena de prática', coach_sub:'Um lugar seguro para praticar a conversa difícil — com uma IA do outro lado.', coach_goal:'O seu objetivo', coach_start:'Começar a conversa', coach_end:'Terminar e receber feedback', coach_again:'Praticar de novo', coach_ph:'A sua resposta…', coach_score:'O seu feedback', coach_thinking:'…', coach_err:'Falha de ligação — a sua mensagem não se perdeu. Envie de novo, ou verifique a chave de IA nas Definições.',
    rate_h:'Como foi este curso?', rate_thanks:'Obrigado — isto ajuda-nos a fazer crescer a biblioteca.',
    res_h:'Recursos', cal_add:'Adicionar ao calendário',
    ask_h:'Pergunte à Academia', ask_sub:'Qualquer pergunta sobre a terra — respondida a partir dos cursos da equipa.', ask_ph:'ex.: Como travo a erosão no caminho da encosta?', ask_go:'Perguntar', ask_refs:'Aprenda mais em', ask_thinking:'A ler a biblioteca…', ask_fail:'Não foi possível responder — tente de novo.',
    skills_h:'Competências', skills_sub:'O que a sua aprendizagem está a construir — curso a curso.',
    comp_expired:'Certificação expirada', comp_expiring:'Expira em breve', comp_renew:'Renovar', nudge_recert_t:'Hora de recertificar', nudge_recert_b:'A sua certificação de {course} {when} — uma revisão rápida renova-a.',
    jour_h:'Jornadas', jour_sub:'Percursos estruturados com marcos, missões de campo e um projeto final.', jour_stage:'Etapa', jour_mission_tag:'+ missão de campo', jour_capstone:'Projeto final', jour_done:'Jornada concluída', jour_cert:'Certificado da jornada', jour_progress:'concluída', jour_start:'Começar a jornada', jour_continue:'Continuar a jornada',
    flash_h:'Baralho de revisão', flash_sub:'Cinco cartas rápidas do que aprendeu — mantenha fresco.', flash_flip:'Toque para virar', flash_next:'Seguinte', flash_got:'Já sei', flash_done:'Baralho feito — até amanhã 🌱', flash_empty:'Termine um curso para criar o seu baralho.', flash_open:'Rever 5 cartas',
    board_all:'Sempre', board_week:'Esta semana', board_dept:'O meu departamento', live_attended:'Presença registada — boa sessão!',
    tour_welcome_t:'Bem-vindo à EdenRise Academy 🌱', tour_welcome_b:'Uma volta de dois minutos pela sua nova casa de aprendizagem. Pode sair quando quiser.', tour_path_t:'O seu percurso', tour_path_b:'A IA planeia uma sequência de cursos para o seu objetivo — comece aqui, e ela adapta-se.', tour_ask_t:'Pergunte à Academia', tour_ask_b:'Qualquer pergunta sobre a terra — respondida a partir dos nossos cursos, com links para a lição exata.', tour_comm_t:'Comunidade', tour_comm_b:'Perguntas, vitórias e sondagens com toda a equipa — organizadas por percurso.', tour_prog_t:'O seu progresso', tour_prog_b:'XP, sequências, competências, certificados e missões de campo — tudo o que ganhou vive aqui.', tour_bell_t:'Lembretes gentis', tour_bell_b:'Encorajadores, nunca spam — e controla cada canal no seu perfil.', tour_done_t:'Fim da volta 🌿', tour_done_b:'Aproveite a academia — e lembre-se: o que aprende aqui é para a terra.', tour_next:'Seguinte', tour_back:'Voltar', tour_skip:'Saltar', tour_finish:'Começar', tour_replay:'Fazer a visita guiada',
    comp_h:'Conformidade de formação', comp_sub:'As suas horas de formação contínua obrigatória do ano — Código do Trabalho, art. 131.º (40h/ano).', comp_target:'Meta anual', comp_done:'Concluídas', comp_left:'em falta', comp_ontrack:'Em dia', comp_behind:'Atrasado', comp_pace_by:'A esta altura, deveria estar em', comp_log:'Sessões creditadas', comp_none:'Ainda sem horas creditadas — conclua uma lição para começar.', comp_nif_prompt:'Adicione o seu NIF e dados do contrato no perfil para ativar o registo legal de formação.', comp_confirmed:'Presença confirmada', comp_h_unit:'h',
    prof_nif:'NIF', prof_empno:'N.º de trabalhador', prof_contract:'Tipo de contrato', prof_fte:'Tempo de trabalho', prof_hire:'Data de início',
    contract_permanent:'Sem termo', contract_fixed:'A termo', contract_part:'Tempo parcial', fte_full:'Tempo inteiro', fte_half:'Tempo parcial (50%)', ck_40h:'40h',
    ready_h:'Prontidão para a função', ready_sub:'Quão preparado está para a sua função — competência a competência.', ready_gap:'Maior lacuna', ready_rec:'Recomendado para esta lacuna', ready_of:'do objetivo', ready_none:'Escolha uma função no seu perfil para ver a sua prontidão.',
    ask_more:'Pergunte à Academia: ', dig_h:'Esta semana na EdenRise', dig_sub:'Dois minutos por departamento — ligados ao todo.', pwa_t:'Leve a academia consigo', pwa_b:'Adicione a EdenRise ao ecrã principal — um toque, mesmo offline.', pwa_btn:'Instalar', pwa_ios:'No iPhone: toque em Partilhar e depois \u201cAdicionar ao ecrã principal\u201d.', comm_pin:'Fixar', comm_unpin:'Soltar', comm_delete:'Eliminar', comm_confirm_del:'Eliminar esta publicação para todos?', comm_confirm_del_reply:'Eliminar esta resposta?', comm_deleted:'Eliminado', comm_privacy:'O seu progresso é guardado na sua conta EdenRise (Firestore, UE) e só você — e os administradores da EdenRise — o podem ver. Ative ou desative os lembretes no seu perfil quando quiser.',
    take_title:'O que leva consigo', take_sub:'Três coisas a guardar deste módulo.', take_continue:'Continuar →', take_done:'Terminar curso 🎉',
    match_goal:'Para o seu objetivo', missing_ask:'Não encontra o que precisa? Diga à IA →', missing_prompt:'Diga-me o que procura — um tema, um problema na terra, uma competência — e eu encontro-o ou sinalizo-o à equipa EdenRise para o criar. O seu percurso só fica mais inteligente quando o desafia.',
    assigned_tag:'Atribuído', chosen_tag:'Escolha sua',
    voice_listening:'A ouvir…', voice_hint:'Diga naturalmente — “procuro algo sobre solo”', voice_unsupported:'A pesquisa por voz precisa de Safari ou Chrome', voice_search:'Pesquisa por voz',
    quiz_q:'Pergunta', quiz_of:'de', quiz_ai_building:'✦ O Claude está a escrever perguntas novas a partir deste curso…', quiz_ai_tag:'✦ Gerado por IA a partir deste curso', take_quiz:'Fazer o teste 🎯',
    nudge_refresh_t:'Uma revisão de 2 minutos', nudge_refresh_b:'“{course}” foi há {n} dias — uma vista de olhos mantém-no enraizado 🌱',
    offline_note:'Offline — o seu progresso está seguro neste dispositivo e sincroniza quando voltar', online_note:'De volta online — progresso sincronizado 🌿',
    stats_today:'hoje', stats_best:'melhor', stats_quizzes:'testes feitos', board_grow:'O ranking cresce à medida que a equipa entra — convide alguém 🌱', no_data:'—',
    daily_title:'A pergunta de hoje', daily_sub:'Trinta segundos para manter as raízes', daily_from:'de', daily_correct:'Enraizado! +10 XP 🌱', daily_wrong:'Boa tentativa — agora vai ficar.', daily_tomorrow:'Volte amanhã para a próxima 🌿', daily_streak:'dias seguidos',
    gdpr_title:'Privacidade e os seus dados', gdpr_sub:'Os seus dados pertencem-lhe — leve-os consigo ou apague-os, quando quiser (RGPD).', gdpr_export:'Descarregar os meus dados', gdpr_exported:'O seu ficheiro de dados está a descarregar 🌿', gdpr_delete:'Eliminar a minha conta', gdpr_delete_warn:'Isto apaga permanentemente a sua conta, progresso, XP e distintivos. Escreva DELETE para confirmar.', gdpr_deleted:'Conta eliminada. Fique bem 🌿', gdpr_recent_login:'Por segurança, inicie sessão novamente primeiro — depois a eliminação funciona.', gdpr_guest_note:'Os dados de convidado vivem só neste dispositivo — eliminar limpa-os aqui.',
    orgkey_title:'Chave de IA da equipa', orgkey_sub:'Uma chave para toda a equipa — cada membro com sessão iniciada recebe o tutor, os testes IA e o Estúdio automaticamente. Chaves pessoais (definições do tutor) têm prioridade.', orgkey_saved:'Chave de IA da equipa guardada — ativa para todos 🌿',
    studio_title:'Estúdio de Cursos IA', studio_sub:'Cole a transcrição ou as notas da lição, junte o link do vídeo — a IA escreve o curso bilingue completo: módulos, convite, aprendizagens e teste. Aprova antes de publicar.', studio_gen:'Escrever o curso ✦', studio_generating:'A escrever o curso — módulos, aprendizagens, teste, nas duas línguas…', studio_need_key:'Ligue primeiro uma chave Claude (✦ orbe → ⚙ definições) — o Estúdio escreve com a sua chave.', studio_publish:'Publicar na Biblioteca 🌿', studio_draft:'Rascunho — reveja antes de publicar', studio_published:'Publicado — já está na Biblioteca de todos 🌿', studio_video_ph:'Link Vimeo ou YouTube (opcional)', studio_text_ph:'Cole a transcrição, notas, ou uma boa descrição da lição…', studio_title_ph:'Título de trabalho (opcional)', studio_discard:'Descartar', studio_custom:'Publicado pela sua equipa', studio_delete_confirm:'Remover este curso para todos?', studio_failed:'Não foi possível gerar — tente novamente (verifique a chave/créditos)',
    nudge_bell:'Lembretes', nudge_empty:'Tudo em dia 🌿 Nada precisa de si agora.', nudge_board_t:'Estão a aproximar-se de si', nudge_board_b:'{name} está {xp} XP à frente — termine uma lição para alcançar 🌿', nudge_top_t:'Está na liderança 🌟', nudge_top_b:'No topo do ranking esta semana. Uma lição mantém-no lá.',
    nudge_level_t:'Quase um novo nível', nudge_level_b:'A apenas {xp} XP de {lvl} — um teste leva-o lá.', nudge_streak_t:'Sequência de {n} dias 🔥', nudge_streak_b:'Faça uma lição hoje para a manter viva.', nudge_lesson_t:'Continue de onde parou', nudge_lesson_b:'“{mod}” em {course} está à espera.', nudge_badge_t:'A um curso de um distintivo', nudge_badge_b:'Termine mais um curso para desbloquear Guardião do Bosque 🏅', nudge_welcome:'Bem-vindo de volta, {name} 🌱',
    notif_title:'Notificações', notif_sub:'Escolha como a EdenRise o incentiva a voltar. Opcional e compatível com o RGPD — mude quando quiser.', notif_browser:'Notificações do navegador', notif_browser_d:'Lembretes suaves no ecrã — funcionam já.', notif_email:'Email', notif_email_d:'Um lembrete semanal no seu email.', notif_whatsapp:'WhatsApp', notif_whatsapp_d:'Avisos de sequência e ranking no WhatsApp.', notif_phone_ph:'Número de WhatsApp (+351…)', notif_soon:'pronto assim que o envio for ligado', notif_on:'Notificações ativas 🌿', notif_blocked:'O navegador bloqueou as notificações — ative-as nas definições do site.',
    mail_not_connected:'O envio de emails ainda não está ligado — implemente primeiro o mailer', mail_sent:'Incentivo enviado 🌿', mail_rate_limited:'Já foi incentivado esta semana — mantemos a suavidade 🌿', mail_no_email:'Esta conta não tem email', mail_not_opted:'não ativou os lembretes por email — consentimento primeiro 🌿', mail_optin_sent:'Email de boas-vindas enviado — veja a sua caixa 📬', mail_failed:'Não foi possível enviar — tente novamente',
    search_ph:'Procurar cursos, a terra…', org:'EdenRise · Academia',
    featured_eyebrow:'Programa em Destaque · Escolhido para si pela IA', match:'compatível', modules:'módulos', certified:'CERTIFICADO', featured_h:'Em Destaque', featured_sub:'Programas essenciais, em primeiro plano',
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
  'fire-truck-training': { title:'Formação — Camião de Incêndio', desc:'Operação prática do camião de combate a incêndios da propriedade — arrancar, conduzir, encher e pôr água exatamente onde é preciso. Quando chega a época de fogos, todos devem saber mover água.', modules:['Arrancar e Conduzir o Camião','Encher o Depósito de Água','Todo-o-Terreno, Bomba e Jato','Potência, Segurança e o Exercício'] },
  'land-team-journey': { title:'Acima da Linha', desc:'A jornada de crescimento da Equipa da Terra — a mentalidade e os hábitos que moldam como trabalhamos a terra, e uns aos outros. Começa com uma pergunta que muda a forma como aparecemos.', modules:['Acima da Linha, Abaixo da Linha','Não Há Fracasso, Só Feedback','Atenção ao Detalhe','Responsabilidade Total','Seja um Aprendiz para a Vida','Não Presuma, Esclareça','Benchmark de Excelência'] },
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
const ctitle = c => (_lang() === 'pt' && ((COURSE_PT[c.id] && COURSE_PT[c.id].title) || (c.pt && c.pt.title))) || c.title;
const cdesc = c => (_lang() === 'pt' && ((COURSE_PT[c.id] && COURSE_PT[c.id].desc) || (c.pt && c.pt.desc))) || c.desc;
const cmods = c => (_lang() === 'pt' && ((COURSE_PT[c.id] && COURSE_PT[c.id].modules) || (c.pt && c.pt.modules))) || c.modules;
const tnote = n => _lang() === 'pt' ? String(n).replace('modules skipped by AI', 'módulos ignorados pela IA').replace('module skipped by AI', 'módulo ignorado pela IA') : n;

/* ================= World-class pack: departments, missions, role-play ================= */
const DEPTS = [
  { key: 'land', en: 'Land & Gardens', pt: 'Terra e Jardins' },
  { key: 'building', en: 'Building & Maintenance', pt: 'Construção e Manutenção' },
  { key: 'hospitality', en: 'Malhão Pardo & Hospitality', pt: 'Malhão Pardo e Hospitalidade' },
  { key: 'animals', en: 'Animal Care', pt: 'Cuidado Animal' },
  { key: 'office', en: 'Office & Leadership', pt: 'Escritório e Liderança' }
];
const tdept = k => { const d = DEPTS.find(x => x.key === k); return d ? (_lang() === 'pt' ? d.pt : d.en) : ''; };

/* Field Missions — learn online, prove it on the land. One mission per course (photo-proof). */
const MISSIONS = {
  'land-team-journey': { xp: 150,
    en: { title: 'Catch yourself below the line', brief: 'For three days, notice one moment each day when you slip below the line — blame, excuse or denial. Write the three moments down, and what pulled you back above. Photograph your notes as proof.' },
    pt: { title: 'Apanhe-se abaixo da linha', brief: 'Durante três dias, repare num momento por dia em que desce abaixo da linha — culpa, desculpa ou negação. Anote os três momentos e o que o trouxe de volta acima. Fotografe as suas notas como prova.' } },
  'living-soil': { xp: 150,
    en: { title: 'Dig a test pit', brief: 'Dig a small pit (30cm) somewhere on the land. Photograph the soil profile and note: colour, smell, moisture, and any life you find. The photo is your proof.' },
    pt: { title: 'Abra uma cova de teste', brief: 'Abra uma pequena cova (30cm) algures no terreno. Fotografe o perfil do solo e anote: cor, cheiro, humidade e a vida que encontrar. A foto é a sua prova.' } },
  'water-cycles': { xp: 150,
    en: { title: 'Walk the water', brief: 'On (or right after) a rainy day, walk the land and photograph two places where water flows or pools. Note where you would slow it, spread it, or sink it.' },
    pt: { title: 'Caminhe com a água', brief: 'Num dia de chuva (ou logo depois), percorra o terreno e fotografe dois locais onde a água corre ou se acumula. Anote onde a iria travar, espalhar ou infiltrar.' } },
  'composting': { xp: 120,
    en: { title: 'Feed the pile', brief: 'Build or turn a compost pile using the layering you learned. Photograph the layers (greens/browns) before you close it up.' },
    pt: { title: 'Alimente a pilha', brief: 'Monte ou vire uma pilha de compostagem com as camadas que aprendeu. Fotografe as camadas (verdes/castanhos) antes de a fechar.' } },
  'nature-connection': { xp: 100,
    en: { title: 'One sit spot, three days', brief: 'Sit in the same outdoor spot for 10 minutes, three days in a row. Photograph the spot and note one thing you only noticed on day three.' },
    pt: { title: 'Um lugar, três dias', brief: 'Sente-se no mesmo lugar ao ar livre 10 minutos, três dias seguidos. Fotografe o lugar e anote algo que só reparou ao terceiro dia.' } }
};
const missionFor = id => { const m = MISSIONS[id]; return m ? Object.assign({ xp: m.xp }, _lang() === 'pt' ? m.pt : m.en) : null; };

/* AI Role-Play Coach — practice the hard conversation before it happens */
const ROLEPLAY = {
  'land-team-journey': {
    en: { title: 'The blame spiral', persona: 'Rui, a tired team member', opening: 'Honestly? The seedlings died because Marta never set up the irrigation properly. I did my part. Not my fault.',
      system: 'You are Rui, a hard-working but frustrated land-team member at a regenerative resort in Alentejo, Portugal. A planting bed failed and you are firmly below the line: blaming Marta, making excuses, denying any part in it. Stay realistic and human — a little defensive at first, warming ONLY if the user leads with curiosity and ownership instead of accusation. Keep replies under 60 words, spoken tone. Never break character, never mention being an AI.',
      goal: 'Lead Rui back above the line — without blaming him for blaming.', rubric: ['Stayed above the line yourself', 'Curiosity before correction', 'A clear next step, agreed together'] },
    pt: { title: 'A espiral da culpa', persona: 'Rui, um colega cansado', opening: 'Sinceramente? As mudas morreram porque a Marta nunca montou bem a rega. Eu fiz a minha parte. A culpa não é minha.',
      system: 'És o Rui, um membro trabalhador mas frustrado da equipa de terra num resort regenerativo no Alentejo. Um canteiro falhou e estás firmemente abaixo da linha: a culpar a Marta, a arranjar desculpas, a negar qualquer parte. Sê realista e humano — defensivo no início, abrindo APENAS se o utilizador liderar com curiosidade e responsabilidade em vez de acusação. Respostas com menos de 60 palavras, tom falado. Nunca saias da personagem, nunca digas que és uma IA.',
      goal: 'Traga o Rui de volta acima da linha — sem o culpar por culpar.', rubric: ['Manteve-se acima da linha', 'Curiosidade antes de correção', 'Um próximo passo claro, acordado juntos'] }
  },
  'community-land': {
    en: { title: 'The boundary talk', persona: 'Sr. Almeida, a wary neighbour', opening: 'Your people left the shared gate open again. My sheep were on the road. This arrangement is not working for me.',
      system: 'You are Sr. Almeida, a 60-year-old Alentejo farmer who shares a boundary and a gate with a regenerative resort. You are courteous but firm and skeptical of newcomers. A real grievance: their volunteers left the gate open twice. You soften only with genuine listening, respect for your experience, and a concrete fix. Replies under 60 words, spoken tone. Never break character.',
      goal: 'Repair trust and agree a practical fix for the gate.', rubric: ['Listened before defending', 'Respected his experience', 'A concrete, checkable agreement'] },
    pt: { title: 'A conversa da vizinhança', persona: 'Sr. Almeida, um vizinho desconfiado', opening: 'A vossa gente deixou o portão partilhado aberto outra vez. As minhas ovelhas andavam na estrada. Este arranjo não está a funcionar para mim.',
      system: 'És o Sr. Almeida, um agricultor alentejano de 60 anos que partilha uma extrema e um portão com um resort regenerativo. És cortês mas firme e desconfiado de recém-chegados. Queixa real: os voluntários deixaram o portão aberto duas vezes. Só abrandas com escuta genuína, respeito pela tua experiência e uma solução concreta. Respostas com menos de 60 palavras. Nunca saias da personagem.',
      goal: 'Repare a confiança e acorde uma solução prática para o portão.', rubric: ['Ouviu antes de se defender', 'Respeitou a experiência dele', 'Um acordo concreto e verificável'] }
  }
};
const roleplayFor = id => { const r = ROLEPLAY[id]; return r ? (_lang() === 'pt' ? r.pt : r.en) : null; };

/* ================= Deep-build pack: skills, journeys ================= */
const SKILLS = [
  { key: 'soil', en: 'Soil literacy', pt: 'Literacia do solo' },
  { key: 'water', en: 'Water design', pt: 'Desenho de água' },
  { key: 'food', en: 'Food & forest', pt: 'Alimento e floresta' },
  { key: 'nature', en: 'Nature connection', pt: 'Ligação à natureza' },
  { key: 'craft', en: 'Craft & building', pt: 'Ofício e construção' },
  { key: 'wellbeing', en: 'Wellbeing', pt: 'Bem-estar' },
  { key: 'community', en: 'Community', pt: 'Comunidade' },
  { key: 'leadership', en: 'Leadership', pt: 'Liderança' },
  { key: 'safety', en: 'Land safety', pt: 'Segurança no terreno' }
];
const tskill = k => { const s = SKILLS.find(x => x.key === k); return s ? (_lang() === 'pt' ? s.pt : s.en) : k; };
const CAT_SKILL = { 'Land & Soil': 'soil', 'Water & Climate': 'water', 'Food & Forest': 'food', 'Nature Connection': 'nature', 'Craft & Hands': 'craft', 'Wellbeing': 'wellbeing', 'Community': 'community', 'Leadership': 'leadership', 'Stewardship': 'nature' };
const COURSE_SKILLS = {
  'fire-truck-training': ['safety'],
  'land-team-journey': ['leadership', 'community'],
  'fire-safety': ['safety'],
  'capstone-land': ['soil', 'water', 'food'],
  'rainwater': ['water', 'craft'],
  'natural-building': ['craft'],
  'community-land': ['community', 'leadership'],
  'ethics': ['community'],
  'regen-design': ['soil', 'water'],
  'rewilding': ['nature', 'food'],
  'herbal': ['wellbeing', 'nature']
};
const skillsOf = c => COURSE_SKILLS[c.id] || [CAT_SKILL[c.cat] || 'nature'];

/* Journeys — structured milestone paths with a capstone */
const JOURNEYS = [
  {
    id: 'land-steward', icon: 'mountain', grad: 7, xp: 300,
    en: { title: 'The Land Steward Journey', desc: 'From reading the land to a full land plan — the complete formation, proven on the ground.' },
    pt: { title: 'A Jornada do Guardião da Terra', desc: 'De ler a terra a um plano completo — a formação inteira, provada no terreno.' },
    stages: [
      { course: 'land-literacy' },
      { course: 'living-soil', mission: true },
      { course: 'water-cycles', mission: true },
      { course: 'agroforestry' },
      { course: 'capstone-land', capstone: true }
    ]
  },
  {
    id: 'grounded-leader', icon: 'compass', grad: 4, xp: 250,
    en: { title: 'The Grounded Leader', desc: 'Lead a land team the EdenRise way — above the line, in community, with roots.' },
    pt: { title: 'O Líder Enraizado', desc: 'Liderar uma equipa de terra à maneira EdenRise — acima da linha, em comunidade, com raízes.' },
    stages: [
      { course: 'land-team-journey', mission: true },
      { course: 'ethics' },
      { course: 'community-land', capstone: true }
    ]
  }
];
const tjour = (j, k) => (_lang() === 'pt' ? j.pt : j.en)[k];

/* ================= Role Readiness — the role→skills→learning graph ================= */
const ROLE_PROFILES = {
  land: { skills: { soil: 70, water: 55, food: 50, safety: 60, nature: 40 } },
  nature: { skills: { nature: 70, wellbeing: 60, food: 40, community: 40 } },
  water: { skills: { water: 75, soil: 50, safety: 55, craft: 35 } },
  community: { skills: { community: 70, leadership: 60, nature: 40, wellbeing: 35 } }
};
