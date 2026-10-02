/* ==========================================================================
   Ultra Hotel — navigation
   Sticky bar · hover + keyboard mega-menus · full-screen mobile drawer.

   The nav markup is built here from a single MENU structure so that every page
   shares one definition and one behaviour. Every page still ships its full
   link list in the footer, so there is a crawlable path to each page with
   scripting off.
   ========================================================================== */

import { $, $$, clamp, debounce, lockScroll, trapFocus, prefersReducedMotion, currentPath } from "./core.js";
import { REGIONS, TIERS, PROPERTIES, DINING, BRANDS, GROUP, img } from "/shared/catalog.mjs";

/* --------------------------------------------------------------------------
   Language and currency options

   One list, exported, because the header and the footer both render a pair of
   selects. Keeping a second copy in each file is how they drifted apart —
   the footer's Arabic dirham symbol had already stopped matching the header's.
   -------------------------------------------------------------------------- */

export const LANGUAGES = [
  ["en-GB", "EN"], ["fr-FR", "FR"], ["de-DE", "DE"], ["es-ES", "ES"],
  ["it-IT", "IT"], ["ja-JP", "JA"], ["ko-KR", "KO"], ["zh-CN", "中文"],
];

export const CURRENCIES = [
  ["PHP", "PHP ₱"], ["USD", "USD $"], ["EUR", "EUR €"], ["GBP", "GBP £"],
  ["SGD", "SGD S$"], ["AED", "AED د.إ"], ["JPY", "JPY ¥"],
];

/* --------------------------------------------------------------------------
   Menu definition

   The same set of destinations on every page, in the same order, so the header
   never reshuffles as you move around the site.

   `label` is the full name and is what the drawer, the mega-panels, the search
   index and the footer use. `short` is the compact label for the desktop bar
   only, where ten destinations plus the brand, the search and the booking
   button genuinely do not fit across a laptop screen. Where `short` is absent
   the bar falls back to `label`.

   Panels pull their feature images straight from the catalogue so a photo is
   only ever named once.
   -------------------------------------------------------------------------- */

const byBrand = (slug) => PROPERTIES.find((p) => p.brand === slug) || PROPERTIES[0];

export const MENU = [
  { label: "Find & Book", short: "Book", href: "book.html" },
  {
    label: "Our Brands",
    short: "Brands",
    href: "brands.html",
    panel: {
      cols: 2,
      groups: [
        {
          label: "The Collection",
          items: [
            { label: "All four brands", href: "brands.html" },
            // BRANDS[].rooms is the property count for that brand. The old
            // copy here described them four different ways — city hotels,
            // destinations, design hotels, smart stays — none of which matched
            // what the number actually counted.
            ...BRANDS.map((b) => ({ label: b.name, href: `brands.html#${b.slug}`, note: `${b.rooms} properties` })),
          ],
        },
        {
          label: "By Region",
          items: REGIONS.map((r) => ({
            label: r.name,
            href: `hotels.html?region=${r.id}`,
            // r.note is the property count, e.g. "42 properties". Stripping the
            // noun left a bare number floating under the region name.
            note: r.note,
          })),
        },
      ],
      feature: {
        img: byBrand("aether-by-ultra").img,
        title: "Aether by Ultra",
        note: "Design-led, independently operated",
        href: "brands.html#aether-by-ultra",
        ar: "4x3",
      },
    },
  },
  {
    label: "Ultra Circle",
    short: "Circle",
    href: "ultra-circle.html",
    panel: {
      cols: 2,
      groups: [
        {
          label: "Ultra Circle",
          items: [
            { label: "Overview", href: "ultra-circle.html" },
            { label: "Join free", href: "ultra-circle.html#join" },
            { label: "Member benefits", href: "ultra-circle.html#benefits" },
            { label: "Tier status match", href: "ultra-circle.html#match" },
            { label: "Redeem points", href: "ultra-circle.html#redeem" },
          ],
        },
        {
          label: "The Tiers",
          items: TIERS.map((t) => ({
            label: t.name,
            href: `ultra-circle.html#${t.slug}`,
            note: t.threshold,
          })),
        },
      ],
      feature: {
        img: TIERS[2].img,
        title: "Platinum",
        note: "A free night every year, on us",
        href: "ultra-circle.html#platinum",
        ar: "4x3",
      },
    },
  },
  { label: "Restaurants & Bars", short: "Dining", href: "dining.html" },
  { label: "Business Travel", short: "Business", href: "business.html" },
  { label: "Meetings & Events", short: "Meetings", href: "events.html" },
  { label: "Weddings & Celebrations", short: "Weddings", href: "weddings.html" },
  { label: "Gallery", short: "Gallery", href: "gallery.html" },
  {
    label: "About Ultra",
    short: "About",
    href: "about.html",
    panel: {
      cols: 2,
      groups: [
        {
          label: "The Group",
          items: [
            { label: "Our story", href: "about.html" },
            { label: "Leadership", href: "about.html#leadership" },
            { label: "Sustainability", href: "about.html#sustainability" },
            { label: "Careers", href: "about.html#careers" },
            { label: "Press & media", href: "about.html#press" },
          ],
        },
        {
          label: "Guest Services",
          items: [
            { label: "Contact us", href: "about.html#contact" },
            { label: "Manage a booking", href: "about.html#manage" },
            { label: "Accessibility", href: "about.html#access" },
            { label: "Frequently asked", href: "about.html#faq" },
            { label: "Ultra Circle App", href: "app.html" },
          ],
        },
      ],
      feature: {
        img: "photo-1520250497591-112f2f40a3f4",
        title: "Kuro, Aether Bangkok",
        note: "Nine courses, eighteen seats",
        href: "dining.html",
        ar: "4x3",
      },
    },
  },
];

