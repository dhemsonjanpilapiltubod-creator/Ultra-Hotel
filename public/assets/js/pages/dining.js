/* ==========================================================================
   Ultra Hotel Group — Restaurants & Bars

   The home page's dining cards link to dining.html#<venue.slug>, so each
   venue slug has to be a real anchor. The footer links to #rewards.
   ========================================================================== */

import { $, $$, el, debounce, refresh } from "../core.js";
import { diningCard, media } from "../cards.js";
import { DINING, LOYALTY_BENEFITS, GROUP } from "/shared/catalog.mjs";
import { todayISO } from "/shared/booking.mjs";

/* --- the rail ------------------------------------------------------------ */

function buildRail() {
  const track = $("[data-dining-rail]");
  if (!track) return;

  // No id here. The rail and the results list render the same venues, and two
  // elements sharing a slug means getElementById() — which is how the
  // dining.html#<slug> deep link resolves — always lands on the rail copy.
  // The results list below owns the anchors.
  const cards = DINING.map((venue) => diningCard(venue));

  track.replaceChildren(...cards);
}

/* --- the filterable list ------------------------------------------------- */

const state = { q: "", group: "", res: "", sort: "name" };

function filtered() {
  const q = state.q.trim().toLowerCase();
  let list = DINING.filter((v) => {
    if (state.group && v.group !== state.group) return false;
    if (state.res === "yes" && !v.reserve) return false;
    if (state.res === "no" && v.reserve) return false;
    if (!q) return true;
    return [v.name, v.property, v.city, v.cuisine, v.blurb]
      .join(" ")
      .toLowerCase()
      .includes(q);
  });

  switch (state.sort) {
    case "property":
      return list.sort((a, b) => a.property.localeCompare(b.property) || a.name.localeCompare(b.name));
    case "seats":
      return list.sort((a, b) => b.seats - a.seats);
    default:
      return list.sort((a, b) => a.name.localeCompare(b.name));
  }
}

function buildTypeFilter() {
  const sel = $("[data-ds-group]");
  if (!sel) return;
  const groups = [...new Set(DINING.map((v) => v.group))].sort();
  sel.innerHTML = [
    '<option value="">All types</option>',
    ...groups.map((g) => `<option value="${g}">${g[0].toUpperCase() + g.slice(1)}</option>`),
  ].join("");
}

function renderResults() {
  const host = $("[data-dining-results]");
  const count = $("[data-ds-count]");
  if (!host) return;

  const list = filtered();

  if (count) {
    count.textContent = list.length
      ? `Showing ${list.length} of ${GROUP.restaurants} restaurants and bars`
      : `Nothing matches “${state.q}” in the group catalogue`;
  }

  host.replaceChildren(
    ...list.map((venue) => {
      const card = diningCard(venue, { dark: false });
      // deep-linkable: dining.html#the-salt-cellar
      card.id = venue.slug;
      card.scrollMarginTop = "calc(var(--nav-h) + var(--sp-5))";
      return card;
    }),
  );

  // rebuilt on every keystroke, so the new cards need the boot-time passes
  refresh(host);
}

function wireSearch() {
  const q = $("[data-ds-q]");
  if (q) {
    q.addEventListener(
      "input",
      debounce(() => {
        state.q = q.value;
        renderResults();
      }, 140),
    );
  }

  $("[data-ds-group]")?.addEventListener("change", (e) => {
    state.group = e.target.value;
    renderResults();
  });
  $("[data-ds-res]")?.addEventListener("change", (e) => {
    state.res = e.target.value;
    renderResults();
  });
  $("[data-ds-sort]")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    renderResults();
  });

  // A <form> with no submit button still submits on Enter, which reloaded the
  // page and discarded the search.
  $("[data-dining-search]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const qi = $("[data-ds-q]");
    state.q = qi ? qi.value : "";
    renderResults();
  });
}

/* --- member benefits ----------------------------------------------------- */

function renderBenefits() {
  const host = $("[data-dining-benefits]");
  if (!host) return;
  // The dining offer is the point of this band, so it leads.
  // Wording follows the catalogue: exactly one venue carries the 25% offer, and
  // it is off the tasting menu for new members — not a group-wide buffet deal.
  const diningFirst = [
    { title: "25% off, at participating restaurants", text: "Dining rewards are set by each restaurant and shown on its card — from 25% off the tasting menu for new members to two-for-one cocktails at the bar.", icon: "tag" },
    ...LOYALTY_BENEFITS.filter((b) => b.title !== "Member exclusive rates"),
  ];
  host.replaceChildren(...diningFirst.map((b) => {
    const div = document.createElement("div");
    div.className = "benefit reveal";
    div.innerHTML = `<b>${b.title}</b><span>${b.text}</span>`;
    return div;
  }));
}

/* --- the table-request form ----------------------------------------------- */

/* Only venues that actually take bookings. The card CTA is also the only way
   the site reaches this endpoint, so the two stay in sync. */
const SERVICE = DINING.filter((v) => v.reserve);

function renderReserveForm() {
  const sel = $("[data-dr-venues]");
  if (sel) {
    sel.replaceChildren(
      el("option", { value: "", text: "Choose a restaurant" }),
      ...SERVICE.map((v) =>
        el("option", { value: v.slug, text: `${v.name} — ${v.property}` }),
      ),
    );
  }

  const date = $("[data-dr-date]");
  if (date) {
    date.min = todayISO();
    date.value = todayISO();
  }

  const time = $("[data-dr-times]");
  if (time) {
    const slots = ["12:00", "12:30", "13:00", "13:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
    time.replaceChildren(
      el("option", { value: "", text: "No preference" }),
      ...slots.map((t) => el("option", { value: t, text: t })),
    );
  }
}

/* The "Reserve a table" buttons on every card were rendered with no handler at
   all. They now pick the venue, drop the guest in on the name field, and take
   them to the form — the one place the request can actually be sent. */
function wireReserveButtons() {
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-reserve]");
    if (!btn) return;
    const venue = SERVICE.find((v) => v.slug === btn.dataset.reserve);
    if (!venue) return;

    const sel = $("[data-dr-venues]");
    if (sel) sel.value = venue.slug;

    const form = $("[data-form=reservation]");
    if (!form) return;
    form.scrollIntoView({ block: "center", behavior: reducedMotion() ? "auto" : "smooth" });
    $("[data-dr-name]")?.focus({ preventScroll: true });
  });
}

function reducedMotion() {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

export function init() {
  buildRail();
  buildTypeFilter();
  renderResults();
  wireSearch();
  renderBenefits();
  renderReserveForm();
  wireReserveButtons();

  const hash = window.location.hash.slice(1);
  if (!hash) return;
  const target = document.getElementById(hash);
  if (target) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
}
