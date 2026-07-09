/* ============================================================================
   CORE · brand loader  (part of the shared product — no client data lives here)
   ----------------------------------------------------------------------------
   Instances register themselves into window.EdenBrands (see brands/<id>/brand.js,
   loaded BEFORE this). This loader picks the active brand by hostname (with a
   ?brand=<id> override for local/preview), then applies its theme + <head>
   identity before first paint. Everything else — the whole app — is brand-blind
   and reads window.BRAND. Fix once here, every client inherits it.
============================================================================ */
(function () {
  const REG = window.EdenBrands || {};
  const host = location.hostname;
  const override = new URLSearchParams(location.search).get('brand');
  const key =
       (override && REG[override] && override)
    || Object.keys(REG).find(k => (REG[k].hostnames || []).includes(host))
    || (REG.edenrise ? 'edenrise' : Object.keys(REG)[0]);   /* default: founding brand */

  const B = REG[key] || {};
  window.BRAND = B;

  /* ---- theme tokens (inline on :root — beats any stylesheet, no flash) ---- */
  const rs = document.documentElement.style;
  for (const k in (B.theme || {})) rs.setProperty(k, B.theme[k]);
  if (B.fonts) { rs.setProperty('--font-display', B.fonts.display); rs.setProperty('--font-body', B.fonts.body); }
  if (B.id) document.documentElement.setAttribute('data-brand', B.id);

  /* ---- <head> identity (title, metas, favicon, fonts) -------------------- */
  const meta = (sel, attr, val) => { const el = document.querySelector(sel); if (el && val != null) el.setAttribute(attr, val); };
  if (B.title || B.academy) document.title = B.title || (B.academy + ' — ' + (B.tagline || ''));
  meta('meta[name="theme-color"]', 'content', B.themeColor);
  meta('meta[property="og:title"]', 'content', B.title);
  meta('meta[property="og:description"]', 'content', B.ogDesc);
  meta('meta[property="og:url"]', 'content', B.domain ? 'https://' + B.domain + '/' : null);
  meta('meta[property="og:image"]', 'content', B.ogImage);
  meta('meta[name="twitter:title"]', 'content', B.academy);
  meta('meta[name="twitter:description"]', 'content', B.twDesc);
  meta('meta[name="twitter:image"]', 'content', B.ogImage);
  const fav = document.querySelector('link[rel="icon"]'); if (fav && B.favicon) fav.setAttribute('href', B.favicon);
  const fl = document.getElementById('brandFonts');
  if (fl && B.fonts && B.fonts.link && fl.getAttribute('href') !== B.fonts.link) fl.setAttribute('href', B.fonts.link);

  /* ---- logo + wordmark (body elements — after DOM is ready) --------------
     Wordmark text is always applied (reproduces the founding brand exactly);
     the logo SVG is only swapped when a brand ships its own `logoSvg`. */
  const applyMark = () => {
    const nm = B.wordName || B.name;
    if (nm) document.querySelectorAll('.er-name').forEach(e => { e.textContent = nm.toUpperCase(); });
    document.querySelectorAll('.er-sub').forEach(e => { e.textContent = B.wordSub || 'Academy'; });
    if (B.logoSvg) document.querySelectorAll('.logo-mark').forEach(e => { e.innerHTML = B.logoSvg; });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyMark);
  else applyMark();
})();