const CHEVRON =
  '<svg class="nav__chev" viewBox="0 0 12 8" aria-hidden="true" focusable="false"><path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

const url = (id, w, ar) => img(id, { w, q: 72, ar: ar ? ar.replace("x", ":") : "" });

/* --------------------------------------------------------------------------
   Markup
   -------------------------------------------------------------------------- */

function logoMarkup(variant) {
  return `<span class="logo logo--${variant}">
      <span class="logo__mark">ULTRA</span>
      <span class="logo__sub">Hotel</span>
    </span>`;
}

function panelMarkup(item, index) {
  const p = item.panel;
  if (!p) return "";

  const listId = `nav-list-${index}`;
  const panelId = `nav-panel-${index}`;

  const groups = p.groups
    .map(
      (g) => `<div class="panel__group">
        <p class="panel__label" id="${listId}">${g.label}</p>
        <ul class="panel__list" aria-labelledby="${listId}">
          ${g.items
            .map(
              (it) => `<li><a href="${it.href}">${it.label}${
                it.note ? `<small>${it.note}</small>` : ""
              }</a></li>`,
            )
            .join("")}
        </ul>
      </div>`,
    )
    .join("");

  const aside = p.feature
    ? `<div class="panel__aside">
        <p class="panel__label">Featured</p>
        <div class="panel__carousel">
          ${[p.feature]
            .map(
              (f) => `<a class="panel__feature" href="${f.href}">
              <span class="media media--${f.ar}">
                <img src="${url(f.img, 480, f.ar.replace("x", ":"))}" alt="" loading="lazy" decoding="async">
              </span>
              <figcaption>${f.title}<small>${f.note}</small></figcaption>
            </a>`,
            )
            .join("")}
        </div>
        <p style="margin-top:var(--sp-4)"><a class="link" href="gallery.html">See the gallery
          <svg class="link__arrow" viewBox="0 0 16 12" aria-hidden="true"><path d="M1 6h13M9 1.5 14 6l-5 4.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>
        </a></p>
      </div>`
    : "";

  return `<div class="panel" id="${panelId}" data-panel="${index}" aria-labelledby="nav-panel-${index}-link" hidden>
      <div class="shell shell--wide">
        <div class="panel__inner" style="--panel-cols:${p.cols}">
          ${groups}
          ${aside}
        </div>
      </div>
    </div>`;
}

function drawerSubMarkup(item, subId) {
  if (!item.panel) return "";
  return `<div class="drawer__sub"${subId ? ` id="${subId}"` : ""}><div><div class="drawer__sub-inner">
      ${item.panel.groups
        .map(
          (g) => `<p class="drawer__sub-label">${g.label}</p>
          <ul>${g.items.map((it) => `<li><a href="${it.href}">${it.label}</a></li>`).join("")}</ul>`,
        )
        .join("")}
    </div></div></div>`;
}

