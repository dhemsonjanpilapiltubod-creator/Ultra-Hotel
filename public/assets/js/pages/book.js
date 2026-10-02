/* ==========================================================================
   Ultra Hotel Group — Find & Book

   The page that has to be right. It takes the query the hero widget built
   (book.html?property=…&checkIn=…&checkOut=…&rooms=…), narrows the
   catalogue, prices every result with the same shared quote() the server
   uses, and lets the traveller pick a room and reserve it.

   Nothing here re-implements pricing. If a number appears on screen it came
   out of /shared/booking.mjs.
   ========================================================================== */

import { $, $$, el, readParams, clamp, hydrateSubtree } from "../core.js";
import { propertyCard, roomCard, media, benefitTile } from "../cards.js";
import { renderQuote } from "../booking.js";
import {
  quote,
  money,
  todayISO,
  addDays,
  nightsBetween,
  TERMS,
  PROMOS,
  roomBySlug,
} from "/shared/booking.mjs";
import {
  PROPERTIES,
  REGIONS,
  BRANDS,
  ROOM_TYPES,
  LOYALTY_BENEFITS,
  propertyBySlug,
  regionOf,
  brandName,
} from "/shared/catalog.mjs";

/* --------------------------------------------------------------------------
   Search criteria — one object, read from the URL and then owned by the form
   -------------------------------------------------------------------------- */

const state = {
  property: "",
  checkIn: todayISO(),
  checkOut: addDays(todayISO(), 2),
  rooms: 1,
  adults: 1,
  children: 0,
  corporate: false,
  region: "",
  brand: "",
  tag: "",
  sort: "recommended",
  roomSlug: "",
};

function readState() {
  const p = readParams();
  const get = (k) => p.get(k) || "";

  state.property = get("property");
  state.region = get("region");
  state.brand = get("brand");

  if (get("checkIn") && isDay(get("checkIn"))) state.checkIn = get("checkIn");
  if (get("checkOut") && isDay(get("checkOut"))) state.checkOut = get("checkOut");

  if (get("rooms")) state.rooms = clamp(Number(get("rooms")) || 1, 1, TERMS.maxRooms);
  if (get("adults")) state.adults = clamp(Number(get("adults")) || 1, 1, 12);
  if (get("children")) state.children = clamp(Number(get("children")) || 0, 0, 6);
  if (get("rate") === "corporate") state.corporate = true;

  if (state.checkOut <= state.checkIn) state.checkOut = addDays(state.checkIn, 2);
}

function isDay(v) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= todayISO() && v <= TERMS.windowEnd;
}

function nights() {
  return Math.max(0, nightsBetween(state.checkIn, state.checkOut));
}

/* --------------------------------------------------------------------------
   Filtering
   -------------------------------------------------------------------------- */

function matches(property) {
  if (state.property && property.slug !== state.property) return false;
  if (state.region && property.region !== state.region) return false;
  if (state.brand && property.brand !== state.brand) return false;
  if (state.tag && !property.tags.includes(state.tag)) return false;
  return true;
}

function results() {
  const list = PROPERTIES.filter(matches);

  switch (state.sort) {
    case "price-asc":
      return list.sort((a, b) => a.fromCents - b.fromCents);
    case "price-desc":
      return list.sort((a, b) => b.fromCents - a.fromCents);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      // recommended: highlighted properties first, then price
      return list.sort(
        (a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)) || a.fromCents - b.fromCents,
      );
  }
}

/* --------------------------------------------------------------------------
   Filters
   -------------------------------------------------------------------------- */

const TAG_FILTERS = ["beach", "spa", "family", "business", "romance"];

function chip(text, active, onClick) {
  const li = el("li");
  const btn = el("button", {
    class: "chip-btn",
    type: "button",
    "aria-pressed": active ? "true" : "false",
    text,
    onclick: onClick,
  });
  li.append(btn);
  return li;
}

