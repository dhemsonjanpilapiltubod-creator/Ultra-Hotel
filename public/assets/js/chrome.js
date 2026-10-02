/* ==========================================================================
   Ultra Hotel — page chrome
   The footer, the floating chat launcher and its panel. Rendered from JS so
   every page shares one definition.
   ========================================================================== */

import { $, el, stampYear } from "./core.js";
import { GROUP, MEETING_FACTS, PROPERTIES, TIERS, WEDDING_PACKAGES, WEDDING_VENUES } from "/shared/catalog.mjs";
import { TERMS, money } from "/shared/booking.mjs";
import { LANGUAGES, CURRENCIES } from "./nav.js";

/* The concierge answers from the same numbers the rest of the site renders.
   These answers used to repeat prices, room counts and child policies by
   hand, so they drifted away from the catalogue: the group was quoted as
   having 520 meeting rooms (it has 588), points "per dollar" in a site that
   prices in pesos, and free stays for under-sixes when the terms say under
   twelve. */
const PROPERTIES_BY_BRAND = {
  hotels: cheapest("ultra-hotels"),
  resort: cheapest("ultra-resorts"),
  aether: cheapest("aether-by-ultra"),
  pulse: cheapest("pulse-by-ultra"),
};

function cheapest(brandSlug) {
  const inBrand = PROPERTIES.filter((p) => p.brand === brandSlug);
  return (inBrand.length ? inBrand : PROPERTIES).reduce((a, b) => (a.fromCents <= b.fromCents ? a : b));
}

function tierLine() {
  return TIERS.map((t) => `${t.name} — ${t.threshold}`).join(", ").replace(/, ([^,]*)$/, ", and $1") + ".";
}

/* --------------------------------------------------------------------------
   Footer
   -------------------------------------------------------------------------- */

/* Brand marks rather than the outline glyphs used elsewhere: a platform logo has
   to be recognisable at 17px, which only holds for the real silhouette. They are
   filled in currentColor rather than their own brand blue, because tokens.css
   fixes the palette at nine approved hex codes and this row stays inside it. */
const ICONS = {
  facebook:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  instagram:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M12 2.16c3.2 0 3.58.02 4.85.07 1.17.06 1.8.25 2.22.42.56.21.96.47 1.38.89.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.26.07 1.64.07 4.85s-.01 3.59-.07 4.85c-.06 1.17-.26 1.8-.42 2.22-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.26.06-1.64.07-4.85.07s-3.59-.01-4.85-.07c-1.17-.06-1.8-.26-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23-.06-1.26-.07-1.64-.07-4.85s.01-3.59.07-4.85c.06-1.17.26-1.8.42-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.05-.36 2.22-.41C8.33 2.17 8.71 2.16 12 2.16M12 0C8.74 0 8.33.02 7.05.07c-1.28.06-2.15.26-2.91.56-.79.3-1.46.72-2.13 1.38-.66.67-1.08 1.34-1.38 2.13-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.3.79.72 1.46 1.38 2.13.67.66 1.34 1.08 2.13 1.38.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.13-1.38.66-.67 1.08-1.34 1.38-2.13.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.13C21.32 1.35 20.65.93 19.86.63c-.76-.3-1.63-.5-2.91-.56C15.67.02 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm7.85-10.4a1.44 1.44 0 1 1-2.88 0 1.44 1.44 0 0 1 2.88 0z"/></svg>',
  indeed:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="4.2" fill="none" stroke="currentColor" stroke-width="1.6"/><circle cx="12" cy="8.7" r="1.5" fill="currentColor"/><path d="M12 12.4v4.7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  linkedin:
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.03-1.85-3.03-1.85 0-2.14 1.44-2.14 2.94v5.66H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zm1.78 13.02H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
};

/* The row points at the profiles this site is actually built and published by,
   so each href resolves to a real account rather than a plausible-looking guess
   at a group's handle — which either 404s or, on a live platform, opens a
   stranger's account. The footer bar already links the phone and the
   reservation inbox as text, so nothing reachable was lost with them. */
const SOCIALS = [
  ["facebook", "Facebook — Dhemsonal", "https://www.facebook.com/Dhemsonal"],
  ["instagram", "Instagram — dhemsonal", "https://www.instagram.com/dhemsonal/"],
  ["indeed", "Indeed — Dhemson Jan P. Tubod", "https://profile.indeed.com/?hl=en_PH&co=PH&from=gnav-homepage"],
  ["linkedin", "LinkedIn — Dhemson Jan P. Tubod", "https://www.linkedin.com/in/dhemson-jan-pilapil-tubod-13b7a8402/"],
];

