/* ==========================================================================
   Ultra Hotel — UI components
   rails · tabs · accordions · filter bars · lightbox · quote slider
   Each is opt-in: it looks for its own data attribute and stays inert if the
   markup is not on the page.
   ========================================================================== */

import { $, $$, el, clamp, debounce, prefersReducedMotion, trapFocus, lockScroll } from "./core.js";

/* ==========================================================================
   Rail — a horizontal scroll-snap track with arrows and a progress bar
   Markup:  <div class="rail" data-rail>
              <div class="rail__track">…cards…</div>
            </div>
   Arrows are optional: <button data-rail-prev> / <button data-rail-next>
   ========================================================================== */

// Wiring a rail attaches listeners, so it must happen once per rail. refresh()
// asks for rails on every re-render; without these two the second pass would
// double every scroll handler.
const wired = new WeakSet();
const syncers = new WeakMap();

function stepFor(track) {
  const first = track.firstElementChild;
  if (!first) return 240;
  const gap = parseFloat(getComputedStyle(track).columnGap || "0") || 0;
  return first.getBoundingClientRect().width + gap;
}

export function initRails(root = document) {
  for (const rail of $$("[data-rail]", root)) {
    const track = $(".rail__track", rail);
    if (!track) continue;
    // Wiring is not idempotent, and refresh() asks for rails on every re-render.
    // A second pass would attach a second scroll handler per rail, so each rail
    // gets wired exactly once and re-syncs through the stored sync function.
    if (wired.has(rail)) continue;
    wired.add(rail);

    const prev = $("[data-rail-prev]", rail.parentElement || rail) || $("[data-rail-prev]");
    const next = $("[data-rail-next]", rail.parentElement || rail) || $("[data-rail-next]");
    const bar = $(".rail__bar span", rail);
    const enabled = () => !prefersReducedMotion() && !window.matchMedia("(min-width: 901px)").matches;

    const page = (dir) => {
      track.scrollBy({ left: dir * stepFor(track) * (window.innerWidth < 720 ? 1 : 2), behavior: enabled() ? "smooth" : "auto" });
    };

    prev?.addEventListener("click", () => page(-1));
    next?.addEventListener("click", () => page(1));

    const sync = () => {
      const max = track.scrollWidth - track.clientWidth;
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= max - 2;
      if (prev) prev.disabled = atStart;
      if (next) next.disabled = max <= 2 || atEnd;
      if (bar) {
        const visible = max <= 0 ? 1 : track.clientWidth / track.scrollWidth;
        const span = clamp(visible, 0.12, 1);
        const travel = (1 - span) * 100;
        const p = max <= 0 ? 0 : track.scrollLeft / max;
        bar.style.width = `${span * 100}%`;
        bar.style.transform = `translateX(${(travel * (p / (1 - span) || 0)).toFixed(2)}%)`;
      }
    };

    syncers.set(rail, sync);

    track.addEventListener("scroll", debounce(sync, 60), { passive: true });
    window.addEventListener("resize", debounce(sync, 120), { passive: true });
    // The track is filled by the page module, after this runs. Without this the
    // buttons measure an empty track, disable themselves, and never come back.
    if (window.ResizeObserver) new ResizeObserver(sync).observe(track);
    sync();

    // Arrows are redundant on touch, where you swipe the track. The old check
    // was a width query, which hid them on every narrow window — including a
    // narrow desktop, and including exactly the widths where the rail is most
    // likely to overflow.
    if (prev && next) {
      const mq = window.matchMedia("(pointer: coarse)");
      const apply = () => {
        const show = !mq.matches;
        for (const b of [prev, next]) if (b) b.hidden = !show;
      };
      mq.addEventListener("change", apply);
      apply();
    }
  }
}

/**
 * Re-measure rails whose contents changed.
 *
 * initRails() runs at boot, before the page module has injected any cards, so it
 * measures an empty track: scrollWidth - clientWidth is 0, both arrows get
 * disabled, and nothing re-runs sync() — the scroll event it listens for cannot
 * happen, because the only way to scroll was the arrow that is now disabled.
 */
export function syncRails(root = document) {
  for (const rail of $$("[data-rail]", root)) {
    syncers.get(rail)?.();
  }
}