function buildFilters() {
  const regionHost = $("[data-sp-regions]");
  const brandHost = $("[data-sp-brands]");
  const tagHost = $("[data-sp-tags]");

  if (regionHost) {
    regionHost.replaceChildren(
      chip("All", !state.region, () => {
        state.region = "";
        state.property = "";
        render();
      }),
      ...REGIONS.map((r) =>
        chip(r.name, state.region === r.id, () => {
          state.region = state.region === r.id ? "" : r.id;
          state.property = "";
          render();
        }),
      ),
    );
  }

  if (brandHost) {
    brandHost.replaceChildren(
      chip("All", !state.brand, () => {
        state.brand = "";
        state.property = "";
        render();
      }),
      ...BRANDS.map((b) =>
        chip(b.name, state.brand === b.slug, () => {
          state.brand = state.brand === b.slug ? "" : b.slug;
          state.property = "";
          render();
        }),
      ),
    );
  }

  if (tagHost) {
    tagHost.replaceChildren(
      ...TAG_FILTERS.map((t) =>
        chip(t[0].toUpperCase() + t.slice(1), state.tag === t, () => {
          state.tag = state.tag === t ? "" : t;
          render();
        }),
      ),
    );
  }
}

/* --------------------------------------------------------------------------
   The results list
   -------------------------------------------------------------------------- */

function renderResults() {
  const host = $("[data-sp-results]");
  const empty = $("[data-sp-empty]");
  const count = $("[data-sp-count]");
  if (!host) return;

  const list = results();

  if (count) {
    const n = nights();
    const where = state.property
      ? propertyBySlug(state.property)?.name || "your choice"
      : state.region
        ? regionOf(state.region)?.name || "your region"
        : "all destinations";
    count.textContent = list.length
      ? `${list.length} ${list.length === 1 ? "property" : "properties"} in ${where} · ${n} ${n === 1 ? "night" : "nights"}`
      : `Nothing in ${where} matches those filters`;
  }

  if (empty) empty.hidden = list.length > 0;

  host.replaceChildren(
    ...list.map((p) => {
      const card = propertyCard(p);
      // the card links to hotels.html; inside search it should pick a room here
      for (const a of $$("a", card)) {
        a.href = "#quote";
        a.addEventListener("click", (e) => {
          e.preventDefault();
          selectProperty(p.slug);
        });
      }
      return hydrateSubtree(card);
    }),
  );
}

/* --------------------------------------------------------------------------
   Rooms + live quote
   -------------------------------------------------------------------------- */

function roomsFor(property) {
  // How many people actually have to fit in one room. With more rooms than
  // guests, the emptier rooms should be offered; with more guests than rooms,
  // each room has to take its share.
  const perRoom = Math.max(1, Math.ceil((state.adults + state.children) / state.rooms));
  return [...ROOM_TYPES]
    .filter((r) => r.maxGuests >= perRoom)
    .sort((a, b) => b.maxGuests - a.maxGuests || a.fromCents - b.fromCents);
}

function priceRoom(property, room) {
  const q = quote({
    propertySlug: property.slug,
    roomSlug: room.slug,
    checkIn: state.checkIn,
    checkOut: state.checkOut,
    adults: state.adults,
    children: state.children,
    rooms: state.rooms,
    promo: state.corporate ? "BUSINESS18" : undefined,
  });
  return q.ok ? q : null;
}

