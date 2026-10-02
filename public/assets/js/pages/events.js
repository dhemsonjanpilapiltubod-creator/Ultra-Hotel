/* ==========================================================================
   Ultra Hotel Group — Meetings & Events
   ========================================================================== */

import { $, el } from "../core.js";
import { media } from "../cards.js";
import { MEETING_FACTS, MEETING_TYPES, WEDDING_VENUES, REGIONS } from "/shared/catalog.mjs";
import { todayISO, addDays, TERMS } from "/shared/booking.mjs";

/* --- the four headline numbers ------------------------------------------- */

function renderFacts() {
  const host = $("[data-events-facts]");
  if (!host) return;
  host.replaceChildren(
    ...MEETING_FACTS.map((f) => {
      const div = el("div", { class: "stat reveal" });
      div.innerHTML = `
        <span class="stat__value" data-count-to="${f.value}" data-count-suffix="${f.suffix}">0</span>
        <span class="stat__label">${f.label}</span>`;
      return div;
    }),
  );
}

/* --- the four kinds of event --------------------------------------------- */

function renderTypes() {
  const host = $("[data-events-types]");
  if (!host) return;
  host.replaceChildren(
    ...MEETING_TYPES.map((t, i) => {
      const card = el("article", { class: "tile tile--static reveal" });
      card.id = `event-type-${i}`;
      card.innerHTML = `
        <span class="media-slot"></span>
        <span class="tile__veil" aria-hidden="true"></span>
        <div class="tile__body">
          <h3 class="tile__title">${t.title}</h3>
          <p class="tile__text">${t.text}</p>
          <a class="tile__link" href="#rfp">Request a proposal</a>
        </div>`;
      $(".media-slot", card).append(
        media(t.img, {
          ar: "3x4",
          alt: t.title,
          eager: i < 2,
          w: 700,
          sizes: "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw",
        }),
      );
      return card;
    }),
  );
}

/* --- the venue rail ------------------------------------------------------ */

function renderVenues() {
  const host = $("[data-events-venues]");
  if (!host) return;

  host.replaceChildren(
    ...WEDDING_VENUES.map((v) => {
      const card = document.createElement("article");
      card.className = "card reveal";
      card.innerHTML = `
        <span class="media-slot"></span>
        <div class="card__body">
          <h3 class="card__title">${v.name}</h3>
          <p class="card__meta"><span>${v.property}</span></p>
          <p class="card__text">${v.capacity}</p>
          <div class="card__foot">
            <a class="btn btn--outline btn--sm" href="#rfp">Enquire</a>
          </div>
        </div>`;
      const slot = $(".media-slot", card);
      slot.append(
        media(v.img, { ar: "4x3", alt: `${v.name} at ${v.property}`, w: 800 }),
      );
      return card;
    }),
  );
}

/* --- the form's selects -------------------------------------------------- */

function renderFormOptions() {
  const region = $("[data-ev-regions]");
  if (region) {
    region.innerHTML = [
      '<option value="">No preference</option>',
      ...REGIONS.map((r) => `<option value="${r.id}">${r.name}</option>`),
    ].join("");
  }

  const type = $("[data-ev-types]");
  if (type) {
    type.innerHTML = [
      '<option value="">Select</option>',
      ...MEETING_TYPES.map((t) => `<option>${t.title}</option>`),
      "<option>Something else</option>",
    ].join("");
  }

  const guests = $("[data-ev-guests]");
  if (guests) {
    // Capped at the largest space the catalogue actually holds — 620 seated.
    // The old ladder ran to 1,000, a headcount no venue in the group can seat.
    const steps = [18, 25, 50, 100, 200, 300, 450, 620];
    guests.innerHTML = [
      '<option value="">Select</option>',
      ...steps.map((n) => `<option value="${n}">${n}${n === 620 ? "" : "+"}</option>`),
    ].join("");
  }

  const start = $("[data-ev-start]");
  const end = $("[data-ev-end]");
  for (const input of [start, end]) {
    if (!input) continue;
    input.min = todayISO();
    input.max = TERMS.windowEnd;
  }
  if (start && end) {
    end.value = addDays(todayISO(), 3);

    // The start-change handler below already pulled the end date forward, but
    // nothing stopped the guest dragging the end date back behind the start.
    // The server only sanity-checks the headcount, so a reversed range was
    // being recorded as a real brief. Keep them in order from both ends.
    start.addEventListener("change", () => {
      end.min = addDays(start.value, 1);
      if (end.value < end.min) end.value = end.min;
      flagRange();
    });

    end.addEventListener("change", () => {
      end.min = addDays(start.value, 1);
      flagRange();
    });

    function flagRange() {
      const bad = end.value !== "" && end.value < start.value;
      const slot = end.closest(".field")?.querySelector(".field__error");
      if (slot) slot.textContent = bad ? "The end date cannot be before the start date." : "";
      end.setAttribute("aria-invalid", bad ? "true" : "false");
    }
  }
}

export function init() {
  renderFacts();
  renderTypes();
  renderVenues();
  renderFormOptions();
}
