/* ==========================================================================
   Ultra Hotel Group — Weddings & Celebrations
   ========================================================================== */

import { $, el } from "../core.js";
import { media } from "../cards.js";
import { WEDDING_PACKAGES, WEDDING_VENUES, REGIONS, GROUP } from "/shared/catalog.mjs";
import { todayISO, addDays, TERMS } from "/shared/booking.mjs";

/* --- the three packages -------------------------------------------------- */

function renderPackages() {
  const host = $("[data-wed-packages]");
  if (!host) return;

  host.replaceChildren(
    ...WEDDING_PACKAGES.map((pkg, i) => {
      const card = document.createElement("article");
      card.className = `tier-card reveal${i === 1 ? " tier-card--accent" : ""}`;
      card.id = `package-${pkg.name.toLowerCase()}`;
      card.scrollMarginTop = "calc(var(--nav-h) + var(--sp-5))";
      card.innerHTML = `
        <div class="tier-card__media" data-pkg-media></div>
        <div class="tier-card__body">
          <p class="eyebrow">${pkg.guests} guests</p>
          <h3 class="tier-card__name">${pkg.name}</h3>
          <p class="tier-card__earn">From ${pkg.from}</p>
          <ul class="ticks">
            ${pkg.points.map((p) => `<li>${p}</li>`).join("")}
          </ul>
          <p style="margin-top:var(--sp-5)">
            <a class="btn btn--outline btn--sm" href="#enquire">Enquire about ${pkg.name}</a>
          </p>
        </div>`;

      const slot = $("[data-pkg-media]", card);
      slot.append(
        media(pkg.img, {
          ar: "3x2",
          alt: `${pkg.name} wedding package`,
          eager: i < 2,
          w: 900,
          sizes: "(max-width: 900px) 100vw, 33vw",
        }),
      );
      return card;
    }),
  );
}

/* --- the venues ---------------------------------------------------------- */

function renderVenues() {
  const host = $("[data-wed-venues]");
  if (!host) return;

  host.replaceChildren(
    ...WEDDING_VENUES.map((v, i) => {
      const card = el("article", { class: "tile tile--static reveal" });
      card.id = `venue-${i}`;
      card.innerHTML = `
        <span class="media-slot"></span>
        <span class="tile__veil" aria-hidden="true"></span>
        <div class="tile__body">
          <h3 class="tile__title">${v.name}</h3>
          <p class="tile__text">${v.property} — ${v.capacity}</p>
          <a class="tile__link" href="#enquire">Check this date</a>
        </div>`;
      $(".media-slot", card).append(
        media(v.img, {
          ar: "3x4",
          alt: `${v.name} at ${v.property}`,
          eager: i < 4,
          w: 700,
          sizes: "(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 25vw",
        }),
      );
      return card;
    }),
  );
}

/* --- the form's selects -------------------------------------------------- */

function renderFormOptions() {
  const regions = $("[data-wd-regions]");
  if (regions) {
    regions.innerHTML = [
      '<option value="">No preference</option>',
      ...REGIONS.map((r) => `<option value="${r.id}">${r.name}</option>`),
    ].join("");
  }

  const guests = $("[data-wd-guests]");
  if (guests) {
    const steps = [8, 20, 40, 80, 150, 250, 400, 600];
    guests.innerHTML = [
      '<option value="">Select</option>',
      ...steps.map((n) => `<option value="${n}">Up to ${n}</option>`),
    ].join("");
  }

  const pkg = $("[data-wd-packages]");
  if (pkg) {
    pkg.innerHTML = [
      '<option value="">Not sure yet</option>',
      ...WEDDING_PACKAGES.map(
        (p) => `<option>${p.name} — ${p.guests}, from ${p.from}</option>`,
      ),
    ].join("");
  }

  const start = $("[data-wd-start]");
  if (start) {
    // Weddings are booked well ahead, but not beyond the booking window.
    start.min = todayISO();
    start.max = TERMS.windowEnd;
    // A default of a year out is a more useful starting point than today.
    start.value = addDays(todayISO(), 365);
  }
}

export function init() {
  renderPackages();
  renderVenues();
  renderFormOptions();
}
