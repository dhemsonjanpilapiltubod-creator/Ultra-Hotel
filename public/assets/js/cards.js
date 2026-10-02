/* ==========================================================================
   Ultra Hotel Group — card renderers
   One builder per card type, used by the home page and by the inner pages,
   so a property looks identical in the carousel, the grid and the search
   results. Every builder reads from /shared/catalog.mjs — nothing about a
   property, brand or venue is written twice.
   ========================================================================== */

import { el, $, $$, hydrateSubtree } from "./core.js";
import { img, thumb, brandName, regionOf } from "/shared/catalog.mjs";
import { money } from "/shared/booking.mjs";

/* --------------------------------------------------------------------------
   Media — the blur-up wrapper. Every image on the site goes through here.
   -------------------------------------------------------------------------- */

export function media(id, { ar = "3x2", alt = "", sizes = "", w = 1200, eager = false, q = 78, rootMargin = true } = {}) {
  const wrap = document.createElement("span");
  wrap.className = `media media--${ar}`;
  wrap.innerHTML = `
    <span class="media__ph" data-ph="${thumb(id)}" aria-hidden="true"></span>
    <img${eager ? "" : ' loading="lazy"'} decoding="async" alt="${alt.replace(/"/g, "&quot;")}"
         data-src="${img(id, { w, ar: ar.replace("x", ":"), q })}"${sizes ? ` sizes="${sizes}"` : ""}>`;
  return wrap;
}

const ARROW =
  '<svg class="link__arrow" viewBox="0 0 16 12" aria-hidden="true"><path d="M1 6h13M9 1.5 14 6l-5 4.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

/* --------------------------------------------------------------------------
   Brand card — the four houses, used by Our Brands
   -------------------------------------------------------------------------- */

export function brandCard(brand, { eager = false } = {}) {
  const card = document.createElement("article");
  card.className = "brand-card reveal";
  card.id = brand.slug;
  card.dataset.filterTags = brand.slug;

  card.innerHTML = `
    <a class="brand-card__media" href="brands.html#${brand.slug}"
       aria-label="${brand.name} — learn more">${""}</a>
    <div class="brand-card__body">
      <p class="eyebrow">${brand.kicker} · ${brand.rooms} properties</p>
      <h3 class="brand-card__title"><a href="brands.html#${brand.slug}">${brand.name}</a></h3>
      <p class="brand-card__tagline">${brand.tagline}</p>
      <p class="brand-card__text">${brand.blurb}</p>
      <p class="link link--on-dark brand-card__link">Learn More ${ARROW}</p>
    </div>`;

  const holder = $(".brand-card__media", card);
  holder.append(media(brand.img, { ar: "4x5", alt: `${brand.name} — a room and view typical of the brand`, eager, sizes: "(max-width: 620px) 90vw, (max-width: 1080px) 45vw, 24vw" }));

  return card;
}

/* --------------------------------------------------------------------------
   Property card — a hotel or resort, used by Find & Book and the rails
   -------------------------------------------------------------------------- */

const PIN_ICON =
  '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 18s6-5.3 6-9.4A6 6 0 0 0 4 8.6C4 12.7 10 18 10 18Z" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="10" cy="8.5" r="2.1" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

export function propertyCard(property, { eager = false } = {}) {
  const card = document.createElement("article");
  card.className = "card reveal";
  card.id = property.slug;
  card.dataset.filterTags = `${property.brand} ${property.region} ${property.tags.join(" ")}`;

  const region = regionOf(property.region);

  card.innerHTML = `
    <a class="media-link" href="hotels.html?property=${property.slug}"
       aria-label="${property.name} — view details" style="display:block">${""}</a>
    <div class="card__body">
      <p class="eyebrow" style="font-size:.64rem">${brandName(property.brand)}</p>
      <h3 class="card__title"><a href="hotels.html?property=${property.slug}">${property.name}</a></h3>
      <p class="card__meta">
        <span>${PIN_ICON}${property.city}, ${property.country}</span>
        ${region ? `<span class="card__meta-region">${region.name}</span>` : ""}
      </p>
      <p class="card__text">${property.blurb}</p>
      <div class="card__foot">
        <p class="card__price"><span>From</span><b>${money(property.fromCents, { withCode: false })}</b><span>/ night</span></p>
        <p class="link">View Details ${ARROW}</p>
      </div>
    </div>`;

  const holder = $(".media-link", card);
  holder.append(media(property.img, { ar: "4x3", alt: `${property.name}, ${property.city}`, eager }));

  return card;
}

/* --------------------------------------------------------------------------
   Loyalty benefit tile — the four Ultra Circle benefits
   -------------------------------------------------------------------------- */

const BENEFIT_ICONS = {
  tag: '<path d="M3 10.4V4a1 1 0 0 1 1-1h6.4a1 1 0 0 1 .7.3l6 6a1 1 0 0 1 0 1.4l-6 6a1 1 0 0 1-1.4 0l-6-6a1 1 0 0 1-.3-.7Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/><circle cx="7" cy="7" r="1.4" fill="none" stroke="currentColor" stroke-width="1.4"/>',
  key: '<circle cx="8" cy="8" r="4.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M11.2 11.2 18 18M15 15l2-2M17 17l1.6-1.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  kids: '<circle cx="8" cy="6" r="2.8" fill="none" stroke="currentColor" stroke-width="1.4"/><circle cx="15.5" cy="7.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M2.5 18c0-3 2.5-5.2 5.5-5.2s5.5 2.2 5.5 5.2M12.5 18c0-2.4 1.4-4.2 3.4-4.2S19.3 15.6 19.3 18" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>',
  star: '<path d="m11 2.6 2.5 5.6 6 .6-4.5 4 1.3 5.9L11 15.6l-5.3 3.1L7 12.8l-4.5-4 6-.6Z" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>',
};