/* ==========================================================================
   Tabs — ARIA tablist, arrow-key roving focus
   Markup:  [data-tabs]  >  [role=tablist] > button[role=tab][data-tab="id"]
                                             + [data-tabpanel="id"]
   ========================================================================== */

export function initTabs(root = document) {
  for (const wrap of $$("[data-tabs]", root)) {
    const tabs = $$('[role="tab"]', wrap);
    if (!tabs.length) continue;

    const select = (tab, { focus = false } = {}) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !on;
      }
      if (focus) tab.focus();
    };

    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        let next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          select(next, { focus: true });
        }
      });
    });

    // honour a deep link: ?tab=main
    const wanted = new URLSearchParams(window.location.search).get("tab");
    if (wanted) {
      const match = tabs.find((t) => t.dataset.tab === wanted);
      if (match) select(match);
    }
  }
}

/* ==========================================================================
   Accordion
   Markup:  <div class="acc" data-acc> <div class="acc__item"> <button
              class="acc__btn" aria-expanded> … <div class="acc__panel">
   ========================================================================== */

export function initAccordions(root = document) {
  for (const acc of $$("[data-acc]", root)) {
    const single = acc.dataset.acc === "single";
    const items = $$(".acc__item", acc);

    for (const item of items) {
      const btn = $(".acc__btn", item);
      if (!btn) continue;

      // first item starts open, so the block never looks broken
      if (!item.classList.contains("is-open")) {
        item.classList.remove("is-open");
        btn.setAttribute("aria-expanded", "false");
      }

      btn.addEventListener("click", () => {
        const willOpen = !item.classList.contains("is-open");
        if (single && willOpen) {
          for (const other of items) {
            if (other === item) continue;
            other.classList.remove("is-open");
            $(".acc__btn", other)?.setAttribute("aria-expanded", "false");
          }
        }
        item.classList.toggle("is-open", willOpen);
        btn.setAttribute("aria-expanded", String(willOpen));
      });
    }

    // open the item named in the URL hash
    const hash = window.location.hash.replace("#", "");
    if (hash) {
      const target = items.find((i) => i.id === hash || i.dataset.accItem === hash);
      if (target) {
        target.classList.add("is-open");
        $(".acc__btn", target)?.setAttribute("aria-expanded", "true");
      }
    }
  }
}

/* ==========================================================================
   Filter bar — show/hide by data attribute, keep a live count
   Markup:  [data-filter-group] with buttons[data-filter-value="x"] and
            items carrying data-filter-tags="a b"
   ========================================================================== */

export function initFilters(root = document) {
  for (const group of $$("[data-filter-group]", root)) {
    const buttons = $$("[data-filter-value]", group);
    const targetSel = group.dataset.filterTarget;
    const scope = targetSel ? $(targetSel) || document : document;
    const items = $$(group.dataset.filterItem || "[data-filter-tags]", scope);
    const count = group.dataset.filterCount ? $(group.dataset.filterCount) : null;
    const empty = group.dataset.filterEmpty ? $(group.dataset.filterEmpty) : null;
    const allLabel = group.dataset.filterAll || "nothing";

    if (!items.length) continue;

    const apply = (value, { updateUrl = true } = {}) => {
      let shown = 0;
      for (const item of items) {
        const tags = (item.dataset.filterTags || "").split(/\s+/).filter(Boolean);
        const on = value === "all" || tags.includes(value);
        item.hidden = !on;
        if (on) shown += 1;
      }
      if (count) count.textContent = `${shown} ${shown === 1 ? "result" : "results"}`;
      if (empty) empty.hidden = shown > 0;

      for (const b of buttons) {
        const on = b.dataset.filterValue === value;
        b.classList.toggle("is-active", on);
        b.setAttribute("aria-pressed", String(on));
      }

      if (updateUrl && history.replaceState) {
        const url = new URL(window.location.href);
        if (value === "all") url.searchParams.delete("f");
        else url.searchParams.set("f", value);
        history.replaceState(null, "", url);
      }
    };

    for (const b of buttons) {
      b.addEventListener("click", () => apply(b.dataset.filterValue));
    }

    const initial = new URLSearchParams(window.location.search).get("f") || "all";
    const known = buttons.some((b) => b.dataset.filterValue === initial);
    apply(known ? initial : "all", { updateUrl: false });
  }
}

/* ==========================================================================
   Lightbox — shared instance, fed by any [data-lightbox] trigger
   ========================================================================== */