const LINK_COLUMNS = [
  {
    title: "Find & Book",
    links: [
      ["Find & Book", "book.html"],
      ["All hotels & resorts", "hotels.html"],
      ["Destinations", "hotels.html#destinations"],
      ["Ultra Hotels", "brands.html#ultra-hotels"],
      ["Ultra Resorts", "brands.html#ultra-resorts"],
      ["Aether by Ultra", "brands.html#aether-by-ultra"],
      ["Pulse by Ultra", "brands.html#pulse-by-ultra"],
      ["Gallery", "gallery.html"],
    ],
  },
  {
    title: "Ultra Circle",
    links: [
      ["Overview", "ultra-circle.html"],
      ["Join free", "ultra-circle.html#join"],
      ["Member benefits", "ultra-circle.html#benefits"],
      ["The four tiers", "ultra-circle.html#tiers"],
      ["Earn & redeem points", "ultra-circle.html#redeem"],
      ["Status match", "ultra-circle.html#match"],
      ["Dining rewards", "dining.html#rewards"],
    ],
  },
  {
    title: "About Ultra Group",
    links: [
      ["Our story", "about.html"],
      ["Leadership", "about.html#leadership"],
      ["Sustainability", "about.html#sustainability"],
      ["Careers", "about.html#careers"],
      ["Press & media", "about.html#press"],
      ["Meetings & events", "events.html"],
      ["Weddings & celebrations", "weddings.html"],
      ["Business travel", "business.html"],
      ["Contact us", "about.html#contact"],
    ],
  },
  {
    title: "Ultra Circle App",
    links: [
      ["Overview", "app.html"],
      ["Download the app", "app.html#download"],
      ["Mobile check-in & out", "app.html#checkin"],
      ["Pay your way", "app.html#pay"],
      ["Member-only deals", "app.html#deals"],
      ["App support", "about.html#contact"],
    ],
  },
];

const LEGAL_LINKS = [
  ["Privacy Policy", "about.html#privacy"],
  ["Terms of Use", "about.html#terms"],
  ["Cookie Settings", "about.html#cookies"],
];

/** Mirror the header's saved language and currency into the footer copies. */
export function renderFooter() {
  const mount = $("[data-footer-mount]");
  if (!mount) return;

  const lang = $("[data-langsel]")?.value || "en-GB";
  const cur = $("[data-cursel]")?.value || "PHP";

  const columns = LINK_COLUMNS.map(
    (col) => `<div>
      <h2 class="footer__title">${col.title}</h2>
      <ul class="footer__list">
        ${col.links.map(([label, href]) => `<li><a href="${href}">${label}</a></li>`).join("")}
      </ul>
    </div>`,
  ).join("");

  const socials = SOCIALS.map(
    ([k, label, href]) =>
      `<a href="${href}"${href.startsWith("http") ? ' rel="noopener noreferrer" target="_blank"' : ""} aria-label="${label}">${ICONS[k] || ""}</a>`,
  ).join("");

  const legal = LEGAL_LINKS.map(([label, href]) => `<a href="${href}">${label}</a>`).join(
    '<span class="footer__sep" aria-hidden="true">|</span>',
  );

  mount.innerHTML = `
    <footer class="footer">
      <div class="shell shell--wide">
        <div class="footer__grid">
          <div class="footer__brand">
            <span class="logo logo--light">
              <span class="logo__mark">ULTRA</span>
              <span class="logo__sub">Hotel</span>
            </span>
            <p class="footer__tagline">Stay, Dine, Meet Anytime&nbsp;Anywhere</p>
            <div class="footer__contact" style="margin-top:var(--sp-5)">
              <p>Ultra Hotel Group<br>${GROUP.headquarters}</p>
      <p><a href="tel:${GROUP.phoneHref}">${GROUP.phone}</a></p>
      <p><a href="mailto:${GROUP.reservationEmail}">${GROUP.reservationEmail}</a></p>
              <p>${GROUP.properties} hotels · ${GROUP.destinations} destinations · ${GROUP.memberNumber} members</p>
            </div>

            <form class="newsletter" data-newsletter novalidate>
              <label class="footer__title" for="nl-email" style="display:block;margin-bottom:0">Newsletter</label>
              <p class="muted" style="color:var(--text-invert-mute);font-size:var(--step--2);margin-top:.35rem">
                Offers, new menus and destination news, roughly monthly.
              </p>
              <div class="newsletter__row">
                <input class="input" id="nl-email" name="email" type="email" placeholder="Your email address" required autocomplete="email" aria-describedby="nl-msg">
                <button class="btn btn--gold" type="submit">Join</button>
              </div>
              <p class="newsletter__msg" id="nl-msg" role="status" aria-live="polite"></p>
            </form>
          </div>

          ${columns}
        </div>

        <div class="footer__profile">
          <span class="footer__frame">
            <img class="footer__avatar" src="/assets/img/TUBOD.jpg" width="84" height="84"
                 alt="Dhemson Jan P. Tubod" loading="lazy" decoding="async">
          </span>
          <span class="footer__profile-text">
            <span class="footer__profile-name">Dhemson Jan P. Tubod</span>
            <span class="footer__profile-role">Fresh Computer Engineering Graduate<span class="footer__sep" aria-hidden="true">|</span>Aspiring Web Developer</span>
          </span>
        </div>

        <div class="footer__bar">
          <p>© <span data-year></span> Dhemson Jan P. Tubod. All rights reserved. Philippines.</p>

          <nav class="footer__legal" aria-label="Legal">${legal}</nav>

          <div class="footer__social">${socials}</div>
        </div>
      </div>
    </footer>`;

  /* the footer keeps its own language and currency controls in step with
     the header, which is where the choice is actually made */
  const langSel = document.createElement("select");
  const curSel = document.createElement("select");
  for (const [value, label] of LANGUAGES) {
    langSel.add(new Option(label, value, false, value === lang));
  }
  for (const [value, label] of CURRENCIES) {
    curSel.add(new Option(label, value, false, value === cur));
  }
  langSel.dataset.langsel = "";
  curSel.dataset.cursel = "";
  langSel.setAttribute("aria-label", "Language");
  curSel.setAttribute("aria-label", "Currency");
  langSel.className = curSel.className = "footer__select";
  mount.querySelector(".footer__bar")?.prepend(
    Object.assign(document.createElement("div"), { className: "footer__utils" }),
  );
  const utils = mount.querySelector(".footer__utils");
  utils?.append(langSel, curSel);

  // boot() stamps the year before this footer exists, so without this the
  // copyright notice was frozen at whatever the markup happened to contain.
  stampYear();
}

