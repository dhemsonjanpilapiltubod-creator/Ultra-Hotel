/* ==========================================================================
   Ultra Hotel Group — Ultra Circle

   The nav's mega-menu and the footer both deep-link into this page:
   #join, #benefits, #match, #redeem, #tiers, and #silver / #gold /
   #platinum / #black for the four tiers. Every one of those is a real
   element with a matching id, or a deep link lands on nothing.
   ========================================================================== */

import { $, el } from "../core.js";
import { benefitTile, media } from "../cards.js";
import { TIERS, LOYALTY_BENEFITS, FAQS } from "/shared/catalog.mjs";

/* --- the four tiers ------------------------------------------------------ */

function tierCard(tier, index) {
  const card = document.createElement("article");
  // The id is the anchor the nav uses: ultra-circle.html#platinum
  card.id = tier.slug;
  card.className = `tier-card reveal${tier.accent ? " tier-card--accent" : ""}`;
  card.scrollMarginTop = "calc(var(--nav-h) + var(--sp-5))";

  card.innerHTML = `
    <div class="tier-card__media" data-tier-media></div>
    <div class="tier-card__body">
      <p class="eyebrow">${tier.threshold}</p>
      <h3 class="tier-card__name">${tier.name}</h3>
      <p class="tier-card__blurb">${tier.blurb}</p>
      <p class="tier-card__earn">${tier.earn}</p>
      <ul class="ticks">
        ${tier.perks.map((p) => `<li>${p}</li>`).join("")}
      </ul>
    </div>`;

  const host = $("[data-tier-media]", card);
  if (host) {
    host.append(
      media(tier.img, {
        ar: "3x2",
        alt: `${tier.name} tier — ${tier.threshold}`,
        eager: index < 2,
        w: 900,
        sizes: "(max-width: 900px) 100vw, 33vw",
      }),
    );
  }

  return card;
}

function renderTiers() {
  const host = $("[data-circle-tiers]");
  if (!host) return;
  host.replaceChildren(...TIERS.map(tierCard));
}

/* --- benefits ------------------------------------------------------------ */

function renderBenefits() {
  const host = $("[data-circle-benefits]");
  if (!host) return;
  host.replaceChildren(...LOYALTY_BENEFITS.map(benefitTile));
}

/* --- FAQ ----------------------------------------------------------------- */

const CHEVRON =
  '<svg viewBox="0 0 12 8" width="14" height="9" aria-hidden="true" focusable="false"><path d="M1 1.5 6 6.5 11 1.5" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

function faqBlock() {
  const host = $("[data-circle-faq]");
  if (!host) return;

  host.replaceChildren(
    ...FAQS.slice(0, 5).map((item, i) => {
      const wrap = document.createElement("div");
      wrap.className = "faq__item";

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "faq__q";
      btn.setAttribute("aria-expanded", "false");
      btn.id = `faq-q-${i}`;
      btn.innerHTML = `<span>${item.q}</span>${CHEVRON}`;

      const panel = document.createElement("div");
      panel.className = "faq__a";
      panel.id = `faq-a-${i}`;
      panel.setAttribute("role", "region");
      panel.setAttribute("aria-labelledby", btn.id);
      panel.innerHTML = `<p>${item.a}</p>`;
      panel.hidden = i !== 0;

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

/* --- deep links ---------------------------------------------------------- */

export function init() {
  renderBenefits();
  renderTiers();
  faqBlock();

  // #silver, #gold, #platinum, #black arrive from the nav. Highlight the tier
  // that was actually asked for, and make sure the sticky nav does not clip it.
  const hash = window.location.hash.slice(1);
  if (!hash) return;

  const target = document.getElementById(hash);
  if (!target) return;

  if (TIERS.some((t) => t.slug === hash)) target.classList.add("is-targeted");

  requestAnimationFrame(() =>
    target.scrollIntoView({ block: "start", behavior: "auto" }),
  );
}