function buildNav() {
  const path = currentPath();

  const items = MENU.map((item, i) => {
    const current = item.href === path;
    if (!item.panel) {
      return `<li class="nav__item">
          <a class="nav__link${current ? " is-current" : ""}" href="${item.href}"${current ? ' aria-current="page"' : ""}
            title="${item.label}">${item.short || item.label}</a>
        </li>`;
    }
    /* Split control (WAI-ARIA disclosure navigation): the label is a real link
       to the section's own page, and the chevron beside it is a separate button
       that opens the panel. Rendering this as one <button> made the section
       impossible to reach by click or keyboard - the click was swallowed by
       preventDefault() and only ever toggled the dropdown.

       The bar shows `short` because ten full-length labels do not fit beside
       the brand, the search and the booking button on a laptop screen. The
       accessible name stays the full label, and the drawer below shows it in
       full too, so nothing is lost. */
    const isOpen = current;
    return `<li class="nav__item" data-nav-item>
          <span class="nav__split">
            <a class="nav__link${current ? " is-current" : ""}" id="nav-panel-${i}-link"
              href="${item.href}"${current ? ' aria-current="page"' : ""}
              title="${item.label}">${item.short || item.label}</a>
            <button class="nav__disclosure" type="button" id="nav-panel-${i}-trigger"
              aria-expanded="${isOpen}" aria-controls="nav-panel-${i}" data-nav-trigger="${i}"
              aria-label="Show the ${item.label} menu">${CHEVRON}</button>
          </span>
        </li>`;
  }).join("");

  const panels = MENU.map((item, i) => panelMarkup(item, i)).join("");

  return `
    <a class="skip-link" href="#main">Skip to content</a>

    <header class="nav" id="site-nav">
      <div class="shell shell--wide nav__shell">
        <div class="nav__bar">
          <a class="nav__brand" href="index.html" aria-label="Ultra Hotel — home">${logoMarkup("light")}</a>

          <nav class="nav__menu" aria-label="Primary">
            <ul class="nav__menu-list" style="display:contents">
              ${items}
            </ul>
          </nav>

          <div class="nav__actions">
            <div class="nav__utils">
              <label class="nav__util">
                <span class="sr-only">Language</span>
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2.6 10h14.8M10 2.6c4 4.6 4 10.2 0 14.8-4-4.6-4-10.2 0-14.8Z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>
                <select data-langsel aria-label="Language">
${LANGUAGES.map(([value, label]) => `                  <option value="${value}">${label}</option>`).join("\n")}
                </select>
              </label>

              <label class="nav__util">
                <span class="sr-only">Currency</span>
                <select data-cursel aria-label="Currency">
${CURRENCIES.map(([value, label]) => `                  <option value="${value}">${label}</option>`).join("\n")}
                </select>
              </label>

              <a class="nav__signin" href="ultra-circle.html#join">Sign In <span aria-hidden="true">/</span> Join</a>

              <button class="nav__search" type="button" data-search-open aria-label="Search Ultra Hotel" aria-expanded="false" aria-controls="site-search">
                <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="8.8" cy="8.8" r="5.6" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="m13 13 4.4 4.4" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
              </button>
            </div>

            <a class="btn btn--gold btn--sm btn--pulse" data-magnetic href="book.html">Book Now</a>
            <button class="nav__toggle" type="button" aria-expanded="false" aria-controls="mobile-drawer" aria-label="Open menu" data-drawer-open>
              <span class="nav__toggle-bars"></span>
            </button>
          </div>
        </div>
      </div>

      <div class="searchpanel" id="site-search" data-search-panel hidden>
        <div class="shell shell--wide">
          <form class="searchpanel__form" data-search-form role="search">
            <label class="sr-only" for="site-search-input">Search hotels, resorts, cities and restaurants</label>
            <input class="searchpanel__input" id="site-search-input" type="search" name="q"
                   placeholder="Try “Santorini”, “Aether Bangkok” or “business rate”"
                   autocomplete="off" spellcheck="false" data-search-input>
            <button class="btn btn--gold" type="submit">Search</button>
            <button class="searchpanel__close" type="button" data-search-close aria-label="Close search">
              <svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
            </button>
          </form>
          <ul class="searchpanel__hints" data-search-hints aria-label="Suggested searches"></ul>
        </div>
      </div>

      <div class="panels" id="panels" data-panels>${panels}</div>
    </header>

    <div class="drawer" id="mobile-drawer" data-drawer role="dialog" aria-modal="true" aria-label="Menu" hidden>
      <div class="drawer__head">
        <a href="index.html" aria-label="Ultra Hotel — home">${logoMarkup("dark")}</a>
        <button class="drawer__close" type="button" data-drawer-close>
          Close
          <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden="true"><path d="M2 2l12 12M14 2L2 14" stroke="currentColor" stroke-width="1.5" fill="none"/></svg>
        </button>
      </div>

      <div class="drawer__body">
        <ul class="drawer__list">
          ${MENU.map((item, i) => {
            if (!item.panel) {
              return `<li class="drawer__row"><a class="drawer__row-link" href="${item.href}">${item.label}</a></li>`;
            }
            /* same split control as the desktop bar: the row is a link to the
               section page, the chevron only opens the accordion */
            return `<li class="drawer__row" data-drawer-row>
              <span class="drawer__split">
                <a class="drawer__row-link" href="${item.href}">${item.label}</a>
                <button class="drawer__row-btn drawer__row-btn--disclosure" type="button"
                  aria-expanded="false" aria-controls="drawer-sub-${i}" data-drawer-toggle
                  aria-label="Show the ${item.label} section">${CHEVRON}</button>
              </span>
              ${drawerSubMarkup(item, `drawer-sub-${i}`)}
            </li>`;
          }).join("")}
        </ul>
      </div>

      <div class="drawer__foot">
        <a class="btn btn--gold btn--block" data-magnetic href="book.html">Book Now</a>
        <a class="btn btn--outline btn--block" href="about.html#contact">Contact Us</a>
        <a class="btn btn--ghost btn--block" href="ultra-circle.html#join">Sign In / Join</a>
        <div class="drawer__utils">
          <label class="nav__util">
            <span class="sr-only">Language</span>
            <svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><circle cx="10" cy="10" r="7.4" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M2.6 10h14.8M10 2.6c4 4.6 4 10.2 0 14.8-4-4.6-4-10.2 0-14.8Z" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>
            <select data-langsel aria-label="Language">
              <option value="en-GB">English (UK)</option>
              <option value="fr-FR">Français</option>
              <option value="de-DE">Deutsch</option>
              <option value="es-ES">Español</option>
              <option value="it-IT">Italiano</option>
              <option value="ja-JP">日本語</option>
              <option value="ko-KR">한국어</option>
              <option value="zh-CN">中文</option>
            </select>
          </label>
          <label class="nav__util">
            <span class="sr-only">Currency</span>
            <select data-cursel aria-label="Currency">
              <option value="PHP">PHP ₱</option>
              <option value="USD">USD $</option>
              <option value="EUR">EUR €</option>
              <option value="GBP">GBP £</option>
              <option value="SGD">SGD S$</option>
              <option value="AED">AED د.إ</option>
              <option value="JPY">JPY ¥</option>
            </select>
          </label>
        </div>
        <p class="muted" style="text-align:center;font-size:var(--step--2)">
          <a href="tel:${GROUP.phoneHref}">${GROUP.phone}</a>
        </p>
      </div>
    </div>`;
}

