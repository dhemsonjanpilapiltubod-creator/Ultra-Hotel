/* ==========================================================================
   Ultra Hotel — core
   Small helpers, scroll reveal, image hydration, shared behaviour.
   Every entry point is defensive: a page that has no chat launcher simply
   gets no chat launcher.
   ========================================================================== */

/* --- tiny DOM helpers -------------------------------------------------- */

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
if (k === "class") node.className = v;
      else if (k === "html") node.innerHTML = v;
      // `text` is the documented key. textContent is accepted too: it fell
      // through to setAttribute and produced an element with the label
      // stashed in a stray attribute and nothing on screen — a <option> that
      // looked empty. Silently, which is the worst way to fail.
      else if (k === "text" || k === "textContent") node.textContent = v;
    else if (k === "dataset") Object.assign(node.dataset, v);
    else if (k.startsWith("on") && typeof v === "function") node.addEventListener(k.slice(2), v);
    else node.setAttribute(k, v === true ? "" : String(v));
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

export const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

export function debounce(fn, wait = 150) {
  let t = 0;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function throttle(fn, wait = 100) {
  let last = 0;
  let queued = null;
  return (...args) => {
    const now = performance.now();
    if (now - last >= wait) {
      last = now;
      fn(...args);
    } else {
      clearTimeout(queued);
      queued = setTimeout(() => {
        last = performance.now();
        fn(...args);
      }, wait - (now - last));
    }
  };
}

/* --- motion preference ------------------------------------------------- */

const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

export const prefersReducedMotion = () => motionQuery.matches;

export function onMotionChange(fn) {
  if (typeof motionQuery.addEventListener === "function") {
    motionQuery.addEventListener("change", fn);
  } else if (typeof motionQuery.addListener === "function") {
    motionQuery.addListener(fn); // Safari < 14
  }
}

/* --- query string ------------------------------------------------------ */

export function readParams() {
  return new URLSearchParams(window.location.search);
}

export function currentPath() {
  return window.location.pathname.split("/").pop() || "index.html";
}

/* ==========================================================================
   Image hydration — lazy-load + blur-up.
   Markup contract:  <div class="media media--3x2">
                        <span class="media__ph" data-ph="tiny-blur-url"></span>
                        <img data-src="full-url" alt="...">
                      </div>
   The .media box reserves the space, so bytes arriving late cost zero layout
   shift. If JS is off the browser still renders: CSS keeps the placeholder
   hidden and the raw src is used, see the no-JS block in base.css.
   ========================================================================== */

const IMAGE_SOURCES = [
  { selector: "img[data-src]", src: (node) => node.dataset.src },
  { selector: "source[data-srcset]", srcset: (node) => node.dataset.srcset },
];

function hydrateOne(media) {
  const img = media.querySelector("img");
  const ph = media.querySelector(".media__ph");

  const markLoaded = () => {
    media.classList.add("is-ready");
    if (img) img.classList.add("is-loaded");
    if (ph) ph.classList.add("is-hidden");
  };

  const fail = () => {
    // Never leave a grey box: fall back to the placeholder, then unhide.
    if (ph) {
      ph.classList.remove("is-hidden");
      ph.style.filter = "none";
      ph.style.opacity = "0.25";
    }
    if (img) img.classList.add("is-loaded");
  };

  if (img) {
    if (img.complete && img.naturalWidth > 0) markLoaded();
    else {
      img.addEventListener("load", markLoaded, { once: true });
      img.addEventListener("error", fail, { once: true });
    }
  }
}

export function hydrateImages(root = document) {
  const targets = $$(".media", root).filter((m) => !m.dataset.hydrated);
  if (!targets.length) return;

  targets.forEach((m) => {
    m.dataset.hydrated = "1";
    const img = m.querySelector("img[data-src]");
    if (!img) {
      hydrateOne(m);
      return;
    }
  });

  if (!("IntersectionObserver" in window)) {
    loadAll(targets);
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        obs.unobserve(entry.target);
        startLoad(entry.target);
      }
    },
    { rootMargin: "300px 0px" },
  );

  targets.forEach((m) => io.observe(m));
}

