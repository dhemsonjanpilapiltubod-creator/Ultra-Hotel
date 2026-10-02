/* ==========================================================================
   Ultra Hotel Group — Hotels & Resorts

   propertyCard() links to hotels.html?property=<slug>, so the page has to
   honour that parameter: scroll the card into view and mark it as selected.
   ========================================================================== */

import { $, el, debounce, readParams, refresh } from "../core.js";
import { propertyCard, media } from "../cards.js";
import { PROPERTIES, REGIONS, BRANDS, GROUP } from "/shared/catalog.mjs";
import { brandBySlug } from "/shared/catalog.mjs";

const state = { q: "", region: "", brand: "", sort: "recommended", tags: new Set() };

/* --- the region cards ---------------------------------------------------- */

function renderRegions() {
  const host = $("[data-hotels-regions]");
  if (!host) return;

  host.replaceChildren(
    ...REGIONS.map((r) => {
      const count = PROPERTIES.filter((p) => p.region === r.id).length;
      const a = document.createElement("a");
      a.className = "region-card reveal";
      a.href = "#destinations";
      a.dataset.regionLink = r.id;
      a.innerHTML = `
        <span data-region-media></span>
        <span class="region-card__body">
          <b>${r.name}</b>
          <small>${count} in the sample catalogue · ${r.note}</small>
        </span>`;
      $("[data-region-media]", a).append(
        media(r.img, { ar: "16x9", alt: r.name, w: 700, q: 72 }),
      );
      // Clicking a region should filter the list, not just scroll to it.
      a.addEventListener("click", (e) => {
        e.preventDefault();
        state.region = r.id;
        const sel = $("[data-hs-region]");
        if (sel) sel.value = r.id;
        render();
        $("[data-hotels-results]")?.scrollIntoView({ block: "start", behavior: "smooth" });
      });
      return a;
    }),
  );
}

/* --- filter controls ----------------------------------------------------- */

function renderControls() {
  const region = $("[data-hs-region]");
  if (region) {
    region.innerHTML = [
      '<option value="">All regions</option>',
      ...REGIONS.map((r) => `<option value="${r.id}">${r.name}</option>`),
    ].join("");
  }

  const brand = $("[data-hs-brand]");
  if (brand) {
    brand.innerHTML = [
      '<option value="">All brands</option>',
      // Built from BRANDS, not PROPERTY_FILTERS. That list also carries the
      // amenity tags, so every tag option compared a tag id against p.brand and
      // matched nothing — the filter returned zero properties for half its
      // own options.
      ...BRANDS.map((b) => `<option value="${b.slug}">${b.name}</option>`),
    ].join("");
  }

  // Tag chips: every tag in the catalogue, deduplicated, most-used first.
  const fs = $("[data-hs-tags]");
  if (fs) {
    const counts = new Map();
    for (const p of PROPERTIES) for (const t of p.tags) counts.set(t, (counts.get(t) || 0) + 1);
    const tags = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    fs.insertAdjacentHTML(
      "beforeend",
      tags
        .map(
          ([t, n]) =>
            `<label class="chip"><input type="checkbox" value="${t}" data-hs-tag><span>${t.replace(/-/g, " ")} <em>${n}</em></span></label>`,
        )
        .join(""),
    );
    fs.addEventListener("change", (e) => {
      const input = e.target.closest("[data-hs-tag]");
      if (!input) return;
      if (input.checked) state.tags.add(input.value);
      else state.tags.delete(input.value);
      render();
    });
  }
}

/* --- filtering ----------------------------------------------------------- */

function filtered() {
  const q = state.q.trim().toLowerCase();

  const list = PROPERTIES.filter((p) => {
    if (state.region && p.region !== state.region) return false;
    if (state.brand && p.brand !== state.brand) return false;
    for (const t of state.tags) if (!p.tags.includes(t)) return false;
    if (!q) return true;
    const hay = [p.name, p.city, p.country, p.blurb, brandBySlug(p.brand)?.name]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });

  switch (state.sort) {
    case "price-asc":
      return list.sort((a, b) => a.fromCents - b.fromCents);
    case "price-desc":
      return list.sort((a, b) => b.fromCents - a.fromCents);
    case "rooms":
      return list.sort((a, b) => b.rooms - a.rooms);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      // Recommended puts the highlighted properties first, then by price.
      return list.sort(
        (a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)) || a.fromCents - b.fromCents,
      );
  }
}