let lightboxEl = null;
let lightboxState = { items: [], index: 0, caption: null };

function buildLightbox() {
  const box = el("div", {
    class: "lightbox",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": "Image viewer",
  });

  box.innerHTML = `
    <div class="lightbox__bar">
      <span class="lightbox__count" data-lb-count></span>
      <button class="lightbox__close" type="button" data-lb-close aria-label="Close viewer">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
    </div>
    <div class="lightbox__stage">
      <button class="lightbox__nav lightbox__nav--prev" type="button" data-lb-prev aria-label="Previous image">
        <svg viewBox="0 0 16 12" aria-hidden="true"><path d="M15 6H2M7 1.5 2 6l5 4.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
      <img class="lightbox__img" data-lb-img alt="">
      <button class="lightbox__nav lightbox__nav--next" type="button" data-lb-next aria-label="Next image">
        <svg viewBox="0 0 16 12" aria-hidden="true"><path d="M1 6h13M9 1.5 14 6l-5 4.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>
      </button>
    </div>
    <p class="lightbox__caption" data-lb-caption></p>`;

  document.body.append(box);
  wireLightbox(box);
  return box;
}

function wireLightbox(box) {
  if (box._wired) return;
  box._wired = true;
  box.addEventListener("click", (e) => {
    if (e.target.closest("[data-lb-close]") || e.target === box) closeLightbox();
    else if (e.target.closest("[data-lb-prev]")) step(-1);
    else if (e.target.closest("[data-lb-next]")) step(1);
  });
}

function showSlide() {
  const { items, index } = lightboxState;
  if (!items.length) return;
  const item = items[index];
  const img = $("[data-lb-img]", lightboxEl);
  const cap = $("[data-lb-caption]", lightboxEl);
  const count = $("[data-lb-count]", lightboxEl);

  img.classList.remove("is-loaded");
  img.src = item.full || item.src;
  img.alt = item.alt || "";
  if (img.complete) img.classList.add("is-loaded");
  else img.addEventListener("load", () => img.classList.add("is-loaded"), { once: true });

  cap.textContent = item.caption || "";
  count.textContent = items.length > 1 ? `${index + 1} / ${items.length}` : "";

  const multi = items.length > 1;
  $("[data-lb-prev]", lightboxEl).hidden = !multi;
  $("[data-lb-next]", lightboxEl).hidden = !multi;
}

function openLightbox(items, index) {
  if (!lightboxEl) lightboxEl = buildLightbox();
  lightboxState = { items, index: Math.max(0, Math.min(index, items.length - 1)) };
  lightboxEl.hidden = false;
  requestAnimationFrame(() => lightboxEl.classList.add("is-open"));
  lockScroll(true);
  showSlide();
  lightboxEl._release = trapFocus(lightboxEl, { onEscape: closeLightbox });
  $("[data-lb-close]", lightboxEl)?.focus();
}

function closeLightbox() {
  if (!lightboxEl) return;
  lightboxEl.classList.remove("is-open");
  lockScroll(false);
  lightboxEl._release?.();
  lightboxEl._release = null;
  const done = () => {
    lightboxEl.hidden = true;
    lightboxEl.removeEventListener("transitionend", done);
  };
  if (prefersReducedMotion()) done();
  else {
    lightboxEl.addEventListener("transitionend", done);
    setTimeout(() => {
      if (!lightboxEl.classList.contains("is-open")) done();
    }, 600);
  }
}

const step = (dir) => {
  if (lightboxState.items.length < 2) return;
  const n = lightboxState.items.length;
  lightboxState.index = (lightboxState.index + dir + n) % n;
  showSlide();
};

/**
 * A group's members can be the triggers themselves or the elements that wrap
 * them, so read the values from whichever actually carries them.
 */
function lightboxItem(node) {
  const owner = node.matches?.("[data-lightbox]") ? node : $("[data-lightbox]", node);
  if (!owner) return null;
  return {
    src: owner.dataset.lbSrc,
    full: owner.dataset.lbFull,
    alt: owner.dataset.lbAlt || owner.getAttribute("aria-label") || "",
    caption: owner.dataset.lbCaption || "",
  };
}