function startLoad(media) {
  const img = media.querySelector("img[data-src]");
  if (img) {
    hydrateOne(media);
    img.src = img.dataset.src;
    delete img.dataset.src;
    return;
  }
  for (const node of $$("[data-srcset]", media)) {
    node.srcset = node.dataset.srcset;
    delete node.dataset.srcset;
  }
  hydrateOne(media);
}

function loadAll(targets) {
  for (const m of targets) startLoad(m);
}

/** Manually hydrate a detached subtree before inserting it. */
export function hydrateSubtree(node) {
  hydrateImages(node);
  return node;
}

/* ==========================================================================
   Scroll reveal
   ========================================================================== */

export function initReveal(root = document) {
  const items = $$(".reveal:not(.is-in)", root);
  if (!items.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    items.forEach((n) => n.classList.add("is-in"));
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        obs.unobserve(entry.target);
        entry.target.classList.add("is-in");
      }
    },
    { rootMargin: "0px 0px -12% 0px", threshold: 0.08 },
  );

  items.forEach((node) => {
    // stagger siblings that opt in with data-reveal-stagger
    const group = node.closest("[data-reveal-stagger]");
    if (group && !node.style.getPropertyValue("--reveal-delay")) {
      const peers = $$(".reveal", group);
      const i = peers.indexOf(node);
      if (i > 0) node.style.setProperty("--reveal-delay", `${i * 90}ms`);
    }
    io.observe(node);
  });
}

/* ==========================================================================
   Counters — count up once when scrolled into view
   ========================================================================== */

function animateCount(node, target, { suffix = "", duration = 1900 } = {}) {
  if (prefersReducedMotion()) {
    node.textContent = target.toLocaleString("en-US") + suffix;
    return;
  }
  const start = performance.now();
  const from = 0;
  const step = (now) => {
    const t = clamp((now - start) / duration, 0, 1);
    // easeOutExpo — fast start, long settle
    const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    const value = Math.round(from + (target - from) * eased);
    node.textContent = value.toLocaleString("en-US") + suffix;
    if (t < 1) requestAnimationFrame(step);
    else node.textContent = target.toLocaleString("en-US") + suffix;
  };
  requestAnimationFrame(step);
}

export function initCounters(root = document) {
  // Guarded: a page that re-renders its stats calls initCounters again, and
  // without this the same node would be observed — and animated — twice.
  const nodes = $$("[data-count-to]", root).filter((n) => !n.dataset.counted);
  if (!nodes.length) return;

  if (!("IntersectionObserver" in window)) {
    nodes.forEach((n) => {
      n.dataset.counted = "1";
      n.textContent = n.dataset.countTo + (n.dataset.countSuffix || "");
    });
    return;
  }

  const io = new IntersectionObserver(
    (entries, obs) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        obs.unobserve(entry.target);
        const target = Number(entry.target.dataset.countTo);
        if (Number.isFinite(target)) {
          animateCount(entry.target, target, { suffix: entry.target.dataset.countSuffix || "" });
        }
      }
    },
    { threshold: 0.4 },
  );

  nodes.forEach((n) => {
    n.dataset.counted = "1";
    io.observe(n);
  });
}

/* ==========================================================================
   Parallax — transform a background layer as the section scrolls.
   Cheap: one rAF-driven transform, no scroll listener spam.
   ========================================================================== */

/* The two accepted contracts:
     [data-parallax]        an explicit layer, strength from data-parallax
     [data-parallax-host]   the section's media box; the host is the marker and
                            the moving layer is picked from its own layout

   A full-bleed box (.hero__media, .feature__media) is absolutely positioned and
   deliberately oversized by 6%, so the box itself can slide. An in-flow box
   (.feature__media--inset) has no overscan and must not move or it would slide
   out of its grid slot, so its own <img> moves inside the clip instead. */