/* --------------------------------------------------------------------------
   Floating chat
   A scripted front-of-house concierge: it answers from a small local
   knowledge base, and says plainly when a question needs a human.
   -------------------------------------------------------------------------- */

const KB = [
  [/direct|best rate|guarantee|parity|cheaper/i, `${GROUP.name} guarantees the best rate on direct bookings only. Find a lower public rate for the same room, dates and terms within 24 hours and we match it, then add 10% Ultra Points on top.`],
  [/price|rate|cost|quote|how much|book/i, `Rates start at ${money(PROPERTIES_BY_BRAND.pulse.fromCents)} a night at Pulse, ${money(PROPERTIES_BY_BRAND.aether.fromCents)} at Aether, and ${money(PROPERTIES_BY_BRAND.resort.fromCents)} at an Ultra Resort. The best way to get an exact total is the Find & Book bar — tell me a property and a date and I'll point you at the right one.`],
  [/circle|member|tier|points|loyal|silver|gold|platinum|black/i, `Ultra Circle is free to join. ${tierLine()} You earn Ultra Points on stays, dining and spa alike, at ${TIERS[0].earn.toLowerCase()} rising to ${TIERS[TIERS.length - 1].earn.toLowerCase()} on Black.`],
  [/kid|child|children|family|baby/i, `Children under ${TERMS.childAgeMax} stay and eat free at every rate, and ${TERMS.includedChildren} of them are included in the rate you are quoted. Family suites sleep four, and connecting rooms are free to hold on most properties.`],
  [/business|corporate|company|work trip|reimburse/i, `Corporate travellers can register free for flexible rates, consolidated monthly invoicing and purchase-order references on every folio. Milestone rewards land at your tenth, twentieth and fiftieth night in a rolling year.`],
  [/meeting|event|conference|banquet|boardroom|ballroom/i, `There are ${GROUP.meetingSpaces} meeting rooms group-wide, and the largest ballroom seats ${MEETING_FACTS[1].value}. Most quotes come back within 48 hours — tell me the city, dates and headcount and I'll route it to the right property.`],
  [/wedding|celebration|reception|marry|marriage/i, `Packages start at ${WEDDING_PACKAGES[0].from} for ${WEDDING_PACKAGES[0].name.toLowerCase()} weddings, ${WEDDING_PACKAGES[0].guests.toLowerCase()} guests, up to ${WEDDING_PACKAGES[2].guests.toLowerCase()} on ${WEDDING_PACKAGES[2].name.toLowerCase()}. The largest lawn we hold is ${WEDDING_VENUES[0].capacity.toLowerCase()} at ${WEDDING_VENUES[0].property}, and there's a dedicated coordinator on every one.`],
  [/dining|restaurant|bar|table|eat|dinner|breakfast|reserve/i, `There are ${GROUP.restaurants} restaurants and bars across the group. Each property has at least two that are open to non-guests, so you can eat well without checking in. Tell me the property and the evening and I'll suggest one.`],
  [/spa|massage|treat|wellness/i, `Every Ultra Hotel and Ultra Resort has a signature Ultra Spa, and the treatments are the same menu everywhere. Book about 72 hours ahead for the longer rituals, and members get two a year included at Platinum.`],
  [/airport|transfer|taxi|transport|shuttle/i, `Every property runs airport transfers, and Pulse and Aether include a city e-hailing credit with every direct booking. Tell me the property and I'll pass it to the front desk to arrange.`],
  [/app|mobile|phone|ios|android|download/i, `The Ultra Circle App is free on iOS and Android. You get direct rates, mobile check-in from 24 hours out, a digital key, and a handful of rates that only exist inside it.`],
  [/cancel|refund|change|fee/i, `Flexible rates cancel free up to 24 hours before arrival. Advance-purchase rates are non-refundable but can be moved once, free, up to seven days out. Black members can move a booking with no notice at all.`],
  [/wifi|internet|connection|password/i, `Complimentary high-speed Wi-Fi in every room, every public space and every meeting room. Wired access at the desk in Ultra Hotels for anyone who needs a stable line.`],
  [/sustainab|green|eco|carbon|environment/i, `We publish Scope 1 and 2 emissions per property every year, including the years the number went the wrong way. Nineteen resorts sit on or beside a protected reef and each funds its local management partner directly.`],
];

