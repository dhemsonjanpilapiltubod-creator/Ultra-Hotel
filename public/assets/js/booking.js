/* ==========================================================================
   Ultra Hotel Group — booking bar

   The widget that sits in the hero and sticks under the nav. It searches
   across all 112 properties, not one.

   The live quote it draws comes from /shared/booking.mjs — the same module
   the server re-prices submissions with, so the figure on screen is the
   figure that gets charged.
   ========================================================================== */

import { $, $$, el, clamp, hydrateSubtree, readParams } from "./core.js";
import { quote, money, todayISO, addDays, TERMS, PROMOS, roomBySlug } from "/shared/booking.mjs";
import { PROPERTIES, REGIONS } from "/shared/catalog.mjs";

/* --------------------------------------------------------------------------
   Options
   -------------------------------------------------------------------------- */

/** Every property, grouped under its region, in a stable alphabetical order. */
function destinationOptions() {
  const byRegion = new Map(REGIONS.map((r) => [r.id, []]));

  for (const p of [...PROPERTIES].sort((a, b) => a.name.localeCompare(b.name))) {
    byRegion.get(p.region)?.push(p);
  }

  const groups = REGIONS.map((region) => {
    const list = byRegion.get(region.id) || [];
    if (!list.length) return "";
    const opts = list
      .map(
        (p) =>
          `<option value="${p.slug}">${p.name} — ${p.city}, ${p.country}</option>`,
      )
      .join("");
    return `<optgroup label="${region.name}">${opts}</optgroup>`;
  }).join("");

  return `<option value="">Any hotel or resort</option>${groups}`;
}

function numOptions(max, noun) {
  const out = [];
  for (let n = 1; n <= max; n += 1) {
    out.push(`<option value="${n}">${n} ${noun}${n === 1 ? "" : "s"}</option>`);
  }
  return out.join("");
}

/** Children default to 0, so the range starts there. */
function childOptions(max) {
  const out = [`<option value="0">0 children</option>`];
  for (let n = 1; n <= max; n += 1) {
    out.push(`<option value="${n}">${n} ${n === 1 ? "child" : "children"}</option>`);
  }
  return out.join("");
}

/* --------------------------------------------------------------------------
   Markup
   -------------------------------------------------------------------------- */

export function bookingBarMarkup({ showMobile = true } = {}) {
  const today = todayISO();
  const max = TERMS.windowEnd;

  return `
  <section class="bookwidget" data-bookingbar aria-label="Find and book a stay">
    <form class="shell shell--wide" data-bb-form novalidate>
      <div class="bookwidget__inner">

        <div class="bookwidget__field bookwidget__field--dest">
          <label class="bookwidget__label" for="bb-dest">Destination &amp; hotel</label>
          <div class="bookwidget__select-wrap">
            <select class="bookwidget__control" id="bb-dest" name="property" data-bb-dest>
              ${destinationOptions()}
            </select>
          </div>
        </div>

        <div class="bookwidget__field">
          <label class="bookwidget__label" for="bb-in">Check in</label>
          <input class="bookwidget__control" id="bb-in" name="checkIn" type="date"
                 value="${today}" min="${today}" max="${max}">
        </div>

        <div class="bookwidget__field">
          <label class="bookwidget__label" for="bb-out">Check out</label>
          <input class="bookwidget__control" id="bb-out" name="checkOut" type="date"
                 value="${addDays(today, 2)}" min="${today}" max="${max}">
        </div>

        <div class="bookwidget__field bookwidget__field--guests">
          <span class="bookwidget__label" id="bb-guests-label">Rooms &amp; guests</span>
          <div class="bookwidget__guests" role="group" aria-labelledby="bb-guests-label">
            <label class="bookwidget__count">
              <span class="bookwidget__control">
                <span class="bookwidget__select-wrap">
                  <select class="bookwidget__control" name="rooms" data-bb-rooms aria-label="Rooms">${numOptions(TERMS.maxRooms, "room")}</select>
                </span>
              </span>
              <span class="bookwidget__count-label">Rooms</span>
            </label>
            <label class="bookwidget__count">
              <span class="bookwidget__control">
                <span class="bookwidget__select-wrap">
                  <select class="bookwidget__control" name="adults" data-bb-adults aria-label="Adults">${numOptions(12, "adult")}</select>
                </span>
              </span>
              <span class="bookwidget__count-label">Adults</span>
            </label>
            <label class="bookwidget__count">
              <span class="bookwidget__control">
                <span class="bookwidget__select-wrap">
                  <select class="bookwidget__control" name="children" data-bb-children aria-label="Children">${childOptions(6)}</select>
                </span>
              </span>
              <span class="bookwidget__count-label">Children</span>
            </label>
          </div>
        </div>

        <div class="bookwidget__field bookwidget__field--rate">
          <span class="bookwidget__label" id="bb-rate-label">Rate type</span>
          <div class="switchrow" role="group" aria-labelledby="bb-rate-label">
            <label class="switch">
              <input type="checkbox" name="corporate" data-bb-corporate>
              <span class="switch__track" aria-hidden="true"><span class="switch__dot"></span></span>
              <span class="switch__text">Corporate &amp; special rate</span>
            </label>
          </div>
        </div>

        <div class="bookwidget__go">
          <button class="btn btn--gold btn--lg btn--block" data-magnetic type="submit" data-bb-search>
            <span data-bb-search-label>Search</span>
          </button>
        </div>

        ${
          showMobile
            ? `<div class="bookwidget__mobile">
                 <span class="bookwidget__mobile-summary" data-bb-summary>Choose your dates</span>
                 <button class="btn btn--gold btn--sm" type="button" data-bb-open>Search</button>
               </div>`
            : ""
        }
      </div>
    </form>
    <div class="shell shell--wide">
      <p class="bookwidget__note" data-bb-note hidden></p>
    </div>
  </section>`;
}

