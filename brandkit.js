/* ============================================================================
   WHITE-LABEL BRAND KIT  ·  one engine, many companies
   ----------------------------------------------------------------------------
   The whole app (app.js / auth.js / component CSS / rules) is SHARED and brand-
   agnostic. Everything that makes a deployment "EdenRise" vs another company —
   colours, fonts, name, logo, Firebase project, domain, school ethos — lives
   HERE as pure config. Fix the engine once and every brand inherits it.

   To add a company: copy the `edenrise` block, give it its own values + its own
   Firebase project, add its hostname, ship its content module. Nothing else.

   Selection: by hostname (each brand lists its live domains), with a ?brand=<id>
   override for local/preview. Must load FIRST (before styles.css + auth.js).
============================================================================ */
(function () {
  const BRANDS = {

    /* ---- Brand #1 — EdenRise (live) ------------------------------------ */
    edenrise: {
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
      favicon: null,   /* keep index.html's versioned favicon for the founding brand */
      ogImage: 'https://academy.edenrise.com/og-image.png',
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
    }

    /* ---- Brand #2 — TEMPLATE (copy, rename the key, fill in) ------------
    ,acme: {
      id: 'acme',
      name: 'Acme',
      academy: 'Acme Academy',
      tagline: 'Your tagline here',
      title: 'Acme Academy — Your tagline',
      ogDesc: '…', twDesc: '…',
      domain: 'learn.acme.com',
      hostnames: ['learn.acme.com'],
      lang: 'en',
      ethos: 'Acme — describe the company/school so the AI tutor is grounded in the right world…',
      firebase: {  // its OWN Firebase project — created in the Acme Firebase console
        apiKey: '…', authDomain: 'acme-academy.firebaseapp.com', projectId: 'acme-academy',
        storageBucket: 'acme-academy.firebasestorage.app', messagingSenderId: '…', appId: '…'
      },
      superadmins: ['admin@acme.com'],
      themeColor: '#0b0b12',
      favicon: 'brands/acme/favicon.svg',
      ogImage: 'https://learn.acme.com/brands/acme/og-image.png',
      fonts: {
        link: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&display=swap',
        display: '"Space Grotesk", system-ui, sans-serif',
        body: '"Inter", system-ui, sans-serif'
      },
      theme: {  // a completely different palette — full rebrand
        '--bg': '#0b0b12', '--bg-2': '#14141f', '--surface': 'rgba(255,255,255,.05)',
        '--surface-2': 'rgba(255,255,255,.09)', '--line': 'rgba(255,255,255,.12)',
        '--text': '#f4f4fb', '--text-dim': '#b9b9cc', '--text-faint': '#7a7a90',
        '--accent': '#7c5cff', '--accent-2': '#43e0c8', '--glow': 'rgba(124,92,255,.4)',
        '--forest': '#3a3a55', '--olive': '#55557a', '--cork': '#8a6e4b', '--clay': '#b98562',
        '--atlantic': '#4f7f89', '--mist': '#d2d2e0', '--ivory': '#f4f4fb', '--focus': '#7c5cff'
      },
      content: 'brands/acme/content.js'   // Acme's own catalog (Stage 2)
    }
    ------------------------------------------------------------------------ */

  };

  /* ---- selection --------------------------------------------------------- */
  const host = location.hostname;
  const override = new URLSearchParams(location.search).get('brand');
  const key = (override && BRANDS[override] && override)
    || Object.keys(BRANDS).find(k => (BRANDS[k].hostnames || []).includes(host))
    || 'edenrise';                       /* default: the founding brand */
  const B = BRANDS[key];
  window.BRAND = B;

  /* ---- apply theme immediately (inline on :root beats any stylesheet) ---- */
  const rs = document.documentElement.style;
  for (const k in (B.theme || {})) rs.setProperty(k, B.theme[k]);
  if (B.fonts) { rs.setProperty('--font-display', B.fonts.display); rs.setProperty('--font-body', B.fonts.body); }
  document.documentElement.setAttribute('data-brand', B.id);

  /* ---- apply <head> identity (title, metas, favicon, fonts) -------------- */
  function meta(sel, attr, val) { const el = document.querySelector(sel); if (el && val != null) el.setAttribute(attr, val); }
  document.title = B.title || (B.academy + ' — ' + (B.tagline || ''));
  meta('meta[name="theme-color"]', 'content', B.themeColor);
  meta('meta[property="og:title"]', 'content', B.title);
  meta('meta[property="og:description"]', 'content', B.ogDesc);
  meta('meta[property="og:url"]', 'content', 'https://' + B.domain + '/');
  meta('meta[property="og:image"]', 'content', B.ogImage);
  meta('meta[name="twitter:title"]', 'content', B.academy);
  meta('meta[name="twitter:description"]', 'content', B.twDesc);
  meta('meta[name="twitter:image"]', 'content', B.ogImage);
  const fav = document.querySelector('link[rel="icon"]'); if (fav && B.favicon) fav.setAttribute('href', B.favicon);
  /* swap the Google-Fonts link only when a brand asks for different fonts */
  const fl = document.getElementById('brandFonts');
  if (fl && B.fonts && B.fonts.link && fl.getAttribute('href') !== B.fonts.link) fl.setAttribute('href', B.fonts.link);
})();
