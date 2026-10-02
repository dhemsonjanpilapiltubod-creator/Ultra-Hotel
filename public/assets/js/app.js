/* ==========================================================================
   Ultra Hotel — app entry
   Boots the shared chrome once, then loads the module for whichever page is
   asking for it. Adding a page means adding a file here — nothing else.
   ========================================================================== */

import { boot, $, refresh } from "./core.js";
import { initNav } from "./nav.js";
import { renderFooter, initChat } from "./chrome.js";
import { initRails, syncRails, initTabs, initAccordions, initFilters, initLightbox, initQuoteSlider, initMisc } from "./ui.js";
import { initForms, initNewsletter } from "./forms.js";
import { initMotion, refreshMotion } from "./motion.js";

/* --- 1. document-level boot ------------------------------------------- */

boot();

/* --- 2. shared chrome -------------------------------------------------- */

/* The footer mirrors the header's saved language and currency, so it has to be
   rendered before the nav — otherwise initNav() caches a value nothing has
   written yet and the two pairs of selects start out disagreeing. */
renderFooter();
initNav();
initChat();

/* --- 2b. aliveness -----------------------------------------------------
   The motion layer runs after the chrome so the nav and footer exist and the
   scrollspy has something to mark. It is additive: if it throws, the page
   behind it is already complete and interactive. */

try {
  initMotion();
} catch (err) {
  console.error("[ultra] motion layer failed", err);
}

/* --- 3. shared interactions -------------------------------------------- */

initLightbox();
initTabs();
initAccordions();
initFilters();
initRails();
initQuoteSlider();
initForms();
initNewsletter();
initMisc();

/* --- 4. page module ---------------------------------------------------- */

/* One entry per page. Adding a page means adding a file here and a key that
   matches its <body data-page>. The import is dynamic so a page's own weight
   never lands on a page that does not need it. */

const PAGES = {
  home: () => import("./pages/home.js"),
  book: () => import("./pages/book.js"),
  hotels: () => import("./pages/hotels.js"),
  brands: () => import("./pages/brands.js"),
  "ultra-circle": () => import("./pages/ultra-circle.js"),
  dining: () => import("./pages/dining.js"),
  business: () => import("./pages/business.js"),
  events: () => import("./pages/events.js"),
  weddings: () => import("./pages/weddings.js"),
  about: () => import("./pages/about.js"),
  app: () => import("./pages/app.js"),
  gallery: () => import("./pages/gallery.js"),
};

const page = document.body.dataset.page || "home";

const entry = PAGES[page];

// A failed page module must not take the chrome down with it. A page with no
// entry at all (404) gets the shared chrome and nothing else — falling back to
// home.js there ran a module against markup the page does not have.
if (entry) {
  Promise.resolve()
    .then(entry)
    .then((mod) => {
      mod?.init?.();
      // anything the page module injected still needs observing
      refresh(document.body);
      // and the rails it filled need re-measuring — their arrows sized an
      // empty track at boot and disabled themselves
      syncRails(document.body);
      // and still wants the per-card motion
      refreshMotion();
    })
    .catch((err) => {
      console.error(`[ultra] page module "${page}" failed`, err);
    });
}

/* --- 5. booking bar --------------------------------------------------- */
/* The widget is opt-in per page: the home page and Find & Book carry it, a
   brand story does not. It is rendered after the page module so that a page
   which mounts its own copy is left alone. */

if (document.body.dataset.bookingbar === "true") {
  import("./booking.js").then(({ bookingBarMarkup, initBookingBar: init }) => {
    /* Ask about the widget itself, not [data-bookingbar] — that attribute is
       also the page-level flag on <body>, so the bare selector always matched
       and the widget was never written into its mount. */
    let mount = $("[data-bookingbar-mount]");
    if (!mount) {
      /* A page that opts in but declares no mount gets one, placed right after
         the nav. .bookwidget is already sticky under --nav-h, so it needs no
         page-specific styling. Without this the flag was set on five pages and
         the widget appeared on none of them. */
      mount = document.createElement("div");
      mount.dataset.bookingbarMount = "";
      const navMount = $("[data-nav-mount]");
      if (navMount) navMount.after(mount);
      else document.body.prepend(mount);
    }
    if (!$(".bookwidget")) mount.innerHTML = bookingBarMarkup();
    init();
  });
}