/* --------------------------------------------------------------------------
   Behaviour
   -------------------------------------------------------------------------- */

export function initBookingBar(root = document) {
  /* Scoped to .bookwidget deliberately. The bare [data-bookingbar] selector
     also matches <body data-bookingbar="true">, which is the per-page opt-in
     flag — matching it made the widget look for its own fields inside <body>,
     found nothing, and threw. */
  const bar = $(".bookwidget[data-bookingbar]", root);
  if (!bar) return;

  const form = $("[data-bb-form]", bar);
  const dest = $("[data-bb-dest]", bar);
  const inInput = $("#bb-in", bar);
  const outInput = $("#bb-out", bar);
  const roomsSel = $("[data-bb-rooms]", bar);
  const adultsSel = $("[data-bb-adults]", bar);
  const childrenSel = $("[data-bb-children]", bar);
  const corporate = $("[data-bb-corporate]", bar);
  const note = $("[data-bb-note]", bar);
  const summary = $("[data-bb-summary]", bar);
  const searchLabel = $("[data-bb-search-label]", bar);
  const mobileOpen = $("[data-bb-open]", bar);

  /* -- keep the date pair coherent ------------------------------------- */

  function syncDates(changed) {
    if (!inInput?.value || !outInput?.value) return;
    if (outInput.value <= inInput.value) {
      const next = addDays(inInput.value, 2) || inInput.value;
      if (changed === "in") outInput.value = next;
      else inInput.value = addDays(outInput.value, -2) || inInput.value;
    }
    const ceiling = addDays(TERMS.windowEnd, 1);
    if (outInput.value > ceiling) outInput.value = ceiling;
    if (inInput.value < TERMS.windowStart) inInput.value = TERMS.windowStart;
    render();
  }

  inInput?.addEventListener("change", () => syncDates("in"));
  outInput?.addEventListener("change", () => syncDates("out"));
  for (const sel of [roomsSel, adultsSel, childrenSel, dest, corporate]) {
    sel?.addEventListener("change", render);
  }

  /* -- summary / button label ------------------------------------------ */

  function fmtDay(iso) {
    if (!iso) return "";
    return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    });
  }

  function nightsBetween(a, b) {
    return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
  }

  function render() {
    const inV = inInput?.value;
    const outV = outInput?.value;
    const nights = nightsBetween(inV, outV);
    const rooms = Number(roomsSel?.value || 1);
    const adults = Number(adultsSel?.value || 1);
    const children = Number(childrenSel?.value || 0);
    const where = dest?.selectedOptions[0]?.textContent?.split(" — ")[0] || "Any hotel or resort";

    if (summary) {
      summary.textContent =
        nights > 0
          ? `${where} · ${fmtDay(inV)} – ${fmtDay(outV)} · ${nights}n · ${rooms} ${rooms === 1 ? "room" : "rooms"}, ${adults} ${adults === 1 ? "adult" : "adults"}${children ? `, ${children} children` : ""}`
          : "Choose your dates";
    }

    if (searchLabel) {
      searchLabel.textContent =
        nights > 0 ? `Search ${nights} ${nights === 1 ? "night" : "nights"}` : "Search";
    }
  }

  /* -- mobile sheet ----------------------------------------------------- */

  mobileOpen?.addEventListener("click", () => {
    bar.classList.add("bookwidget--open");
    inInput?.focus();
  });

  /* -- submit ----------------------------------------------------------- */

  function go() {
    const params = new URLSearchParams();
    if (dest?.value) params.set("property", dest.value);
    if (inInput?.value) params.set("checkIn", inInput.value);
    if (outInput?.value) params.set("checkOut", outInput.value);
    if (roomsSel?.value) params.set("rooms", roomsSel.value);
    if (adultsSel?.value) params.set("adults", adultsSel.value);
    if (childrenSel?.value) params.set("children", childrenSel.value);
    if (corporate?.checked) params.set("rate", "corporate");
    window.location.href = `book.html?${params.toString()}`;
  }

  form?.addEventListener("submit", (e) => {
    e.preventDefault();
    go();
  });

  /* -- prefill from the URL (book.html?property=…&checkIn=…) ------------ */

  const p = readParams();
  if (p.get("property") && dest) dest.value = p.get("property");
  if (p.get("checkIn") && inInput) inInput.value = p.get("checkIn");
  if (p.get("checkOut") && outInput) outInput.value = p.get("checkOut");
  if (p.get("rooms") && roomsSel) roomsSel.value = clamp(Number(p.get("rooms")) || 1, 1, TERMS.maxRooms);
  if (p.get("adults") && adultsSel) adultsSel.value = clamp(Number(p.get("adults")) || 1, 1, 12);
  if (p.get("children") && childrenSel) childrenSel.value = clamp(Number(p.get("children")) || 0, 0, 6);
  if (p.get("rate") === "corporate" && corporate) corporate.checked = true;

  if (inInput?.value && outInput?.value && outInput.value <= inInput.value) {
    outInput.value = addDays(inInput.value, 2);
  }

  render();
}