function render() {
  const host = $("[data-hotels-results]");
  const count = $("[data-hs-count]");
  const empty = $("[data-hs-empty]");
  if (!host) return;

  const list = filtered();

  if (count) {
    count.textContent = `Showing ${list.length} of ${GROUP.properties} properties · ${GROUP.destinations} destinations`;
  }
  if (empty) empty.hidden = list.length > 0;

  host.replaceChildren(...list.map(propertyCard));

  // the cards were built a moment ago, so they still need the boot-time passes
  refresh(host);
}

function wire() {
  const q = $("[data-hs-q]");
  if (q) {
    q.addEventListener(
      "input",
      debounce(() => {
        state.q = q.value;
        render();
      }, 140),
    );
  }

  $("[data-hs-region]")?.addEventListener("change", (e) => {
    state.region = e.target.value;
    render();
  });
  $("[data-hs-brand]")?.addEventListener("change", (e) => {
    state.brand = e.target.value;
    render();
  });
  $("[data-hs-sort]")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  $("[data-hs-reset]")?.addEventListener("click", () => {
    state.q = "";
    state.region = "";
    state.brand = "";
    state.sort = "recommended";
    state.tags.clear();
    const qi = $("[data-hs-q]");
    if (qi) qi.value = "";
    const rs = $("[data-hs-region]");
    if (rs) rs.value = "";
    const bs = $("[data-hs-brand]");
    if (bs) bs.value = "";
    const ss = $("[data-hs-sort]");
    if (ss) ss.value = "recommended";
    for (const box of document.querySelectorAll("[data-hs-tag]")) box.checked = false;
    render();
  });

  // The panel is a <form> with no submit button, so Enter in the search box
  // reloaded the page and threw the query away. Filter on submit instead.
  $("[data-hotels-search]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const qi = $("[data-hs-q]");
    state.q = qi ? qi.value : "";
    render();
  });
}

/* --- ?property=<slug> deep link from the property cards ------------------ */

function focusProperty(slug) {
  const card = document.getElementById(slug);
  if (!card) return;
  card.classList.add("is-targeted");
  requestAnimationFrame(() =>
    card.scrollIntoView({ block: "center", behavior: "smooth" }),
  );
}

export function init() {
  renderRegions();
  renderControls();
  wire();

  /* Deep links. Every page in the site that points at this one builds its URL
     from these three parameters, so honour all of them:
       hotels.html?property=<slug>   from a property card — scroll to it
       hotels.html?region=<id>        from a region card
       hotels.html?brand=<slug>       from a brand story
       hotels.html?q=<term>           from the nav search and the 404 page */
  const params = readParams();
  const wantRegion = params.get("region") || "";
  const wantBrand = params.get("brand") || "";
  const wantQ = params.get("q") || "";

  if (wantRegion && REGIONS.some((r) => r.id === wantRegion)) state.region = wantRegion;
  if (wantBrand && BRANDS.some((b) => b.slug === wantBrand)) state.brand = wantBrand;
  if (wantQ) state.q = wantQ;

  // a deep link is a request for one thing, so drop any filter that would hide it
  const slug = params.get("property");
  if (slug) {
    const p = PROPERTIES.find((x) => x.slug === slug);
    if (p) {
      state.q = "";
      state.region = "";
      state.brand = "";
      state.tags.clear();
    }
  }

  // push the deep-linked values back into the controls so the form agrees
  // with the result list
  const rs = $("[data-hs-region]");
  if (rs) rs.value = state.region;
  const bs = $("[data-hs-brand]");
  if (bs) bs.value = state.brand;
  const qi = $("[data-hs-q]");
  if (qi && wantQ) qi.value = wantQ;

  render();

  if (slug) focusProperty(slug);
}
