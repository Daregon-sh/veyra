// ==UserScript==
// @name         veyra Backgrounds
// @namespace    https://github.com/Daregon-sh/veyra
// @version      1.2.1
// @downloadURL  https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/veyra%20Backgrounds.js
// @updateURL    https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/codes/veyra%20Backgrounds.js
// @description  Set custom background images per wave/gate on demonic scans
// @match        https://demonicscans.org/*
// @run-at       document-start
// @grant        GM_addStyle
// ==/UserScript==

(function () {
  'use strict';

  // ---------- 1) Define per-page background rules here ----------
  const rules = [
    // A) Match by gate / wave (recommended)
    {
      gate: "3", wave: "3",
      img: "https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/main/veyra%20gate1%20wave1.png"
    },
    {
      gate: "3", wave: "5",
      img: "https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/main/veyra%20gate1%20wave2.png"
    },
    {
      gate: "3", wave: "8",
      img: "https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/main/veyra%20gate1%20wave3.png"
    },
    {
      gate: "5", wave: "9",
      img: "https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/main/veyra%20gate2%20wave1.png"
    },

    // B)  Match with a regex in other cases
     {
       match: /pets\.php\b/,
       img: "https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/pets.png"
     },
     {
       match: /inventory\.php\b/,
       img: "https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/inventory.png"
     },
     {
       match: /merchant\.php\b/,
       img: "https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/merchant.png"
     },
     {
       match: /(blacksmith|forge|craft)\.php\b/,
       img: "https://raw.githubusercontent.com/asura-cr/ui-addon/refs/heads/main/images/blacksmith.png"
     },
     {
       match: /player\.php\b/,
       img: "https://raw.githubusercontent.com/Daregon-sh/veyra/refs/heads/images/player%20page.webp"
     },

  ];

  // ---------- 2) Resolve which image (if any) applies to this page ----------
  const u = new URL(location.href);

  // Normalize and build a helper that tries gate/wave first, then regex rules
  function resolveImage() {
    const gate = u.searchParams.get('gate');
    const wave = u.searchParams.get('wave');

    // Try gate/wave rules first
    const byParams = rules.find(r =>
      r.gate !== undefined && r.wave !== undefined &&
      String(r.gate) === String(gate) &&
      String(r.wave) === String(wave)
    );
    if (byParams) return byParams.img;

    // Then try regex rules
    const href = u.href;
    const byRegex = rules.find(r => r.match instanceof RegExp && r.match.test(href));
    if (byRegex) return byRegex.img;

    return null;
  }

  const IMAGE_URL = resolveImage();
  if (!IMAGE_URL) return; // Not a target page → do nothing

  // ---------- 3) Build CSS and apply ----------
  const css = `
    html, body {
      height: 100% !important;
      background: none !important;
    }

    /* Background layer behind everything */
    body::before {
      content: "";
      position: fixed;
      inset: 0;
      z-index: -1;
      pointer-events: none;

      background-image: url("${IMAGE_URL}");
      background-repeat: no-repeat;
      background-position: center top;
      background-size: cover;
      /* If you prefer parallax-like fixed background; keep as-is.
         For scrolling background, change to: position: absolute; */
    }

    /* Make common site wrappers transparent so the bg is visible */
    #wrapper, .wrapper, #content, .content, .container, .page, main,
    .gate-info, .gate-info-header,.card, .panel, .chapter, .reader, .body, .main {
      opacity:100% !important;
    }

    /* Optional: readability overlay on main content (enable if needed)
    .content, .chapter, .reader {
      background: rgba(0,0,0,0.30) !important;
      backdrop-filter: blur(2px);
    }
    */
  `;

  function addStyleOnce() {
    const id = 'tm-bg-demonicscans-style';
    if (!document.getElementById(id)) {
      const style = document.createElement('style');
      style.id = id;
      style.textContent = css;
      (document.head || document.documentElement).appendChild(style);
    }
  }

  addStyleOnce();

  // Keep the style present even if the site mutates the DOM heavily
  const mo = new MutationObserver(() => addStyleOnce());
  mo.observe(document.documentElement, { childList: true, subtree: true });

})();

