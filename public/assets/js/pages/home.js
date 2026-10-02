/* ==========================================================================
   Ultra Hotel Group — home page

   Every list on this page is rendered from the shared catalogue, so a brand
   name, a member benefit or a rate can only ever be changed in one place.
   The prose and the section order live in index.html; this module fills the
   data-driven slots.
   ========================================================================== */

import { $, el } from "../core.js";
import { brandCard, benefitTile, diningCard, media } from "../cards.js";
import {
  BRANDS,
  LOYALTY_BENEFITS,
  BUSINESS_BENEFITS,
  APP_FEATURES,
  DINING,
  GROUP,
} from "/shared/catalog.mjs";

function mount(selector, nodes) {
  const host = $(selector);
  if (!host) return;
  host.replaceChildren(...nodes);
}

export function init() {
  /* -- 2. Ultra Circle banner, four benefits --------------------------- */
  mount("[data-loyalty-benefits]", LOYALTY_BENEFITS.map(benefitTile));

  /* -- 3. Our Brands, four houses --------------------------------------- */
  mount("[data-brands]", BRANDS.map((b) => brandCard(b, { eager: true })));

  /* -- 4. Restaurants & Bars -------------------------------------------- */
  mount("[data-dining-row]", DINING.slice(0, 6).map((v) => diningCard(v)));

  /* -- 5. Business Travel ----------------------------------------------- */
  mount("[data-business-benefits]", BUSINESS_BENEFITS.map((b) => {
    const li = el("li", { class: "fact reveal" });
    li.innerHTML = `<b>${b.title}</b><span>${b.text}</span>`;
    return li;
  }));

  /* -- 6. Meetings & Events ----------------------------------------------
     Deliberately left as prose and a single call to action. The group
     statistics belong on About Ultra, not here. */

  /* -- 8. Ultra Circle app ---------------------------------------------- */
  mount("[data-app-features]", APP_FEATURES.map((f) => {
    const li = el("li", { class: "fact reveal" });
    li.innerHTML = `<b>${f.title}</b><span>${f.text}</span>`;
    return li;
  }));

  /* -- the phone mock beside the app copy ------------------------------- */
  const phone = $("[data-app-phone]");
  if (phone) {
    phone.append(
      media("photo-1590490360182-c33d57733427", {
        ar: "3x4",
        alt: "A guest room at an Ultra Hotel, the kind of rate members browse in the app",
        eager: true,
        w: 700,
      }),
    );
    phone.insertAdjacentHTML(
      "beforeend",
      `<p class="app-shot__badge">
         <b>${GROUP.memberNumber}</b><span>Ultra Circle members</span>
       </p>`,
    );
  }

  /* -- the promise, repeated wherever the brief asks for it ------------- */
  for (const node of document.querySelectorAll("[data-promise]")) {
    node.textContent = GROUP.promise;
  }
}
