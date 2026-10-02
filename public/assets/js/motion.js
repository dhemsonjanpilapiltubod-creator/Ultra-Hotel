/* ==========================================================================
   Ultra Hotel — motion & aliveness

   Everything here is additive. If this file never loads, the site is exactly
   as it was: the markup is complete, the CSS hides nothing, and every link
   still works. Nothing in this file is required to read or use the site.

   Two standing rules:

     1. Reduced motion is a supported mode, not a degraded one. Under
        prefers-reduced-motion every function below either returns early or
        takes the plain path, so the result is a still, elegant page — not a
        page with the movement missing.

     2. Pointer effects need a pointer. Anything that follows the cursor is
        gated on (hover: hover) and (pointer: fine), because a touch device
        has no hover position to track and would otherwise get a card that
        sticks tilted at whatever the last tap was.

   Scroll-driven work shares one rAF-batched listener rather than each feature
   adding its own, so a page pays for one frame callback, not eight.
   ========================================================================== */

import { $, $$, el, clamp, prefersReducedMotion } from "./core.js";

/* --------------------------------------------------------------------------
   Shared frame loop
   -------------------------------------------------------------------------- */

const frameTasks = new Set();
let frameQueued = false;
let loopStarted = false;

function runFrame() {
  frameQueued = false;
  for (const task of frameTasks) {
    try {
      task();
    } catch (err) {
      /* one broken effect must never stop the others, or the page */
      console.error("[ultra] motion task failed", err);
    }
  }
}

function onFrame(fn) {
  frameTasks.add(fn);
  if (!loopStarted) {
    loopStarted = true;
    const queue = () => {
      if (frameQueued) return;
      frameQueued = true;
      requestAnimationFrame(runFrame);
    };
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue, { passive: true });
  }
}

const finePointer = () => window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/* ==========================================================================
   1. Paper grain + scroll progress + back to top
      Three fixed overlays, created once, each with a job.
   ========================================================================== */

const CHROME_ICON =
  '<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M8 13V3M3.5 7.5 8 3l4.5 4.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function initGrain() {
  if ($(".grain")) return;
  document.body.append(el("div", { class: "grain", "aria-hidden": "true" }));
}

function initProgress() {
  let mount = $("[data-progress-mount]");
  if (!mount) {
    mount = el("div", { class: "progress", "aria-hidden": "true" });
    document.body.append(mount);
  }
  const bar = el("span", { class: "progress__bar" });
  mount.replaceChildren(bar);

  let last = -1;
  onFrame(() => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;
    if (Math.abs(p - last) < 0.001) return;
    last = p;
    bar.style.transform = `scaleX(${p.toFixed(4)})`;
  });
}

function initBackToTop() {
  if ($(".totop")) return;

  const btn = el("button", {
    class: "totop",
    type: "button",
    "aria-label": "Back to top",
  });
  btn.innerHTML = CHROME_ICON;
  btn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  });
  document.body.append(btn);

  onFrame(() => {
    btn.classList.toggle("is-shown", window.scrollY > window.innerHeight * 0.9);
  });
}

/* ==========================================================================
   2. Word-mask heading reveal

   [data-split] headings are broken into per-word windows; the glyphs inside
   each window rise out of it. The words stay in the document in reading
   order, so this is purely visual: with the effect off, with JS off, or under
   reduced motion the heading is one ordinary line of text.

   Nested inline elements are kept — the hero headline's <em> must survive.
   -------------------------------------------------------------------------- */

function splitWords(node) {
  for (const child of Array.from(node.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent;
      if (!text.trim()) continue;

      const frag = document.createDocumentFragment();
      // split on whitespace but keep the whitespace, or the words fuse
      for (const part of text.split(/(\s+)/)) {
        if (!part) continue;
        if (!part.trim()) {
          frag.append(document.createTextNode(part));
          continue;
        }
        const window_ = el("span", { class: "split__word" });
        window_.append(el("span", { class: "split__inner", text: part }));
        frag.append(window_);
      }
      child.replaceWith(frag);
    } else if (child.nodeType === Node.ELEMENT_NODE && !child.classList.contains("split__word")) {
      splitWords(child);
    }
  }
}

function initSplit(root = document) {
  const headings = $$("[data-split]", root);
  if (!headings.length) return;

  for (const heading of headings) {
    if (heading.dataset.splitReady) continue;
    heading.dataset.splitReady = "1";
    heading.classList.add("split");
    splitWords(heading);

    // stagger in reading order, but cap it so a long headline cannot take
    // longer to arrive than the visitor is willing to look at it
    const words = $$(".split__inner", heading);
    const step = 42;
    words.forEach((word, i) => {
      word.style.setProperty("--word-delay", `${Math.min(i, 14) * step}ms`);
    });
  }

  // the hero reveals on load; everything else reveals on approach
  const onLoad = headings.filter((h) => h.closest(".hero") || h.hasAttribute("data-hero-anim"));
  const onScroll = headings.filter((h) => !onLoad.includes(h));

  const reveal = (nodes) => {
    for (const n of nodes) n.classList.add("is-in");
  };

  if (onLoad.length) {
    if (prefersReducedMotion()) reveal(onLoad);
    else requestAnimationFrame(() => setTimeout(() => reveal(onLoad), 60));
  }

  if (!onScroll.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    reveal(onScroll);
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
    { rootMargin: "0px 0px -12% 0px", threshold: 0.15 },
  );
  for (const h of onScroll) io.observe(h);
}

/* ==========================================================================
   3. Eyebrow rule draw

   .eyebrow-rule's hairline is a pseudo-element; the rule only grows once the
   label beside it has arrived.
   ========================================================================== */

