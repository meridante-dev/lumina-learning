/* ============================================================================
   INSTANCE CONTENT · EdenRise  (the course catalog — pure data, swap per client)
   ----------------------------------------------------------------------------
   Loaded BEFORE the core framework (data.js). A new client ships its own
   brands/<id>/content.js with the same globals: CATALOG + course maps.
   The engine's helpers (chook/ctitle/skillsOf…) live in the shared framework.
============================================================================ */

const CATALOG = [
  {
    id: 'land-team-journey', title: 'Above the Line', cat: 'Leadership', grad: 4, icon: 'compass',
    level: 'All levels', rating: 4.9, learners: 340, ai: true, featured: true, poster: 'media/above-below-line-cover.jpg', updated: '2026-07',
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
    id: 'fire-truck-training', title: 'Fire Truck Training', cat: 'Stewardship', grad: 4, icon: 'fire', recertMonths: 12, featured: true, updated: '2026-07',
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
  },
  {
    id: 'alignment-journey', title: 'The EdenRise Alignment Journey', cat: 'Leadership', grad: 1, icon: 'compass', featured: true, updated: '2026-07',
    level: 'All levels', rating: 5.0, learners: 0, isNew: true, poster: 'media/covers/alignment-journey.jpg',
    desc: 'The EdenRise team’s inner journey — the mindset that shapes how we work the land and each other. Six shifts, from Above the Line thinking to goals, fear, and the wholeness of body, soul and spirit.',
    modules: [
      'Warm Welcome',
      'Above the Line · Intro', 'Above the Line · Simple & Powerful Thinking', 'Above the Line · Deep Dive', 'Above the Line · Summary',
      'No Failure, Only Feedback · Intro', 'No Failure, Only Feedback · Animation', 'No Failure, Only Feedback · Summary',
      'ESIP · Introduction',
      'Goal Setting · Intro', 'Goal Setting · Animation', 'Goal Setting · 90-Day Goals', 'Goal Setting · Top 5 Goals', 'Goal Setting · Summary',
      'Beyond Fear · Intro', 'Beyond Fear · Animation', 'Beyond Fear · Unpack & Summary',
      'Body, Soul & Spirit · Intro', 'Body, Soul & Spirit · Deep Dive'
    ],
    moduleDurations: [5, 3, 3, 10, 1, 1, 4, 10, 16, 1, 3, 10, 10, 2, 2, 6, 12, 1, 13],
    moduleMedia: [
      { type: 'vimeo', id: '1060039319', h: '359d98f5b5' },   /* Warm Welcome — Intro to training */
      { type: 'vimeo', id: '1057945306', h: '96a8550c8a' },   /* 1.1 Intro to Above the Line */
      { type: 'vimeo', id: '1057946039', h: '01b76c3f3a' },   /* 1.2 Mindset Sport — Simple & Powerful */
      { type: 'vimeo', id: '1057946404', h: '32d1731d94' },   /* 1.3 Above the Line deep dive */
      { type: 'vimeo', id: '1057946740', h: 'ad497964dd' },   /* 1.4 Above the Line summary */
      { type: 'vimeo', id: '1057992514', h: '39a7efea09' },   /* 2.1 Intro no failure */
      { type: 'vimeo', id: '1057993253', h: 'a0e377a463' },   /* 2.2 Sport 2 — no failure */
      { type: 'vimeo', id: '1057993947', h: '050f21a22a' },   /* 2.3 Summary no failure */
      { type: 'vimeo', id: '1058001287', h: 'aacf5e8fee' },   /* 3. ESIP Intro */
      { type: 'vimeo', id: '1058014143', h: '5c16a3ee50' },   /* 4. Goal Setting Intro */
      { type: 'vimeo', id: '1058013428', h: '4889d44aee' },   /* 4.1 Animation */
      { type: 'vimeo', id: '1058013161', h: '9ec326fc49' },   /* 4.2 90-Day Goals */
      { type: 'vimeo', id: '1058013794', h: '148790e3a6' },   /* 4.3 Top 5 Goals */
      { type: 'vimeo', id: '1058014738', h: 'd33926d00a' },   /* 4.4 Goal Summary */
      { type: 'vimeo', id: '1058001585', h: 'd0776cc1f4' },   /* 5.1 Beyond Fear Intro */
      { type: 'vimeo', id: '1058002386', h: '82d3bb9d67' },   /* 5.2 Animation Fear */
      { type: 'vimeo', id: '1058003540', h: '79850e86ba' },   /* 5.3 Unpack & Summary */
      { type: 'vimeo', id: '1058016139', h: 'b5e41053e2' },   /* 6.1 Body, Soul and Spirit */
      { type: 'vimeo', id: '1058015323', h: 'be2e764833' }    /* 6.2 Body Soul Spirit deep dive */
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
const COURSE_HOOKS = {
  'fire-truck-training': ['When fire comes, know the truck.', 'Start it, drive it, fill it, and put water where it’s needed — hands-on, step by step.'],
  'alignment-journey': ['One team, one way of showing up.', 'Six shifts that align how we think, set goals, meet fear, and work the land together.'],
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
  'alignment-journey': ['Uma equipa, uma forma de estar.', 'Seis mudanças que alinham como pensamos, definimos objetivos, enfrentamos o medo e trabalhamos a terra juntos.'],
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
const COURSE_PT = {
  'fire-truck-training': { title:'Formação — Camião de Incêndio', desc:'Operação prática do camião de combate a incêndios da propriedade — arrancar, conduzir, encher e pôr água exatamente onde é preciso. Quando chega a época de fogos, todos devem saber mover água.', modules:['Arrancar e Conduzir o Camião','Encher o Depósito de Água','Todo-o-Terreno, Bomba e Jato','Potência, Segurança e o Exercício'] },
  'alignment-journey': { title:'A Jornada de Alinhamento EdenRise', desc:'A jornada interior da equipa EdenRise — a mentalidade que molda como trabalhamos a terra e uns com os outros. Seis mudanças, do pensamento “Acima da Linha” aos objetivos, ao medo, e à totalidade de corpo, alma e espírito.', modules:[
    'Boas-vindas',
    'Acima da Linha · Introdução', 'Acima da Linha · Pensamento Simples e Poderoso', 'Acima da Linha · Análise Profunda', 'Acima da Linha · Síntese',
    'Sem Fracasso, Só Feedback · Introdução', 'Sem Fracasso, Só Feedback · Animação', 'Sem Fracasso, Só Feedback · Síntese',
    'ESIP · Introdução',
    'Definição de Objetivos · Introdução', 'Definição de Objetivos · Animação', 'Objetivos a 90 Dias', 'Os 5 Principais Objetivos', 'Definição de Objetivos · Síntese',
    'Para Além do Medo · Introdução', 'Para Além do Medo · Animação', 'Para Além do Medo · Desmontar e Sintetizar',
    'Corpo, Alma e Espírito · Introdução', 'Corpo, Alma e Espírito · Análise Profunda'
  ] },
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
const COURSE_SKILLS = {
  'fire-truck-training': ['safety'],
  'alignment-journey': ['leadership', 'community'],
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