/* --------------------------------------------------------------------------
   Behaviour
   -------------------------------------------------------------------------- */

const CLOSE_DELAY = 180;

/* Below this the brand, the nine destinations, the search and the booking
   button cannot share one line, so the drawer takes over. Must stay in step
   with the 1180px media queries in components.css. */const NAV_DESKTOP_MIN = 1181;

export function initNav() {
  const mount = $("[data-nav-mount]");
  if (!mount) return;

  mount.innerHTML = buildNav();

  const nav = $("#site-nav");
  const drawer = $("[data-drawer]", mount);
  const panelsWrap = $("[data-panels]", mount);

  initSolidOnScroll(nav);
  initMegaMenus(nav, panelsWrap);
  initDrawer(drawer, mount);
  initSearch();
  initUtilities();
}

/* --- language + currency ------------------------------------------------ */
/* Both persist in localStorage. The currency value is exposed on <html> so
   a prices module can read it without reaching into the nav. */

const STORE = { lang: "ultra.lang", currency: "ultra.currency" };

function readStore(key, fallback) {
  try {
    return localStorage.getItem(key) || fallback;
  } catch {
    return fallback;
  }
}

function writeStore(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private browsing — the choice simply will not persist */
  }
}

function initUtilities() {
  const all = {
    lang: $$("[data-langsel]"),
    currency: $$("[data-cursel]"),
  };

  const applyLang = (value) => {
    document.documentElement.lang = value.split("-")[0];
    for (const sel of all.lang) sel.value = value;
    writeStore(STORE.lang, value);
  };

  const applyCurrency = (value) => {
    document.documentElement.dataset.currency = value;
    for (const sel of all.currency) sel.value = value;
    writeStore(STORE.currency, value);
  };

  // restore first, so the controls never flash the wrong value
  const savedLang = readStore(STORE.lang, "");
  const savedCur = readStore(STORE.currency, "");
  applyLang(savedLang || all.lang[0]?.value || "en-GB");
  applyCurrency(savedCur || all.currency[0]?.value || "PHP");

  // one delegated listener covers the header copy and the drawer copy alike
  document.addEventListener("change", (e) => {
    const sel = e.target;
    if (!(sel instanceof HTMLSelectElement)) return;
    if (sel.matches("[data-langsel]")) applyLang(sel.value);
    if (sel.matches("[data-cursel]")) applyCurrency(sel.value);
  });
}