function initEyebrowRules(root = document) {
  const rules = $$(".eyebrow-rule", root);
  if (!rules.length) return;

  if (prefersReducedMotion() || !("IntersectionObserver" in window)) {
    for (const r of rules) r.classList.add("is-in");
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
    { rootMargin: "0px 0px -8% 0px", threshold: 0.4 },
  );
  for (const r of rules) io.observe(r);
}

/* ==========================================================================
   4. Magnetic buttons

   A primary action leans a few pixels toward the pointer. Applied through
   [data-magnetic] rather than to every .btn on the site — a page where
   everything pulls toward the cursor stops reading as a hotel.
   -------------------------------------------------------------------------- */

function initMagnetic(root = document) {
  if (prefersReducedMotion() || !finePointer()) return;

  for (const node of $$("[data-magnetic]", root)) {
    if (node.dataset.magneticReady) continue;
    node.dataset.magneticReady = "1";

    const strength = Number(node.dataset.magnetic) || 0.28;

    const release = () => {
      node.style.setProperty("--mx", "0px");
      node.style.setProperty("--my", "0px");
      node.classList.remove("is-magnetised");
    };

    node.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const rect = node.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      node.classList.add("is-magnetised");
      node.style.setProperty("--mx", `${(dx * strength).toFixed(2)}px`);
      node.style.setProperty("--my", `${(dy * strength).toFixed(2)}px`);
    });

    node.addEventListener("pointerleave", release);
    node.addEventListener("blur", release);
  }
}

/* ==========================================================================
   5. Tilt & sheen

   A card leans toward the pointer and catches a warm highlight on its photo.
   The lean is written to two custom properties and the transform itself stays
   in the stylesheet, so the card never has two rules fighting over transform.

   .tile is deliberately excluded: the home page offsets every second tile with
   a CSS transform, and a second transform on the same element silently kills
   that stagger.
   -------------------------------------------------------------------------- */

const TILT_SELECTOR = ".card, .brand-card, .dine-card, .exp-card, .award, .benefit";

function initTilt(root = document) {
  if (prefersReducedMotion() || !finePointer()) return;

  for (const card of $$(TILT_SELECTOR, root)) {
    if (card.dataset.tiltReady) continue;
    card.dataset.tiltReady = "1";
    card.classList.add("tilt");

    const box = $(".media", card);
    if (box) {
      box.append(el("span", { class: "tilt__sheen", "aria-hidden": "true" }));
    }

    const maxTilt = Number(card.dataset.tilt) || 5;

    const enter = (e) => {
      if (e.pointerType !== "mouse") return;
      const rect = card.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      card.style.setProperty("--tilt-y", `${((px - 0.5) * 2 * maxTilt).toFixed(2)}deg`);
      card.style.setProperty("--tilt-x", `${((0.5 - py) * 2 * maxTilt).toFixed(2)}deg`);
      card.style.setProperty("--sheen-x", `${(px * 100).toFixed(1)}%`);
      card.style.setProperty("--sheen-y", `${(py * 100).toFixed(1)}%`);
      card.style.setProperty("--sheen-op", "1");
      card.style.setProperty("--lift", "1");
      card.classList.add("is-tilting");
    };

    const leave = () => {
      card.classList.remove("is-tilting");
      card.style.setProperty("--tilt-x", "0deg");
      card.style.setProperty("--tilt-y", "0deg");
      card.style.setProperty("--sheen-op", "0");
      card.style.setProperty("--lift", "0");
    };

    card.addEventListener("pointermove", enter);
    card.addEventListener("pointerleave", leave);
    card.addEventListener("pointercancel", leave);
  }
}

/* ==========================================================================
   6. Button sheen sweep

   One pass of light across the primary calls to action. Opted in by class so
   a button that already relies on ::after for something else is untouched.
   -------------------------------------------------------------------------- */

function initSheen(root = document) {
  if (prefersReducedMotion()) return;
  for (const btn of $$(".btn--gold, .btn--outline", root)) {
    if (!btn.classList.contains("btn--sheen")) btn.classList.add("btn--sheen");
  }
}

/* ==========================================================================
   7. Scrollspy

   The header says which part of the page you are reading. A section opts in
   with data-spy="<the nav item's href>", e.g. data-spy="dining.html".

   The mapping is declared rather than inferred because the top nav links to
   whole pages and carries no fragments, so matching a section id against a
   href hash would never once have hit.
   ========================================================================== */

function initScrollspy() {
  const nav = $("#site-nav");
  const sections = $$("main [data-spy]");
  if (!nav || sections.length < 1) return;

  // href -> the <li> that leads there
  const targets = new Map();
  for (const item of $$("li.nav__item", nav)) {
    const link = $("a.nav__link", item);
    const href = link?.getAttribute("href");
    if (href && !targets.has(href)) targets.set(href, item);
  }
  if (!targets.size) return;

  let current = null;

  onFrame(() => {
    const line = window.innerHeight * 0.38;
    let active = null;
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= line) active = section;
      else break;
    }
    const href = active?.dataset.spy ?? null;
    if (href === current) return;
    current = href;
    for (const [key, item] of targets) item.classList.toggle("is-current", key === href);
  });
}

/* ==========================================================================
   boot
   ========================================================================== */

export function initMotion() {
  initGrain();
  initProgress();
  initBackToTop();
  initSplit();
  initEyebrowRules();
  initMagnetic();
  initTilt();
  initSheen();
  initScrollspy();
}

/* Re-scan after a page module has injected cards. Split headings live in the
   static markup, so only the per-card effects need a second pass. */
export function refreshMotion(root = document) {
  initMagnetic(root);
  initTilt(root);
  initSheen(root);
}
