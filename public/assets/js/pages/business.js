/* ==========================================================================
   Ultra Hotel Group — Business Travel
   ========================================================================== */

import { $, el } from "../core.js";
import { media } from "../cards.js";
import { BUSINESS_BENEFITS, BUSINESS_CONNECTIVITY, BUSINESS_TIERS, REGIONS, GROUP } from "/shared/catalog.mjs";

/* --- benefits ------------------------------------------------------------ */

function renderBenefits() {
  const host = $("[data-biz-benefits]");
  if (!host) return;
  host.replaceChildren(
    ...BUSINESS_BENEFITS.map((b) => {
      const li = el("li", { class: "fact reveal" });
      li.innerHTML = `<b>${b.title}</b><span>${b.text}</span>`;
      return li;
    }),
  );
}

/* --- connectivity -------------------------------------------------------- */

function renderConnectivity() {
  const host = $("[data-biz-connectivity]");
  if (!host) return;
  host.replaceChildren(
    ...BUSINESS_CONNECTIVITY.map((c) => {
      const li = el("li", { class: "fact reveal" });
      li.innerHTML = `<b>${c.title}</b><span>${c.text}</span>`;
      return li;
    }),
  );
}

/* --- milestone steps ----------------------------------------------------- */

const MILESTONES = [
  { n: 10, title: "Your 10th night", text: "A reward of your choosing — a free night, a dining credit or an upgrade, whichever you pick before you arrive." },
  { n: 20, title: "Your 20th night", text: "Same again, and by now the team knows which property suits the run of the account." },
  { n: 50, title: "Your 50th night", text: "A milestone worth marking: a guaranteed suite, a dinner for two, or a donation to a cause your company nominates." },
];

function renderSteps() {
  const host = $("[data-biz-steps]");
  if (!host) return;
  host.replaceChildren(
    ...MILESTONES.map((m) => {
      const li = el("li");
      li.innerHTML = `<b>${m.title}</b><p>${m.text}</p>`;
      return li;
    }),
  );
}

/* --- the three levels ---------------------------------------------------- */

function renderTiers() {
  const host = $("[data-biz-tiers]");
  if (!host) return;

  host.replaceChildren(
    ...BUSINESS_TIERS.map((tier, i) => {
      const card = el("article", {
        class: `note-tile reveal${i === 0 ? " note-tile--accent" : ""}`,
      });
      card.innerHTML = `
        <p class="eyebrow">${tier.note}</p>
        <b>${tier.name}</b>
        <span>${tier.perks}</span>`;
      return card;
    }),
  );
}

/* --- the form's region list ---------------------------------------------- */

function renderRegionOptions() {
  const sel = $("[data-biz-regions]");
  if (!sel) return;
  sel.innerHTML = [
    '<option value="">Select</option>',
    ...REGIONS.map((r) => `<option value="${r.id}">${r.name}</option>`),
  ].join("");
}

export function init() {
  renderBenefits();
  renderConnectivity();
  renderSteps();
  renderTiers();
  renderRegionOptions();
}