export function initLightbox(root = document) {
  // one delegated handler covers triggers added later too
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-lightbox]");
    if (!trigger) return;
    e.preventDefault();

    const groupSel = trigger.dataset.lightbox;
    const triggers = groupSel ? $$(groupSel) : $$("[data-lightbox]");
    const items = triggers.map(lightboxItem).filter(Boolean);

    const index = Math.max(0, triggers.indexOf(trigger));
    openLightbox(items, index);
  });

  // keyboard: arrows + escape, at the document level while open
  document.addEventListener("keydown", (e) => {
    if (!lightboxEl || !lightboxEl.classList.contains("is-open")) return;
    if (e.key === "ArrowLeft") step(-1);
    if (e.key === "ArrowRight") step(1);
  });

  // swipe on touch
  document.addEventListener("touchstart", (e) => {
    if (!lightboxEl || !lightboxEl.classList.contains("is-open")) return;
    lightboxState._x0 = e.changedTouches[0].clientX;
  }, { passive: true });

  document.addEventListener("touchend", (e) => {
    if (!lightboxEl || lightboxState._x0 == null) return;
    const dx = e.changedTouches[0].clientX - lightboxState._x0;
    if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
    lightboxState._x0 = null;
  }, { passive: true });
}

/* ==========================================================================
   Quote slider (testimonials)
   ========================================================================== */

export function initQuoteSlider(root = document) {
  for (const wrap of $$("[data-quotes]", root)) {
    const track = $(".quote-track", wrap);
    const dotsWrap = $(".dots", wrap);
    if (!track) continue;

    const slides = $$(".quote", track);
    if (!slides.length) continue;

    const dots = slides.map((_, i) => {
      const dot = el("button", {
        class: "dots__dot",
        type: "button",
        role: "tab",
        "aria-selected": i === 0 ? "true" : "false",
        "aria-label": `Review ${i + 1} of ${slides.length}`,
      });
      dot.addEventListener("click", () => goTo(i));
      if (dotsWrap) dotsWrap.append(dot);
      return dot;
    });

    const goTo = (i) => {
      const n = slides.length;
      const wrapped = (i + n) % n;
      track.scrollTo({ left: slides[wrapped].offsetLeft - track.offsetLeft, behavior: prefersReducedMotion() ? "auto" : "smooth" });
      dots.forEach((d, j) => d.setAttribute("aria-selected", String(j === wrapped)));
    };

    let current = 0;
    let timer = 0;

    const startAuto = () => {
      if (prefersReducedMotion()) return;
      timer = setInterval(() => {
        current = (current + 1) % slides.length;
        goTo(current);
      }, 7000);
    };
    const stopAuto = () => clearInterval(timer);

    for (const [sel, dir] of [["[data-quote-prev]", -1], ["[data-quote-next]", 1]]) {
      $(sel, wrap)?.addEventListener("click", () => {
        stopAuto();
        current = clamp(current + dir, 0, slides.length - 1);
        goTo(current);
        startAuto();
      });
    }

    track.addEventListener("scroll", debounce(() => {
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      slides.forEach((s, i) => {
        const centre = s.offsetLeft - track.offsetLeft + s.offsetWidth / 2;
        const d = Math.abs(centre - mid);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      current = best;
      dots.forEach((d, j) => d.setAttribute("aria-selected", String(j === best)));
    }, 90), { passive: true });

    wrap.addEventListener("pointerenter", stopAuto, { passive: true });
    wrap.addEventListener("pointerleave", startAuto, { passive: true });

    // visible?
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        for (const e of entries) e.isIntersecting ? startAuto() : stopAuto();
      }, { threshold: 0.25 });
      io.observe(wrap);
    } else {
      startAuto();
    }

    if (prefersReducedMotion() && dotsWrap) dotsWrap.hidden = true;
  }
}

/* ==========================================================================
   misc: mark the current page in any nav list, animate hero on load
   ========================================================================== */

export function initMisc(root = document) {
  // hero copy rises in on load (a first impression, not a scroll reveal)
  if (!prefersReducedMotion()) {
    for (const node of $$("[data-hero-anim]")) {
      const delay = Number(node.dataset.heroAnim) || 0;
      node.style.transition = "opacity 900ms var(--ease-out), transform 900ms var(--ease-out)";
      node.style.transitionDelay = `${delay}ms`;
      requestAnimationFrame(() => {
        node.style.opacity = "1";
        node.style.transform = "none";
      });
    }
  }
}
