/* ==========================================================================
   Ultra Hotel Group — About

   The nav and the footer deep-link into this page, so every one of these
   ids has to exist: #leadership #sustainability #careers #press #contact
   #manage #access #faq #privacy #terms #cookies
   ========================================================================== */

import { $, el } from "../core.js";
import { media } from "../cards.js";
import {
  STATS,
  SUSTAINABILITY,
  AWARDS,
  FAQS,
  CONTACT_TOPICS,
  GROUP,
} from "/shared/catalog.mjs";

/* --- the executive committee --------------------------------------------
   Not in the shared catalogue: leadership changes and this list is edited
   deliberately, per page, rather than flowing from booking data. */

const LEADERS = [
  {
    name: "Isabelle Cheong",
    role: "Group Chief Executive",
    since: "2016",
    img: "photo-1573496359142-b8d87734a5a2",
    bio: "Joined Ultra Mactan Bay as a front office trainee in 1998. Has worked in eleven properties across the group since.",
  },
  {
    name: "Rajan Mehta",
    role: "Group Chief Financial Officer",
    since: "2012",
    img: "photo-1560250097-0b93528c311a",
    bio: "Oversees development finance across 112 properties. Sits on the board of the group's own foundation.",
  },
  {
    name: "Sofia Bergström",
    role: "Chief Operating Officer — Ultra Hotels & Resorts",
    since: "2019",
    img: "photo-1580489944761-15a19d654956",
    bio: "Runs the two flagships and the estate collection. Previously six years with a European luxury group.",
  },
  {
    name: "Tomás Okafor",
    role: "Chief Operating Officer — Aether & Pulse",
    since: "2020",
    img: "photo-1519085360753-af0119f7cbe7",
    bio: "Built Aether from eleven shophouses to a group of forty. Believes a small room programme is a feature.",
  },
];

/* --- accordion ----------------------------------------------------------- */

const CHEVRON =
  '<svg viewBox="0 0 12 8" width="14" height="9" aria-hidden="true" focusable="false"><path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

function accordion(hostSel, items, { openFirst = false } = {}) {
  const host = $(hostSel);
  if (!host) return;

  host.replaceChildren(
    ...items.map((item, i) => {
      const key = item.id || `item-${i}`;
      const wrap = document.createElement("div");
      wrap.className = "faq__item";
      // deep-linkable: about.html#privacy
      wrap.id = key;
      wrap.scrollMarginTop = "calc(var(--nav-h) + var(--sp-5))";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "faq__q";
      btn.setAttribute("aria-expanded", "false");
      btn.id = `${key}-q`;
      btn.innerHTML = `<span>${item.q}</span>${CHEVRON}`;

      const panel = document.createElement("div");
      panel.className = "faq__a";
      panel.id = `${key}-a`;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", btn.id);
      panel.innerHTML = `<p>${item.a}</p>`;
      panel.hidden = !(openFirst && i === 0);

      if (i === 0) btn.setAttribute("aria-expanded", openFirst ? "true" : "false");

      btn.addEventListener("click", () => {
        const open = btn.getAttribute("aria-expanded") === "true";
        btn.setAttribute("aria-expanded", open ? "false" : "true");
        panel.hidden = open;
      });

      wrap.append(btn, panel);
      return wrap;
    }),
  );
}

/* --- sections ------------------------------------------------------------ */

function renderStats() {
  const host = $("[data-about-stats]");
  if (!host) return;
  host.replaceChildren(
    ...STATS.map((s) => {
      const div = el("div", { class: "stat reveal" });
      div.innerHTML = `
        <span class="stat__value" data-count-to="${s.value}" data-count-suffix="${s.suffix}">0</span>
        <span class="stat__label">${s.label}</span>`;
      return div;
    }),
  );
}

function renderLeaders() {
  const host = $("[data-about-leaders]");
  if (!host) return;

  host.replaceChildren(
    ...LEADERS.map((p, i) => {
      const card = el("article", { class: "person reveal" });
      card.innerHTML = `
        <span class="person__media" data-person-media></span>
        <div class="person__body">
          <h3 class="person__name">${p.name}</h3>
          <p class="person__role">${p.role}</p>
          <p class="person__since">Since ${p.since}</p>
          <p class="person__bio">${p.bio}</p>
        </div>`;
      $("[data-person-media]", card).append(
        media(p.img, { ar: "4x5", alt: p.name, eager: i < 2, w: 700 }),
      );
      return card;
    }),
  );
}

function renderSustain() {
  const host = $("[data-about-sustain]");
  if (!host) return;
  host.replaceChildren(
    ...SUSTAINABILITY.map((s) =>
      el("li", { html: `<b>${s.title}</b><span>${s.text}</span>` }),
    ),
  );
}

function renderAwards() {
  const host = $("[data-about-awards]");
  if (!host) return;
  host.replaceChildren(
    ...AWARDS.map((a) =>
      el("div", { class: "strip__item reveal", html: `<b>${a.name}</b><small>${a.note}</small>` }),
    ),
  );
}

function renderTopics() {
  const sel = $("[data-about-topics]");
  if (!sel) return;
  sel.innerHTML = [
    ...CONTACT_TOPICS.map((t) => `<option value="${t.id}">${t.label}</option>`),
    '<option value="careers">Careers</option>',
    '<option value="property">Owning or managing a property</option>',
    '<option value="access">Accessibility</option>',
    '<option value="press">Press</option>',
    '<option value="other">Something else</option>',
  ].join("");
}

/* --- legal --------------------------------------------------------------- */

const LEGAL = [
  {
    id: "privacy",
    q: "Privacy",
    a: `We collect what a booking requires — name, contact details, dates, and payment information — and nothing else unless you ask for it. We do not sell personal data, and we do not share it beyond the property you booked and the processors that run our bookings. Membership data is held separately from booking data so that leaving Ultra Circle does not touch a reservation you have already made. Requests to access, correct or erase your data go to privacy@ultrahotel.com and are answered within 30 days.`,
  },
  {
    id: "terms",
    q: "Booking terms",
    a: `A reservation is a contract between you and the specific property. Flexible rates can be cancelled free of charge up to 24 hours before arrival; advance-purchase rates are non-refundable but may be moved once, free of charge, up to seven days before arrival. Rates are quoted in the currency shown at the time of booking, and any local tax or levy collected at the property is included in the final amount. Check-in is from 3pm and check-out is 12pm unless your confirmation says otherwise, and the confirmation is the document that governs.`,
  },
  {
    id: "cookies",
    q: "Cookies",
    a: `We use cookies for three things: keeping you signed in, remembering your room and rate preferences, and measuring which pages are actually useful. We do not use advertising cookies, and we do not sell behavioural data to anyone. You can block or delete cookies in your browser without losing the ability to book — the only thing you lose is a faster checkout.`,
  },
];

function renderGroupPhone() {
  // The group number is data, not copy — rendering it here stops the markup
  // and the shared catalogue from drifting apart.
  for (const node of document.querySelectorAll("[data-group-phone]")) {
    node.textContent = GROUP.phone;
    node.href = `tel:${GROUP.phoneHref}`;
  }
}

export function init() {
  renderStats();
  renderLeaders();
  renderSustain();
  renderAwards();
  renderTopics();
  renderGroupPhone();

  accordion("[data-about-faq]", FAQS.slice(0, 6), { openFirst: true });
  accordion("[data-about-legal]", LEGAL);

  // Careers links into the contact form with the topic pre-selected.
  $("[data-careers-link]")?.addEventListener("click", () => {
    const sel = $("[data-about-topics]");
    if (sel) sel.value = "careers";
  });
}