/* ==========================================================================
   Live quote widget
   Used on Find & Book and in the property-detail sticky rail. Draws the same
   night-by-night breakdown the server will produce.
   ========================================================================== */

export function renderQuote(host, { propertySlug, roomSlug, checkIn, checkOut, adults, children, rooms, promo }) {
  if (!host) return;

  const q = quote({ propertySlug, roomSlug, checkIn, checkOut, adults, children, rooms, promo });

  if (!q.ok) {
    const first = Object.values(q.errors)[0] || "Choose a room to see pricing.";
    host.innerHTML = `<p class="muted" style="font-size:var(--step--1)">${first}</p>`;
    return q;
  }

  const nightRows = q.lines
    .filter((l) => l.kind === "night")
    .map((l) => {
      const d = new Date(`${l.date}T00:00:00`);
      const label = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
      return `<div class="sched-row" style="grid-template-columns:7.5rem 1fr auto">
          <span class="sched-row__time">${label}${l.weekend ? ' <span class="chip chip--gold" style="margin-left:.3rem">+15%</span>' : ""}</span>
          <span class="muted" style="font-size:var(--step--1)">${q.rooms > 1 ? `${q.room.name} × ${q.rooms}` : q.room.name}</span>
          <span style="font-variant-numeric:tabular-nums">${money(l.rateCents + l.upliftCents)}</span>
        </div>`;
    })
    .join("");

  const extraRows = q.lines
    .filter((l) => l.kind === "extraAdult" || l.kind === "extraChild" || l.kind === "promo")
    .map(
      (l) => `<div class="sched-row" style="grid-template-columns:1fr auto">
          <span><b style="font-weight:600">${l.label}</b><br><span class="muted" style="font-size:var(--step--2)">${l.detail || ""}</span></span>
          <span style="font-variant-numeric:tabular-nums">${money(l.extraCents)}</span>
        </div>`,
    )
    .join("");

  host.innerHTML = `
    <div class="spec-list" style="border-top:0">
      <div class="spec-row"><dt>Room</dt><dd>${q.room.name}</dd></div>
      <div class="spec-row"><dt>Dates</dt><dd>${q.nights} ${q.nights === 1 ? "night" : "nights"}</dd></div>
      <div class="spec-row"><dt>Guests</dt><dd>${q.guests.adults} adult${q.guests.adults === 1 ? "" : "s"}${q.guests.children ? `, ${q.guests.children} children` : ""}</dd></div>
    </div>
    <div class="schedule" style="margin-top:var(--sp-4)">${nightRows}${extraRows}</div>
    <div class="spec-list" style="margin-top:var(--sp-4)">
      <div class="spec-row"><dt>Room subtotal</dt><dd>${money(q.subtotalCents)}</dd></div>
      <div class="spec-row"><dt>Service &amp; taxes (12%)</dt><dd>${money(q.taxCents)}</dd></div>
    </div>
    <div class="price-box" style="margin-top:var(--sp-4)">
      <p class="price-box__from">Total for ${q.nights} ${q.nights === 1 ? "night" : "nights"}</p>
      <p class="price-box__rate"><b>${money(q.grandTotalCents)}</b><span>${q.currency}</span></p>
      <p class="price-box__note">${money(q.depositCents)} due now, ${money(q.balanceCents)} on arrival. Check-in from 3pm, check-out by 12pm.</p>
    </div>`;

  return q;
}

/* --------------------------------------------------------------------------
   A reusable "rate + reserve" line, used by room and property renderers
   -------------------------------------------------------------------------- */

export function priceLine(fromCents, { note = "per night, before taxes" } = {}) {
  return `<p class="card__price"><span>From</span><b>${money(fromCents, { withCode: false })}</b><span>${note}</span></p>`;
}

export { hydrateSubtree, PROMOS, roomBySlug };