function renderRooms() {
  const section = $("[data-sp-quote-section]");
  if (!section) return;

  const property = state.property ? propertyBySlug(state.property) : null;
  if (!property) {
    section.hidden = true;
    return;
  }

  section.hidden = false;

  const title = $("[data-sp-quote-title]");
  const sub = $("[data-sp-quote-sub]");
  if (title) title.textContent = property.name;
  if (sub) {
    const n = nights();
    sub.textContent = `${property.city}, ${property.country} · ${n} ${n === 1 ? "night" : "nights"} · ${state.rooms} ${state.rooms === 1 ? "room" : "rooms"}`;
  }

  const host = $("[data-sp-rooms-list]");
  const priced = roomsFor(property)
    .map((room) => ({ room, q: priceRoom(property, room) }))
    .filter((x) => x.q);

  if (!priced.length) {
    if (host) {
      host.replaceChildren(
        el("p", { class: "muted", text: "No room of this type fits that party size. Try fewer guests or fewer rooms." }),
      );
    }
    return;
  }

  if (host) {
    host.replaceChildren(
      ...priced.map(({ room, q }) => {
        const card = roomCard(room);
        card.classList.add("card--selectable");
        if (state.roomSlug === room.slug) card.classList.add("is-selected");

        const price = money(q.grandTotalCents, { withCode: false });
        const foot = el("p", { class: "card__foot-line" });
        foot.innerHTML = `<b>${price}</b> total for ${q.nights} ${q.nights === 1 ? "night" : "nights"}`;

        const btn = el("button", {
          class: `btn btn--block ${state.roomSlug === room.slug ? "btn--gold" : "btn--outline"}`,
          type: "button",
          text: state.roomSlug === room.slug ? "Selected" : "Select this room",
          "aria-pressed": state.roomSlug === room.slug ? "true" : "false",
          onclick: () => {
            state.roomSlug = room.slug;
            renderRooms();
            drawQuote(property, q);
          },
        });

        card.append(foot, btn);
        return hydrateSubtree(card);
      }),
    );
  }

  const chosen = priced.find((x) => x.room.slug === state.roomSlug) || priced[0];
  state.roomSlug = chosen.room.slug;
  drawQuote(property, chosen.q);
}

function drawQuote(property, q) {
  const host = $("[data-sp-quote]");
  if (!host || !q) return;

  renderQuote(host, {
    propertySlug: property.slug,
    roomSlug: q.room.slug,
    checkIn: state.checkIn,
    checkOut: state.checkOut,
    adults: state.adults,
    children: state.children,
    rooms: state.rooms,
    promo: state.corporate ? "BUSINESS18" : undefined,
  });

  // keep the hidden booking form in step with what is on screen
  const set = (sel, v) => {
    const n = $(sel);
    if (n) n.value = v;
  };
  set("[data-qp-property]", property.slug);
  set("[data-qp-room]", q.room.slug);
  set("[data-qp-in]", state.checkIn);
  set("[data-qp-out]", state.checkOut);
  set("[data-qp-adults]", state.adults);
  set("[data-qp-children]", state.children);
  set("[data-qp-rooms]", state.rooms);
  // the server re-prices from the catalogue, so it has to see the same promo
  set("[data-qp-promo]", state.corporate ? "BUSINESS18" : "");

  const submit = $("[data-qp-submit]");
  if (submit) {
    submit.disabled = false;
    submit.textContent = `Reserve for ${money(q.depositCents)} deposit`;
  }
}