export function benefitTile(benefit) {
  const div = document.createElement("div");
  div.className = "benefit reveal";
  div.innerHTML = `
    <span class="benefit__icon" aria-hidden="true">
      <svg viewBox="0 0 22 22" fill="none">${BENEFIT_ICONS[benefit.icon] || BENEFIT_ICONS.star}</svg>
    </span>
    <b>${benefit.title}</b>
    <span>${benefit.text}</span>`;
  return div;
}

/* --------------------------------------------------------------------------
   Room card — a room type, used by Find & Book and property pages
   -------------------------------------------------------------------------- */

const AREA_ICON =
  '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><rect x="3" y="3" width="14" height="14" rx="1" fill="none" stroke="currentColor" stroke-width="1.3"/><path d="M3 12h6V3" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

const VIEW_ICON =
  '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M10 3c3.5 2.4 5.2 5 5.2 7.6A5.2 5.2 0 0 1 10 15.8a5.2 5.2 0 0 1-5.2-5.2C4.8 8 6.5 5.4 10 3Z" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="10" cy="10.4" r="1.8" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

const BED_ICON =
  '<svg viewBox="0 0 20 20" aria-hidden="true" focusable="false"><path d="M2 12V7m0 5h16v3M2 12v2m16-2v2M5 12V9.5h10V12" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="5.8" cy="7.6" r="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="14.2" cy="7.6" r="1.5" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';

export function roomCard(room, { eager = false, baseCents = 0 } = {}) {
  const card = document.createElement("article");
  card.className = "card reveal";
  card.id = room.slug;
  card.dataset.filterTags = room.slug;

  card.innerHTML = `
    <div class="card__body">
      <h3 class="card__title">${room.name}</h3>
      <p class="card__text">${room.blurb}</p>
      <p class="card__meta">
        <span>${AREA_ICON}${room.sqm} sqm</span>
        <span>${VIEW_ICON}${room.view}</span>
        <span>${BED_ICON}Sleeps ${room.maxGuests}</span>
      </p>
      <div class="card__foot">
        <p class="card__price"><span>From</span><b>${money(baseCents + room.fromCents, { withCode: false })}</b><span>/ night</span></p>
        <p class="muted" style="font-size:var(--step--2)">${room.bed}</p>
      </div>
    </div>`;

  return card;
}

/* --------------------------------------------------------------------------
   Dining card — a restaurant or bar
   -------------------------------------------------------------------------- */

export function diningCard(venue, { eager = false, dark = false } = {}) {
  const card = document.createElement("article");
  card.className = `dine-card reveal${dark ? " card--dark" : ""}`;
  card.dataset.filterTags = venue.group;
  card.id = venue.slug;

  card.innerHTML = `
    <div class="card__body" style="padding:0">${""}</div>`;

  const body = $(".card__body", card);
  body.append(media(venue.img, { ar: "4x3", alt: `${venue.name}, ${venue.property}`, eager }));

  const info = document.createElement("div");
  info.className = "dine-card__body";
  info.innerHTML = `
    <p class="eyebrow" style="font-size:.64rem">${venue.cuisine}</p>
    <h3><a href="dining.html#${venue.slug}">${venue.name}</a></h3>
    <p class="dine-card__meta">
      <span><b>At</b> ${venue.property}</span>
      <span><b>Hours</b> ${venue.hours}</span>
      <span><b>Dress</b> ${venue.dress}</span>
    </p>
    <p class="card__text">${venue.blurb}</p>
    ${
      venue.memberOffer
        ? `<p class="dine-card__offer"><span>Ultra Circle</span> ${venue.memberOffer}</p>`
        : ""
    }
    <div class="dine-card__foot">
      ${
        venue.reserve
          ? `<button class="btn btn--outline btn--sm" type="button" data-reserve="${venue.slug}">Reserve a table</button>`
          : `<span class="muted" style="font-size:var(--step--2)">Walk-in &amp; table service</span>`
      }
    </div>`;

  body.append(info);
  return card;
}

/* --------------------------------------------------------------------------
   Gallery tile
   -------------------------------------------------------------------------- */

export function galleryTile(item, { eager = false } = {}) {
  const fig = document.createElement("figure");
  fig.className = "reveal";
  fig.dataset.filterTags = item.cat;

  const url = img(item.img, { w: 700, ar: item.ratio.replace("x", ":"), q: 72 });
  const full = img(item.img, { w: 1800, q: 82 });

  /* The tile itself is the lightbox trigger. It used to be a separate
     .sr-only button appended after the image, which meant clicking the photo
     the guest could actually see hit no trigger at all — and the group
     selector pointed at the wrapping <figure>, which carried none of the
     data-lb-* values the viewer reads. A <button> is still the right
     element: it is the only natively focusable trigger. */
  fig.innerHTML = `
    <button class="media media--${item.ratio} gallery-tile__btn" type="button"
            data-lightbox="#gallery-grid > figure" style="cursor:zoom-in">
      <span class="media__ph" data-ph="${thumb(item.img)}" aria-hidden="true"></span>
      <img loading="lazy" decoding="async" alt="${item.title}" data-src="${url}">
      <span class="sr-only">Open ${item.title} full screen</span>
    </button>`;

  const btn = fig.firstElementChild;
  btn.dataset.lbSrc = url;
  btn.dataset.lbFull = full;
  btn.dataset.lbAlt = item.title;
  btn.dataset.lbCaption = item.title;

  fig.style.position = "relative";
  return fig;
}

export { hydrateSubtree };
