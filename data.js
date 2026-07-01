/* ============ EdenRise Academy — catalog & seed data ============ */

const VIDS = [
  'BigBuckBunny', 'ElephantsDream', 'ForBiggerBlazes', 'ForBiggerEscapes',
  'ForBiggerFun', 'ForBiggerJoyrides', 'ForBiggerMeltdowns', 'Sintel',
  'SubaruOutbackOnStreetAndDirt', 'TearsOfSteel'
].map(n => `https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/${n}.mp4`);

/* ---- Video hosting ----
   Leave R2_BASE empty to serve lesson videos from the local /media folder.
   Set it to your Cloudflare R2 public URL (e.g. 'https://pub-xxxx.r2.dev/')
   to serve every lesson from R2 (free storage + free egress). One switch. */
const R2_BASE = '';
const mediaUrl = name => (R2_BASE ? R2_BASE.replace(/\/?$/, '/') : 'media/') + name;

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
    level: 'Intermediate', rating: 4.9, learners: 298, ai: true, featured: true, video: mediaUrl('v3.mp4'),
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
  'Regenerative Steward': ['land-literacy', 'living-soil', 'water-cycles', 'agroforestry', 'regen-design', 'capstone-land'],
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

const DEFAULT_STATE = {
  onboarded: false,
  role: null,
  assignments: [],
  notes: {},
  apiKey: '',
  aiModel: 'claude-opus-4-8',
  goal: 'Regenerative Steward',
  path: ['land-literacy', 'living-soil', 'water-cycles', 'agroforestry', 'regen-design', 'capstone-land'],
  progress: {
    'land-literacy': { done: true, score: 92 },
    'living-soil': { done: true, score: 92, note: '2 modules skipped by AI' },
    'ethics': { done: true, score: 88, cert: true },
    'water-cycles': { mod: 4, pct: 64 },
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
