/* ==========================================================================
   Ultra Hotel Group — Gallery
   ========================================================================== */

import { $, el, debounce, refresh } from "../core.js";
import { galleryTile } from "../cards.js";
import { GALLERY, GALLERY_CATS } from "/shared/catalog.mjs";

const state = { q: "", cat: "all", sort: "curated" };

/* --- category chips ------------------------------------------------------ */

function renderChips() {
  const fs = $("[data-gl-cats]");
  if (!fs) return;

  const counts = new Map();
  for (const g of GALLERY) counts.set(g.cat, (counts.get(g.cat) || 0) + 1);

  fs.insertAdjacentHTML(
    "beforeend",
    GALLERY_CATS.map((c) => {
      const n = c.id === "all" ? GALLERY.length : counts.get(c.id) || 0;
      // A category with nothing in it is not a useful control.
      if (n === 0) return "";
      return `<label class="chip">
                <input type="radio" name="gl-cat" value="${c.id}"${c.id === "all" ? " checked" : ""} data-gl-cat>
                <span>${c.name} <em>${n}</em></span>
              </label>`;
    }).join(""),
  );

  fs.addEventListener("change", (e) => {
    const input = e.target.closest("[data-gl-cat]");
    if (!input) return;
    state.cat = input.value;
    render();
  });
}

/* --- filtering ----------------------------------------------------------- */

function filtered() {
  const q = state.q.trim().toLowerCase();

  const list = GALLERY.filter((g) => {
    if (state.cat !== "all" && g.cat !== state.cat) return false;
    if (!q) return true;
    return g.title.toLowerCase().includes(q) || g.cat.toLowerCase().includes(q);
  });

  if (state.sort === "az") return [...list].sort((a, b) => a.title.localeCompare(b.title));
  return list;
}

function render() {
  const host = $("[data-gallery-grid]");
  const count = $("[data-gl-count]");
  const empty = $("[data-gl-empty]");
  if (!host) return;

  const list = filtered();

  if (count) {
    const label =
      GALLERY_CATS.find((c) => c.id === state.cat)?.name || "Everything";
    count.textContent = `${list.length} ${list.length === 1 ? "image" : "images"} · ${label}`;
  }
  if (empty) empty.hidden = list.length > 0;

  host.replaceChildren(...list.map((g, i) => galleryTile(g, { eager: i < 4 })));

  // the grid is rebuilt on every keystroke, so the new tiles need revealing
  refresh(host);
}

function wire() {
  const q = $("[data-gl-q]");
  if (q) {
    q.addEventListener(
      "input",
      debounce(() => {
        state.q = q.value;
        render();
      }, 140),
    );
  }

  $("[data-gl-sort]")?.addEventListener("change", (e) => {
    state.sort = e.target.value;
    render();
  });

  $("[data-gl-reset]")?.addEventListener("click", () => {
    state.q = "";
    state.cat = "all";
    state.sort = "curated";
    const qi = $("[data-gl-q]");
    if (qi) qi.value = "";
    const all = $('[data-gl-cat][value="all"]');
    if (all) all.checked = true;
    const ss = $("[data-gl-sort]");
    if (ss) ss.value = "curated";
    render();
  });

  // Enter inside the search box submitted the panel and reloaded the page.
  $("[data-gallery-search]")?.addEventListener("submit", (e) => {
    e.preventDefault();
    const qi = $("[data-gl-q]");
    state.q = qi ? qi.value : "";
    render();
  });
}

export function init() {
  renderChips();
  wire();
  render();
}