const FALLBACK =
  "That's a good question — let me pass it to the front desk. Leave your email and someone from the Ultra Hotel team will reply, usually within the hour during office hours.";

function replyTo(text) {
  for (const [pattern, answer] of KB) {
    if (pattern.test(text)) return answer;
  }
  return FALLBACK;
}

export function initChat() {
  const mount = $("[data-chat-mount]");
  if (!mount) return;

  const launcher = el("button", {
    class: "chat-launcher",
    type: "button",
    "aria-expanded": "false",
    "aria-controls": "chat-panel",
  });
  launcher.innerHTML = `<span class="chat-launcher__dot" aria-hidden="true"></span><span>Chat with us</span>`;

  const panel = el("div", { class: "chat-panel", id: "chat-panel", role: "dialog", "aria-label": "Chat with Ultra Hotel" });
  panel.innerHTML = `
    <div class="chat-panel__head">
      <div>
        <strong>Ultra Hotel Concierge</strong>
        <small>Typically replies instantly</small>
      </div>
    </div>
    <div class="chat-panel__body" data-chat-body role="log" aria-live="polite" aria-relevant="additions">
      <div class="chat-msg">Good day — I'm the Ultra Hotel concierge. Ask me about rates, Ultra Circle, dining, business travel or weddings, and I'll do my best.</div>
    </div>
    <form class="chat-panel__form" data-chat-form>
      <label class="sr-only" for="chat-input">Message</label>
      <input class="input" id="chat-input" name="message" placeholder="Write a message…" autocomplete="off" required>
      <button class="chat-panel__send" type="submit" aria-label="Send message">
        <svg viewBox="0 0 20 16" aria-hidden="true"><path d="M1 8h17M12 1.5 18.5 8 12 14.5" fill="none" stroke="currentColor" stroke-width="1.7"/></svg>
      </button>
    </form>`;

  mount.append(launcher, panel);

  const body = $("[data-chat-body]", panel);
  const form = $("[data-chat-form]", panel);
  const input = $("#chat-input", panel);

  const push = (text, mine = false) => {
    const node = el("div", { class: `chat-msg${mine ? " chat-msg--me" : ""}`, text });
    body.append(node);
    body.scrollTop = body.scrollHeight;
  };

  const open = () => {
    panel.classList.add("is-open");
    launcher.setAttribute("aria-expanded", "true");
    setTimeout(() => input?.focus(), 120);
  };

  const close = () => {
    panel.classList.remove("is-open");
    launcher.setAttribute("aria-expanded", "false");
  };

  launcher.addEventListener("click", () => {
    panel.classList.contains("is-open") ? close() : open();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panel.classList.contains("is-open")) close();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    push(text, true);
    input.value = "";

    // a short beat of "typing" makes it feel like a person, not a lookup
    const dots = el("div", { class: "chat-msg", text: "…" });
    body.append(dots);
    body.scrollTop = body.scrollHeight;

    setTimeout(() => {
      dots.remove();
      push(replyTo(text));
    }, 550);
  });
}