(function () {
  'use strict';

  // ---- Config ----
  const SELECTORS = [
    'img.loc-banner',
    'img[class*="loc-banner"]',
  ];
  const APPLY_TO_HTML = true; // also apply to <html> for stronger effect

  // ---- Helpers ----
  function log(...args) {
    console.log('[loc-banner]', ...args);
  }

  function injectCSS() {
    // Strong CSS to hide the banner and to ensure background behavior
    const css = `
      /* hide any candidate immediately */
      img.loc-banner, img[class*="loc-banner"] {
        display: none !important;
        visibility: hidden !important;
        width: 0 !important;
        height: 0 !important;
        pointer-events: none !important;
      }
      html.loc-banner-bg, body.loc-banner-bg {
        background-repeat: no-repeat !important;
        background-position: center top !important;
        background-size: cover !important;
        background-attachment: fixed !important;
      }
      /* Optional readability overlay on body only (comment out if not desired) */
      body.loc-banner-overlay::before {
        content: "";
        position: fixed;
        inset: 0;
        background: rgba(0,0,0,0.25);
        pointer-events: none;
        z-index: 0;
      }
     `;
    const style = document.createElement('style');
    style.id = 'loc-banner-style';
    style.textContent = css;
    document.documentElement.appendChild(style);
  }

  function toAbsoluteUrl(url) {
    try { return new URL(url, location.href).href; } catch { return url; }
  }

  function parseSrcset(srcset) {
    if (!srcset) return null;
    // pick the last (often largest) candidate
    const parts = srcset.split(',').map(s => s.trim()).filter(Boolean);
    if (!parts.length) return null;
    const last = parts[parts.length - 1].split(' ')[0];
    return last || null;
  }

  function getImageUrl(img) {
    if (!img) return null;
    const current = img.currentSrc;
    if (current) return toAbsoluteUrl(current);

    const dataSrc = img.getAttribute('data-src') || img.getAttribute('data-original');
    if (dataSrc) return toAbsoluteUrl(dataSrc);

    const srcset = img.getAttribute('srcset');
    const fromSet = parseSrcset(srcset);
    if (fromSet) return toAbsoluteUrl(fromSet);

    const src = img.getAttribute('src');
    if (src) return toAbsoluteUrl(src);

    return null;
  }

  function findBannerImg() {
    for (const sel of SELECTORS) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  function applyBackground(url) {
    if (!url) return false;

    if (APPLY_TO_HTML) {
      document.documentElement.style.setProperty('background-image', `url("${url}")`, 'important');
      document.documentElement.classList.add('loc-banner-bg');
    }
    document.body && document.body.style.setProperty('background-image', `url("${url}")`, 'important');
    document.body && document.body.classList.add('loc-banner-bg', 'loc-banner-overlay');
    return true;
  }

  function hideImg(img) {
    if (!img) return;
    img.style.setProperty('display', 'none', 'important');
    img.style.setProperty('visibility', 'hidden', 'important');
    img.style.setProperty('width', '0', 'important');
    img.style.setProperty('height', '0', 'important');
    img.style.setProperty('pointer-events', 'none', 'important');
    img.classList.add('loc-banner-hidden');
  }

  let applied = false;

  function attemptApply(reason = 'attempt') {
    const img = findBannerImg();
    if (!img) {
      log('No banner img found yet:', reason);
      return false;
    }

    const url = getImageUrl(img);
    if (!url) {
      log('Banner found but no usable URL yet (lazy-loaded?)', reason, img);
      return false;
    }

    const ok = applyBackground(url);
    if (ok) {
      hideImg(img);
      applied = true;
      log('Applied background from', url, 'via', reason);
      return true;
    }
    return false;
  }

  // ---- Start ----
  injectCSS();

  // Run early and repeatedly in case of dynamic loads
  // 1) Try immediately
  attemptApply('early');

  // 2) Poll a few times in the first seconds
  let pollCount = 0;
  const pollMax = 20;     // ~2s with 100ms
  const poll = setInterval(() => {
    if (applied) return clearInterval(poll);
    pollCount++;
    attemptApply('poll');
    if (pollCount >= pollMax) clearInterval(poll);
  }, 100);

  // 3) Observe DOM changes for SPA/dynamic injections
  const domObserver = new MutationObserver((_muts) => {
    if (applied) return;
    attemptApply('mutation');
  });
  domObserver.observe(document.documentElement, { childList: true, subtree: true, attributes: true });

  // 4) Once applied, watch for the banner src changing
  const watchBanner = () => {
    const img = findBannerImg();
    if (!img) return setTimeout(watchBanner, 500);
    const imgObs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type === 'attributes' && (m.attributeName === 'src' || m.attributeName === 'srcset' || m.attributeName === 'data-src' || m.attributeName === 'data-original')) {
          const url = getImageUrl(img);
          if (url) {
            applyBackground(url);
            hideImg(img);
            log('Reapplied background after banner change:', url);
          }
        }
      }
    });
    imgObs.observe(img, { attributes: true, attributeFilter: ['src', 'srcset', 'data-src', 'data-original'] });
  };
  watchBanner();

  // 5) Safety: re-assert background a few times in case site CSS overwrites later
  let reasserts = 0;
  const reassertTimer = setInterval(() => {
    reasserts++;
    if (applied) {
      // Re-assert computed style
      const bodyBg = getComputedStyle(document.body).backgroundImage;
      const htmlBg = getComputedStyle(document.documentElement).backgroundImage;
      if (bodyBg === 'none' && htmlBg === 'none') {
        attemptApply('reassert');
      }
    }
    if (reasserts > 30) clearInterval(reassertTimer); // stop after ~30s
  }, 1000);

})();