/* --- search ------------------------------------------------------------- */
/* A small predictive search over the catalogue. It goes to Find & Book for a
   property, or to the relevant section page for everything else. */

const SEARCH_INDEX = [
  ...PROPERTIES.map((p) => ({
    label: p.name,
    note: `${p.city}, ${p.country}`,
    href: `book.html?property=${p.slug}`,
    terms: `${p.name} ${p.city} ${p.country} ${p.tags.join(" ")}`.toLowerCase(),
  })),
  ...BRANDS.map((b) => ({
    label: b.name,
    note: b.kicker,
    href: `brands.html#${b.slug}`,
    terms: `${b.name} ${b.kicker} ${b.tagline}`.toLowerCase(),
  })),
  ...REGIONS.map((r) => ({
    label: r.name,
    note: r.note,
    href: `hotels.html?region=${r.id}`,
    terms: `${r.name} region`.toLowerCase(),
  })),
  ...DINING.map((d) => ({
    label: d.name,
    note: `${d.cuisine} · ${d.property}`,
    href: `dining.html#${d.slug}`,
    terms: `${d.name} ${d.cuisine} ${d.property} ${d.city}`.toLowerCase(),
  })),
  { label: "Business travel rates", note: "Up to 18% off flexible rates", href: "business.html", terms: "business corporate company rate work trip invoicing" },
  { label: "Meetings & events", note: `${GROUP.meetingSpaces} meeting rooms`, href: "events.html", terms: "meeting event conference ballroom banquet boardroom" },
  { label: "Weddings & celebrations", note: "From PHP 8,000", href: "weddings.html", terms: "wedding celebration reception marriage" },
  { label: "Ultra Circle", note: "Join free, four tiers", href: "ultra-circle.html", terms: "loyalty points tier silver gold platinum black member" },
];

const DEFAULT_HINTS = ["Santorini", "Aether Bangkok", "Mactan Island", "Napa Valley", "Business travel"];