function parallaxLayer(host) {
  const position = getComputedStyle(host).position;
  if (position === "absolute" || position === "fixed") return host;
  return host.querySelector(":scope > img, :scope > video") || host;
}

export function initParallax(root = document) {
  const layers = [
    ...$$("[data-parallax]", root).map((node) => ({ node, host: node.closest("[data-parallax-host]") || node.parentElement || node })),
    ...$$("[data-parallax-host]", root).map((node) => ({ node, host: node })),
  ];

  if (!layers.length || prefersReducedMotion()) return;

  // one measurement pass, then only write to layers that are actually on screen
  const movers = layers.map(({ node, host }) => ({
    layer: node,
    host,
    target: node.dataset.parallax === undefined ? parallaxLayer(host) : node,
    strength: Number(node.dataset.parallax ?? node.dataset.parallaxHost) || 0.12,
    rect: null,
  }));

  let ticking = false;

  const measure = () => {
    for (const m of movers) m.rect = m.host.getBoundingClientRect();
  };

  const update = () => {
    ticking = false;
    const vh = window.innerHeight;
    for (const m of movers) {
      const rect = m.rect;
      if (!rect) continue;
      if (rect.bottom < -200 || rect.top > vh + 200) continue;
      // -1 (below viewport) .. 1 (above viewport)
      const progress = (rect.top + rect.height / 2 - vh / 2) / (vh / 2 + rect.height / 2);
      const shift = -progress * m.strength * 100;
      m.target.style.transform = `translate3d(0, ${shift.toFixed(2)}px, 0)`;
    }
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      measure();
      update();
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", throttle(onScroll, 150), { passive: true });
  measure();
  update();
}

/* ==========================================================================
   Misc
   ========================================================================== */

export function stampYear(nodeSel = "[data-year]") {
  for (const n of $$(nodeSel)) n.textContent = String(new Date().getFullYear());
}

export function setHidden(node, hidden) {
  if (node) node.hidden = Boolean(hidden);
}

/** A focus trap for full-screen overlays. Returns a release function. */
export function trapFocus(container, { onEscape } = {}) {
  const selector =
    'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  const focusables = () => $$(selector, container).filter((n) => n.offsetParent !== null || n === document.activeElement);

  const onKey = (e) => {
    if (e.key === "Escape") {
      if (onEscape) {
        e.preventDefault();
        onEscape();
      }
      return;
    }
    if (e.key !== "Tab") return;
    const list = focusables();
    if (!list.length) return;
    const first = list[0];
    const last = list[list.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  };

  container.addEventListener("keydown", onKey);
  return () => container.removeEventListener("keydown", onKey);
}

export function lockScroll(locked) {
  document.body.classList.toggle("is-locked", Boolean(locked));
}

/** Inline SVG sprite lookup — avoids duplicating path data across pages. */
export function icon(name, { className = "" } = {}) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", className);
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  use.setAttribute("href", `#i-${name}`);
  svg.append(use);
  return svg;
}

/* --- boot -------------------------------------------------------------- */

export function boot() {
  document.documentElement.classList.add("js");
  refresh(document);
  initParallax();
  stampYear();
}

/**
 * Re-run the boot-time passes over markup that appeared after boot.
 *
 * Every one of these is already idempotent (they skip what they have handled),
 * which is what makes it safe to call on every render: a page module that
 * rebuilds its result grid in response to a filter or a search must hand the
 * new nodes back here, or the cards stay at opacity 0 forever, their lazy
 * images never start loading, and freshly injected counters read 0.
 *
 * Parallax is deliberately not included — initParallax attaches a scroll
 * listener per call and the cards it would cover do not use it.
 */
export function refresh(root = document) {
  hydrateImages(root);
  initReveal(root);
  initCounters(root);
}
