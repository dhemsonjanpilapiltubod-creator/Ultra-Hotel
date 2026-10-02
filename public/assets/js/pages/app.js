/* ==========================================================================
   Ultra Hotel Group — The Ultra App
   ========================================================================== */

import { $, el } from "../core.js";
import { media } from "../cards.js";
import { APP_FEATURES } from "/shared/catalog.mjs";
import { money } from "/shared/booking.mjs";

/* --- platforms ----------------------------------------------------------- */

/* The store URLs are deliberately absent. There is no published build behind
   this project, so any apps.apple / play.google ID here would be a guess that
   dead-ends on someone else's listing (or 404s). The badges render as
   unavailable instead of pretending to be links, and the section's working
   calls to action are the two routes that actually resolve: book here, or
   call reservations. */
const PLATFORMS = [
  {
    store: "App Store",
    os: "iOS 16 or later",
    line: "Download on the",
    cta: "App Store",
    glyph: '<path d="M15.5 2.4a2 2 0 0 0-2.2 2.2c0 .4 0 .8.1 1.1a2 2 0 0 0 2.1-1.4 2 2 0 0 0-.1-1.1l.1-.8Z"/><path d="M18 20.6c-.5 1.1-1 2.2-1.8 3.2-.6.8-1.3 1.5-2.3 1.5-1 0-1.3-.6-2.4-.6s-1.5.6-2.4.6c-1 0-1.7-.7-2.3-1.5C4.9 21.1 3.2 17 5.4 14c.9-1.2 2.1-1.8 3.2-1.8 1 0 1.9.6 2.9.6.9 0 1.6-.6 2.9-.6 1 0 2.1.5 2.9 1.4-2.5 1.4-2.1 5 .3 6Z"/>',
  },
  {
    store: "Google Play",
    os: "Android 11 or later",
    line: "Get it on",
    cta: "Google Play",
    glyph: '<path d="M4 3.3v17.4c0 .3.3.5.5.3l9.4-8.7a.3.3 0 0 0 0-.6L4.5 3a.3.3 0 0 0-.5.3Z"/><path d="M16.3 9.6 13.8 7.5 5.1 2.7c-.2-.1-.4-.1-.5.1L14 11.5l2.3-1.9Zm0 4.8-2.3-1.9L5.1 21.3c-.2.1-.3.2-.5.1l8.7-4.8 2.5-2.1c.4-.3.4-.8 0-1.1Z"/>',
  },
  {
    store: "AppGallery",
    os: "HarmonyOS 4 or later",
    line: "Explore it on",
    cta: "AppGallery",
    glyph: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="12" r="3" fill="currentColor"/>',
  },
];

/* --- app-only offers ----------------------------------------------------- */

const DEALS = [
  {
    title: "Flash rates",
    text: "Forty per cent off on rooms the group is not otherwise selling, released on Sunday evenings and gone by Monday morning.",
    img: "photo-1611892440504-42a792e24d32",
  },
  {
    title: "Upgrade window",
    text: "Ask from the app in the 48 hours before arrival. If a better room is free, it is yours, and it costs nothing to ask.",
    img: "photo-1618773928121-c32242e63f39",
  },
  {
    title: "Last-minute tables",
    text: "Empty tables at full-service restaurants across the group, released at 4pm for tonight, members only.",
    img: "photo-1592861956120-e524fc739696",
  },
  {
    title: "Points top-up",
    text: "Buy points in the app up to 48 hours before arrival, at a rate shown before you confirm, and spend them on the same stay.",
    img: "photo-1554224155-8d04cb21cd6c",
  },
];

/* --- the payment split demo ---------------------------------------------- */

const SPLIT = [
  { label: "Room, two nights", method: "25,000 points", cost: "PHP 0.00", note: "Redeemed" },
  { label: "Dinner, both nights", method: "Card ending 4412", cost: "PHP 486.00", note: "" },
  { label: "Spa, one treatment", method: "Cash on arrival", cost: "PHP 210.00", note: "" },
  { label: "City transfer", method: "Points", cost: "5,000 points", note: "Redeemed" },
];

function renderPaySplit() {
  const host = $("[data-app-pay-split]");
  if (!host) return;

  host.innerHTML = `
    <p class="eyebrow">Ultra Kyoto Garden · 2 nights</p>
    <h3 class="pay-split__title">One stay, three ways to pay</h3>
    <ul class="pay-split__rows" data-pay-rows></ul>
    <p class="pay-split__total">
      <span>Cash and card</span>
      <b>PHP 696.00</b>
    </p>
    <p class="pay-split__points">
      <span>Points redeemed</span>
      <b>30,000</b>
    </p>
    <p class="pay-split__note">Shown before you confirm. Nothing is split behind your back.</p>`;

  const rows = $("[data-pay-rows]", host);
  rows.replaceChildren(
    ...SPLIT.map((r) =>
      el("li", {
        html: `<span class="pay-split__label">${r.label}${r.note ? `<em>${r.note}</em>` : ""}</span>
               <span class="pay-split__method">${r.method}</span>
               <span class="pay-split__cost">${r.cost}</span>`,
      }),
    ),
  );
}

/* --- sections ------------------------------------------------------------ */

function renderFeatures() {
  const host = $("[data-app-features]");
  if (!host) return;
  host.replaceChildren(
    ...APP_FEATURES.map((f) => {
      const li = el("li", { class: "benefit reveal" });
      li.innerHTML = `<b>${f.title}</b><span>${f.text}</span>`;
      return li;
    }),
  );
}

function renderPhone() {
  const slot = $("[data-app-phone]");
  if (slot) {
    slot.append(
      media("photo-1551882547-ff40c63fe5fa", {
        ar: "9x16",
        alt: "The Ultra app on a phone",
        eager: true,
        w: 700,
      }),
    );
  }

  const list = $("[data-app-shot-list]");
  if (list) {
    list.replaceChildren(
      ...[
        "Digital key live 24 hours before arrival",
        "Folio itemised, and disputable, from the room",
        "Express checkout the night before",
        "Ask for an upgrade without ringing reception",
      ].map((t) => el("li", { html: `<b>${t}</b>` })),
    );
  }
}

function renderDeals() {
  const host = $("[data-app-deals]");
  if (!host) return;
  host.replaceChildren(
    ...DEALS.map((d) => {
      const card = el("article", { class: "note-tile note-tile--dark reveal" });
      card.innerHTML = `<b>${d.title}</b><span>${d.text}</span>`;
      return card;
    }),
  );
}

function renderDownload() {
  // The pagehead CTA keeps its in-page jump: #download is a real section with
  // real content, so this is a scroll rather than a dead link. The working
  // alternative is the booking engine one line below.
  const actions = $("[data-app-download-actions]");
  if (actions) {
    actions.innerHTML = `
      <a class="btn btn--gold btn--lg" href="#download">Get the app</a>
      <a class="link" href="book.html">or book on this site</a>`;
  }

  const host = $("[data-app-download-cards]");
  if (host) {
    host.replaceChildren(
      ...PLATFORMS.map((p) =>
        el("div", {
          class: "download__item download__item--pending",
          html: `
            <span class="download__glyph" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">${p.glyph}</svg>
            </span>
            <span class="download__text">
              <span class="download__line">${p.line}</span>
              <b>${p.cta}</b>
            </span>
            <span class="download__os">${p.os}</span>
            <span class="download__status">Not yet published</span>`,
        }),
      ),
    );
  }
}

export function init() {
  renderFeatures();
  renderPhone();
  renderPaySplit();
  renderDeals();
  renderDownload();
}
