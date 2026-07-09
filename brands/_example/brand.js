/* ============================================================================
   EXAMPLE INSTANCE · "Nova"  — the living template + demo brand
   ----------------------------------------------------------------------------
   Copy this folder to create a real client (see ONBOARDING.md). It is registered
   but has NO hostname, so it never auto-selects in production — view it any time
   with  ?brand=nova  to see the SAME engine as a completely different company.
   (Its firebase is a placeholder — a real client uses its OWN project.)
============================================================================ */
(window.EdenBrands = window.EdenBrands || {}).nova = {
  id: 'nova',
  name: 'Nova',
  academy: 'Nova Academy',
  tagline: 'Skills for what’s next',
  title: 'Nova Academy — Skills for what’s next',
  ogDesc: 'Practical professional skills — learn by doing, apply on Monday.',
  twDesc: 'Modern skills academy with adaptive AI paths and an AI tutor.',
  domain: 'learn.example.com',
  hostnames: [],                 /* demo-only — never auto-selects; use ?brand=nova */
  lang: 'en',
  ethos: 'Nova, a modern professional-skills academy. Courses build practical capability in leadership, communication, data and craft — learn by doing, apply on Monday.',
  shortDesc: 'a modern professional-skills academy',
  realm: 'real workplace situations (deadlines, difficult conversations, ambiguous priorities, cross-team work, tools and data)',
  location: 'Online',
  firebase: {                    /* PLACEHOLDER — a real client puts its OWN project here */
    apiKey: 'DEMO', authDomain: 'nova-demo.firebaseapp.com', projectId: 'nova-demo',
    storageBucket: 'nova-demo.appspot.com', messagingSenderId: '0', appId: 'demo'
  },
  superadmins: [],
  themeColor: '#0b0d1a',
  wordSub: 'Academy',
  logoSvg: '<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="16" cy="16" r="13" stroke="#7c5cff" stroke-width="2"/><path d="M10 21V11l12 10V11" stroke="#43e0c8" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  favicon: null,
  ogImage: null,
  content: 'data.js',            /* a real client ships brands/nova/content.js */
  fonts: {
    link: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap',
    display: '"Space Grotesk", system-ui, sans-serif',
    body: '"Inter", system-ui, sans-serif'
  },
  theme: {
    '--bg': '#0b0d1a', '--bg-2': '#141830',
    '--surface': 'rgba(255,255,255,.05)', '--surface-2': 'rgba(255,255,255,.09)',
    '--line': 'rgba(255,255,255,.12)',
    '--text': '#f2f3ff', '--text-dim': '#b7bad6', '--text-faint': '#7a7e9c',
    '--accent': '#7c5cff', '--accent-2': '#43e0c8', '--glow': 'rgba(124,92,255,.42)',
    '--forest': '#3a3a6a', '--olive': '#55558a', '--cork': '#c98a5b', '--clay': '#b98562',
    '--atlantic': '#43e0c8', '--mist': '#d2d2ee', '--ivory': '#f2f3ff', '--focus': '#7c5cff'
  }
};
