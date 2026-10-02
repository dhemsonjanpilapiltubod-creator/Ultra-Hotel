/* ==========================================================================
   Ultra Hotel Group — Our Brands

   Four long-form brand stories. The nav's mega-menu links straight to
   #ultra-hotels, #ultra-resorts, #aether-by-ultra and #pulse-by-ultra, so
   those four ids are load-bearing: the slug on each article is the anchor.
   ========================================================================== */

import { $, el } from "../core.js";
import { media, propertyCard } from "../cards.js";
import { BRANDS, REGIONS, PROPERTIES, img } from "/shared/catalog.mjs";

const ARROW =
  '<svg class="link__arrow" viewBox="0 0 16 12" aria-hidden="true"><path d="M1 6h13M9 1.5 14 6l-5 4.5" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

/* The nav's jump list uses these labels — keep them in step with it. */
function brandBlock(brand, index) {
  const section = document.createElement("article");
  section.className = "brand-story reveal";
  section.id = brand.slug;

  const flipped = index % 2 === 1;
  const picks = PROPERTIES.filter((p) => p.brand === brand.slug && p.highlight).slice(0, 3);
  const shown = picks.length ? picks : PROPERTIES.filter((p) => p.brand === brand.slug).slice(0, 3);

  section.innerHTML = `
    <div class="split split--wide${flipped ? " split--flip" : ""}">
      <div class="brand-story__copy">
        <p class="eyebrow">${brand.kicker} · ${brand.rooms} properties</p>
        <h2 class="brand-story__title">${brand.name}</h2>
        <p class="lead">${brand.tagline}</p>
        <div class="prose" style="margin-top:var(--sp-5)"><p>${brand.blurb}</p></div>
        <ul class="ticks" aria-label="${brand.name} highlights">
          ${brand.points.map((pt) => `<li>${pt}</li>`).join("")}
        </ul>
        <p class="brand-story__links">
          <a class="btn btn--gold" href="book.html?brand=${brand.slug}">Book ${brand.name}</a>
          <a class="link" href="hotels.html?brand=${brand.slug}">See all properties ${ARROW}</a>
        </p>
      </div>
      <div class="brand-story__media" data-brand-media></div>
    </div>
    <div class="brand-story__picks" data-brand-picks></div>`;

  const mediaHost = $("[data-brand-media]", section);
  if (mediaHost) {
    mediaHost.append(
      media(brand.img, {
        ar: "4x3",
        alt: `${brand.name} — a room typical of the brand`,
        eager: index < 2,
        sizes: "(max-width: 1080px) 100vw, 50vw",
      }),
    );
  }

  const picksHost = $("[data-brand-picks]", section);
  if (picksHost) picksHost.replaceChildren(...shown.map((p) => propertyCard(p)));

  return section;
}

function jumpList() {
  const host = $("[data-brands-jump]");
  if (!host) return;
  host.replaceChildren(
    ...BRANDS.map((b) =>
      el("li", {}, el("a", { class: "brand-jump__item", href: `#${b.slug}` },
        el("span", { class: "brand-jump__name", text: b.name }),
        el("span", { class: "brand-jump__note", text: `${b.rooms} properties` }),
      )),
    ),
  );
}

function regionGrid() {
  const host = $("[data-brands-regions]");
  if (!host) return;

  host.replaceChildren(
    ...REGIONS.map((r) => {
      const count = PROPERTIES.filter((p) => p.region === r.id).length;
      const card = document.createElement("a");
      card.className = "region-card reveal";
      card.href = `hotels.html?region=${r.id}`;
      card.innerHTML = `
        <span class="media media--3x2"></span>
        <span class="region-card__body">
          <b>${r.name}</b>
          <small>${count} ${count === 1 ? "property" : "properties"}</small>
        </span>`;
      const mediaHost = $(".media", card);
      mediaHost.append(
        media(r.img, {
          ar: "3x2",
          alt: `${r.name} — a destination in the region`,
          w: 900,
          sizes: "(max-width: 720px) 100vw, 33vw",
        }),
      );
      return card;
    }),
  );
}

export function init() {
  jumpList();

  const stack = $("[data-brands-stack]");
  if (stack) stack.replaceChildren(...BRANDS.map(brandBlock));

  regionGrid();

  // A deep link like brands.html#aether-by-ultra should land with the brand
  // in view, not at the top of the jump list.
  if (window.location.hash) {
    const target = document.getElementById(window.location.hash.slice(1));
    if (target) {
      target.classList.add("is-targeted");
      // let layout settle before scrolling, or the sticky nav clips the title
      requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
    }
  }
}