function initSearch() {
  const panel = $("[data-search-panel]");
  const openBtn = $("[data-search-open]");
  const closeBtn = $("[data-search-close]");
  const form = $("[data-search-form]");
  const input = $("[data-search-input]");
  const hints = $("[data-search-hints]");

  if (!panel || !openBtn) return;

  const renderHints = (results) => {
    if (!hints) return;
    const list = results.length
      ? results
      : DEFAULT_HINTS.map((h) => ({ label: h, note: "", href: `hotels.html?q=${encodeURIComponent(h)}`, terms: h.toLowerCase() }));

    hints.replaceChildren(
      ...list.slice(0, 6).map((r) => {
        const li = document.createElement("li");
        const a = document.createElement("a");
        a.href = r.href;
        a.innerHTML = `<b>${r.label}</b>${r.note ? `<span>${r.note}</span>` : ""}`;
        li.append(a);
        return li;
      }),
    );
  };

  function open() {
    panel.hidden = false;
    openBtn.setAttribute("aria-expanded", "true");
    renderHints([]);
    // next frame, so the transition runs
    requestAnimationFrame(() => {
      panel.classList.add("is-open");
      input?.focus();
    });
  }

  function close() {
    panel.classList.remove("is-open");
    openBtn.setAttribute("aria-expanded", "false");
    if (prefersReducedMotion()) panel.hidden = true;
    else {
      panel.addEventListener(
        "transitionend",
        () => {
          panel.hidden = true;
        },
        { once: true },
      );
      setTimeout(() => {
        if (!panel.classList.contains("is-open")) panel.hidden = true;
      }, 500);
    }
  }

  openBtn.addEventListener("click", () => {
    if (panel.classList.contains("is-open")) close();
    else open();
  });

  closeBtn?.addEventListener("click", close);

  panel.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      close();
      openBtn.focus();
    }
  });

  const search = debounce(() => {
    const q = input.value.trim().toLowerCase();
    if (q.length < 2) {
      renderHints([]);
      return;
    }
    renderHints(
      SEARCH_INDEX.filter((r) => r.terms.includes(q)).sort((a, b) => a.label.localeCompare(b.label)),
    );
  }, 120);

  input?.addEventListener("input", search);

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    // Hotels owns ?q= and filters by it. book.html only ever reads ?property=,
    // so a free-text search sent there landed on the booking form with the
    // term silently dropped.
    window.location.href = `hotels.html?q=${encodeURIComponent(q)}#destinations`;
  });

  // Cmd/Ctrl-K and "/" open search, the way every other site does it
  document.addEventListener("keydown", (e) => {
    const typingInField = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName);
    if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typingInField)) {
      e.preventDefault();
      if (panel.classList.contains("is-open")) close();
      else open();
    }
  });
}

/* --- solid state after scrolling --------------------------------------- */

/**
 * Pages whose first screen is a light surface (every inner page opens on the
 * ivory .pagehead) cannot use the transparent-over-hero treatment, so the nav
 * is solid from the outset and stays solid. `body[data-nav="solid"]` opts in.
 * The matching class on <body> lets sticky elements below the bar track the
 * nav height, which changes between the tall and compact states.
 */
function initSolidOnScroll(nav) {
  if (!nav) return;

  const alwaysSolid = document.body.dataset.nav === "solid";

  const setSolid = () => {
    if (alwaysSolid) {
      nav.classList.add("is-solid");
      document.body.classList.add("is-nav-solid");
      return;
    }
    const threshold = Math.min(window.innerHeight * 0.72, 520);
    const solid = window.scrollY > threshold;
    nav.classList.toggle("is-solid", solid);
    document.body.classList.toggle("is-nav-solid", solid);
  };

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      setSolid();
    });
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  setSolid();
}

/* --- mega menus --------------------------------------------------------- */

/**
 * Listeners live on elements that actually have hit-boxes: each nav <li>,
 * each panel, and the bar itself. A shared close delay means crossing the
 * gap between trigger and panel does not flicker the menu shut.
 */
