/* ============================================================================
   INSTANCE · EdenRise  (brand pack — pure config, ZERO engine code)
   ----------------------------------------------------------------------------
   Registers this company into the shared registry the core loader reads.
   To create a new client: copy this folder, change the values + point at its
   OWN Firebase project + hostname. Nothing here is logic — see PRODUCT.md.
============================================================================ */
(window.EdenBrands = window.EdenBrands || {}).edenrise = {
  id: 'edenrise',
  name: 'EdenRise',
  academy: 'EdenRise Academy',
  tagline: 'Regenerative Living, Learned',
  title: 'EdenRise Academy — Regenerative Living, Learned',
  ogDesc: 'Where nature leads, the land heals, and stewardship shapes everything we learn.',
  twDesc: 'Regenerative living, learned — with adaptive AI paths and an AI tutor.',
  domain: 'academy.edenrise.com',
  hostnames: ['academy.edenrise.com'],
  lang: 'en',
  /* the "school ethos" the AI tutor is grounded in (see buildTutorSystem) */
  ethos: 'EdenRise, a regenerative-living farm and school in the Baixo Alentejo, Portugal. Its ethos: where nature leads, the land heals, and stewardship shapes everything. The courses teach regenerative living — soil, water, food forests, native flora, foraging, natural building, fire stewardship and nature connection.',
  shortDesc: 'a regenerative-living school in the Baixo Alentejo, Portugal',   /* used inside AI prompts */
  realm: 'the Alentejo reality (heat, drought, fire season, cork-oak montado, clay soils, water scarcity, working as a team)',  /* AI quiz/scenario grounding */
  location: 'Baixo Alentejo, Portugal',   /* certificate / footer line */
  /* this instance's OWN Firebase project */
  firebase: {
    apiKey: 'AIzaSyBt4pfWRLWUdAjVL8xoEoR7o4wFCjUCUjs',
    authDomain: 'edenrise-academy.firebaseapp.com',
    projectId: 'edenrise-academy',
    storageBucket: 'edenrise-academy.firebasestorage.app',
    messagingSenderId: '295112713200',
    appId: '1:295112713200:web:4f3beb0324b9b995383335',
    measurementId: 'G-SWLQKTVJQS'
  },
  superadmins: ['admin@edenrise.com', 'info@edenrise.com', 'john@edenrise.com'],
  themeColor: '#0e140f',
  favicon: null,          /* keep index.html's versioned favicon for the founding brand */
  ogImage: 'https://academy.edenrise.com/og-image.png',
  content: 'data.js',     /* this instance's course catalog (Stage 2 splits per-brand) */
  fonts: {
    link: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Inter:wght@400;500;600;700&display=swap',
    display: '"Cormorant Garamond", Georgia, serif',
    body: '"Inter", -apple-system, sans-serif'
  },
  theme: {
    '--bg': '#0e140f', '--bg-2': '#161f18',
    '--surface': 'rgba(231,237,227,.045)', '--surface-2': 'rgba(231,237,227,.085)',
    '--line': 'rgba(231,237,227,.11)',
    '--text': '#f7f6f1', '--text-dim': '#c2cabb', '--text-faint': '#828c7c',
    '--accent': '#c8a45d', '--accent-2': '#a6c3a5', '--glow': 'rgba(200,164,93,.38)',
    '--forest': '#40563e', '--olive': '#5a6f50', '--cork': '#8a6e4b', '--clay': '#b98562',
    '--atlantic': '#4f7f89', '--mist': '#d2d8d3', '--ivory': '#f7f6f1', '--focus': '#a6c3a5'
  }
};