function selectProperty(slug) {
  state.property = state.property === slug ? "" : slug;
  state.roomSlug = "";
  render();
  if (state.property) {
    $("[data-sp-quote-section]")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

/* --------------------------------------------------------------------------
   The form
   -------------------------------------------------------------------------- */

function numOptions(max, noun, from = 1) {
  const out = [];
  for (let n = from; n <= max; n += 1) {
    out.push(`<option value="${n}">${n} ${noun}${n === 1 ? "" : "s"}</option>`);
  }
  return out.join("");
}

function buildForm() {
  const dest = $("[data-sp-dest]");
  if (dest) {
    const byRegion = new Map(REGIONS.map((r) => [r.id, []]));
    for (const p of [...PROPERTIES].sort((a, b) => a.name.localeCompare(b.name))) {
      byRegion.get(p.region)?.push(p);
    }
    dest.innerHTML = [
      '<option value="">Any hotel or resort</option>',
      ...REGIONS.map((r) => {
        const list = byRegion.get(r.id) || [];
        if (!list.length) return "";
        return `<optgroup label="${r.name}">${list
          .map((p) => `<option value="${p.slug}">${p.name} — ${p.city}, ${p.country}</option>`)
          .join("")}</optgroup>`;
      }),
    ].join("");
  }

  const rooms = $("[data-sp-rooms]");
  if (rooms) rooms.innerHTML = numOptions(TERMS.maxRooms, "room");
  const adults = $("[data-sp-adults]");
  if (adults) adults.innerHTML = numOptions(12, "adult");
  const children = $("[data-sp-children]");
  if (children) children.innerHTML = `<option value="0">0 children</option>${numOptions(6, "child")}`;

  // date bounds
  for (const sel of ["[data-sp-in]", "[data-sp-out]"]) {
    const input = $(sel);
    if (!input) continue;
    input.min = todayISO();
    input.max = TERMS.windowEnd;
  }
}

function fillForm() {
  const set = (sel, v) => {
    const n = $(sel);
    if (n) n.value = v;
  };
  set("[data-sp-dest]", state.property);
  set("[data-sp-in]", state.checkIn);
  set("[data-sp-out]", state.checkOut);
  set("[data-sp-rooms]", String(state.rooms));
  set("[data-sp-adults]", String(state.adults));
  set("[data-sp-children]", String(state.children));
  const corp = $("[data-sp-corporate]");
  if (corp) corp.checked = state.corporate;
  const sort = $("[data-sp-sort]");
  if (sort) sort.value = state.sort;
}

function wireForm() {
  const form = $("[data-book-form]");
  if (!form) return;

  const alert = $("[data-sp-alert]");

  const sayError = (message) => {
    if (!alert) return;
    if (!message) {
      alert.hidden = true;
      return;
    }
    alert.hidden = false;
    alert.textContent = message;
  };

  // keep the pair coherent as the traveller types
  $("[data-sp-in]")?.addEventListener("change", () => {
    state.checkIn = $("[data-sp-in]").value || state.checkIn;
    if (state.checkOut <= state.checkIn) {
      state.checkOut = addDays(state.checkIn, 1);
      $("[data-sp-out]").value = state.checkOut;
    }
    state.roomSlug = "";
    render();
  });

  $("[data-sp-out]")?.addEventListener("change", () => {
    state.checkOut = $("[data-sp-out]").value || state.checkOut;
    if (state.checkOut <= state.checkIn) {
      sayError("Check-out must be after check-in.");
      $("[data-sp-out]").focus();
      return;
    }
    sayError("");
    state.roomSlug = "";
    render();
  });

  for (const [sel, key] of [
    ["[data-sp-rooms]", "rooms"],
    ["[data-sp-adults]", "adults"],
    ["[data-sp-children]", "children"],
  ]) {
    $(sel)?.addEventListener("change", () => {
      state[key] = Number($(sel).value);
      state.roomSlug = "";
      render();
    });
  }

  $("[data-sp-corporate]")?.addEventListener("change", () => {
    state.corporate = $("[data-sp-corporate]").checked;
    state.roomSlug = "";
    render();
  });

  $("[data-sp-sort]")?.addEventListener("change", () => {
    state.sort = $("[data-sp-sort]").value;
    renderResults();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    state.property = $("[data-sp-dest]")?.value || "";
    if (state.checkOut <= state.checkIn) {
      sayError("Check-out must be after check-in.");
      $("[data-sp-out]").focus();
      return;
    }
    sayError("");
    state.roomSlug = "";
    render();

    // keep the URL shareable, and let the back button work
    const params = new URLSearchParams();
    if (state.property) params.set("property", state.property);
    if (state.region) params.set("region", state.region);
    params.set("checkIn", state.checkIn);
    params.set("checkOut", state.checkOut);
    params.set("rooms", String(state.rooms));
    params.set("adults", String(state.adults));
    if (state.children) params.set("children", String(state.children));
    if (state.corporate) params.set("rate", "corporate");
    window.history.replaceState(null, "", `book.html?${params.toString()}`);
  });

  for (const sel of ["[data-sp-reset]", "[data-sp-reset-2]"]) {
    $(sel)?.addEventListener("click", () => {
      state.region = "";
      state.brand = "";
      state.tag = "";
      state.property = "";
      state.roomSlug = "";
      state.sort = "recommended";
      render();
    });
  }
}

/* --------------------------------------------------------------------------
   Render
   -------------------------------------------------------------------------- */

function render() {
  buildFilters();
  renderResults();
  renderRooms();
}

export function init() {
  readState();
  buildForm();
  fillForm();
  wireForm();
  render();

  const benefits = $("[data-book-benefits]");
  if (benefits) benefits.replaceChildren(...LOYALTY_BENEFITS.map(benefitTile));

  // the guarantee line, single-sourced like everywhere else
  const promiseHost = $("[data-sp-promise]");
  if (promiseHost) promiseHost.textContent = "Book directly for the best rate, guaranteed";
}