function initMegaMenus(nav, panelsWrap) {
  if (!nav || !panelsWrap) return;

  const items = $$("[data-nav-item]", nav);
  const panels = $$(".panel", panelsWrap);
  const triggers = $$("[data-nav-trigger]", nav);
  const desktop = () => window.matchMedia(`(min-width: ${NAV_DESKTOP_MIN}px)`).matches;

  let openIndex = -1;
  let closeTimer = 0;
  let lastTrigger = null;

  const panelFor = (i) => panels.find((p) => p.dataset.panel === String(i));

  function open(i, { focusPanel = false } = {}) {
    clearTimeout(closeTimer);
    if (openIndex === i) return;

    close(now = true);

    const panel = panelFor(i);
    const trigger = triggers.find((t) => t.dataset.navTrigger === String(i));
    if (!panel || !trigger) return;

    panel.hidden = false;
    panel.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    trigger.closest("[data-nav-item]")?.classList.add("is-active");
    nav.classList.add("is-open");
    openIndex = i;
    lastTrigger = trigger;

    if (focusPanel) {
      const firstLink = panel.querySelector("a");
      if (firstLink) firstLink.focus();
    }
  }

  function close(immediate = false) {
    const run = () => {
      for (const p of panels) {
        p.classList.remove("is-open");
        p.hidden = true;
      }
      for (const t of triggers) {
        t.setAttribute("aria-expanded", "false");
        t.closest("[data-nav-item]")?.classList.remove("is-active");
      }
      nav.classList.remove("is-open");
      openIndex = -1;
    };
    clearTimeout(closeTimer);
    if (immediate) run();
    else closeTimer = setTimeout(run, CLOSE_DELAY);
  }

  // hover intent on each item
  for (const item of items) {
    const trigger = item.querySelector("[data-nav-trigger]");
    if (!trigger) continue;
    const index = Number(trigger.dataset.navTrigger);

    item.addEventListener("pointerenter", (e) => {
      if (e.pointerType === "touch" || !desktop()) return;
      open(index);
    });
    item.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "touch" || !desktop()) return;
      if (openIndex === index) close();
    });
  }

  // keep it open while the pointer is over the panel itself
  for (const panel of panels) {
    panel.addEventListener("pointerenter", () => clearTimeout(closeTimer));
    panel.addEventListener("pointerleave", (e) => {
      if (e.pointerType === "touch" || !desktop()) return;
      close();
    });
  }

  // closing the bar when the pointer leaves the whole header
  nav.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "touch" || !desktop()) return;
    close();
  });

  // click / keyboard activation
  for (const trigger of triggers) {
    const index = Number(trigger.dataset.navTrigger);

    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      if (openIndex === index) close(true);
      else open(index);
    });

    trigger.addEventListener("keydown", (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        open(index, { focusPanel: true });
      }
    });
  }

  // Escape closes and returns focus to the trigger
  nav.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && openIndex >= 0) {
      const target = lastTrigger;
      close(true);
      if (target) target.focus();
    }
  });

  // arrow keys walk the top-level destinations. The panel chevrons are reachable
  // by Tab, so arrowing between sections and arrowing between chevrons never
  // fight over the same keys.
  const topLinks = items.map((item) => item.querySelector(".nav__link")).filter(Boolean);
  nav.addEventListener("keydown", (e) => {
    if (!["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const current = topLinks.indexOf(document.activeElement);
    if (current < 0) return;
    e.preventDefault();
    const next = e.key === "ArrowRight" ? current + 1 : current - 1;
    const target = topLinks[next < 0 ? topLinks.length - 1 : next % topLinks.length];
    if (target) target.focus();
  });

  // a click outside the header closes whatever is open
  document.addEventListener("click", (e) => {
    if (openIndex < 0) return;
    if (nav.contains(e.target)) return;
    close(true);
  });

  // leaving the desktop breakpoint must not strand a panel
  window.matchMedia(`(max-width: ${NAV_DESKTOP_MIN - 1}px)`).addEventListener("change", (e) => {
    if (e.matches) close(true);
  });

  return { open, close };
}

/* --- mobile drawer ------------------------------------------------------ */

function initDrawer(drawer, mount) {
  if (!drawer) return;

  const openBtn = $("[data-drawer-open]", mount);
  const closeBtn = $("[data-drawer-close]", drawer);
  let release = null;
  let lastFocus = null;

  function openDrawer() {
    lastFocus = document.activeElement;
    drawer.hidden = false;
    // next frame, so the transform transition actually runs
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    openBtn?.setAttribute("aria-expanded", "true");
    openBtn?.setAttribute("aria-label", "Close menu");
    lockScroll(true);
    release = trapFocus(drawer, { onEscape: closeDrawer });
    closeBtn?.focus();
  }

  function closeDrawer() {
    drawer.classList.remove("is-open");
    openBtn?.setAttribute("aria-expanded", "false");
    openBtn?.setAttribute("aria-label", "Open menu");
    lockScroll(false);
    release?.();
    release = null;
    const done = () => {
      drawer.hidden = true;
      drawer.removeEventListener("transitionend", done);
    };
    if (prefersReducedMotion()) done();
    else {
      drawer.addEventListener("transitionend", done);
      // belt and braces if the transition never fires
      setTimeout(() => {
        if (!drawer.classList.contains("is-open")) done();
      }, 700);
    }
    if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
  }

  openBtn?.addEventListener("click", () => {
    if (drawer.classList.contains("is-open")) closeDrawer();
    else openDrawer();
  });

  closeBtn?.addEventListener("click", closeDrawer);

  // accordion submenus inside the drawer
  for (const row of $$("[data-drawer-row]", drawer)) {
    const btn = $("[data-drawer-toggle]", row);
    if (!btn) continue;
    btn.addEventListener("click", () => {
      const isOpen = row.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", String(isOpen));
    });
  }

  // tapping any link closes the drawer on the way out
  drawer.addEventListener("click", (e) => {
    if (e.target.closest("a")) closeDrawer();
  });
}
