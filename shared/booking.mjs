/* ==========================================================================
   Ultra Hotel — booking contract
   Validation and pricing. Pure: no I/O, no DOM, no globals.

   The browser imports this to draw the live quote. The server imports the
   very same module to re-price every submission, so the number a guest
   watches and the number the API charges can never drift apart.

   All money is integer PHP centavos (see TERMS.currency). Dates are
   'YYYY-MM-DD' local date strings with no timezone attached - a hotel night
   is a calendar day, not an instant.
   ========================================================================== */

import { PROPERTIES, ROOM_TYPES, GROUP } from "./catalog.mjs";

/* Room types are now group-wide rather than one property's inventory, so the
   nightly rate is the property's floor rate plus the room type's increment. */
export const propertyBySlug = (slug) => PROPERTIES.find((p) => p.slug === slug) || null;
export const roomBySlug = (slug) => ROOM_TYPES.find((r) => r.slug === slug) || null;

/* --------------------------------------------------------------------------
   Terms
   -------------------------------------------------------------------------- */

export const TERMS = {
  /** Bookings open today and run two years forward. Rolling, not calendar-fixed. */
  maxLeadDays: 730,
  /* The bookable window is derived, never a frozen literal — every date input
     on the site bounds itself with these, so a stale value here would ship
     `max="undefined"` onto every form. */
  get windowStart() { return todayISO(); },
  get windowEnd() { return addDays(todayISO(), this.maxLeadDays); },
  minNights: 1,
  maxNights: 30,
  maxRooms: 6,
  maxGuestsPerRoom: 8,
  weekendUpliftBp: 1500, // basis points: +15% on Friday and Saturday nights
  extraAdultCents: 12000,
  extraChildCents: 5500,
  includedAdults: 2,
  includedChildren: 2,
  childAgeMax: 11,
  currency: "PHP",
  taxBp: 1200, // 12% service charge + local taxes, shown separately
  depositBp: 2000, // 20% deposit due at confirmation
};

/** Friday and Saturday nights carry the uplift. */
const WEEKEND_DAYS = new Set([5, 6]);

/* --------------------------------------------------------------------------
   Promo codes
   -------------------------------------------------------------------------- */

export const PROMOS = {
  CIRCLE10: {
    kind: "percent",
    value: 10,
    label: "10% off — Ultra Circle members",
    minNights: 1,
    note: "Ultra Circle member rate on any property, any room. Stacks with nothing, which is the point.",
  },
  RESORT15: {
    kind: "percent",
    value: 15,
    label: "15% off at Ultra Resorts",
    minNights: 2,
    brands: ["ultra-resorts"],
    note: "Ultra Resorts only, minimum two nights.",
  },
  AETHER20: {
    kind: "percent",
    value: 20,
    label: "20% off at Aether by Ultra",
    minNights: 1,
    brands: ["aether-by-ultra"],
    note: "Aether by Ultra properties only.",
  },
  SUITE30: {
    kind: "percent",
    value: 30,
    label: "30% off suites and villas",
    minNights: 2,
    roomSlugs: ["family-suite", "connecting-suites", "ultra-suite", "panorama-villa"],
    note: "Suites and villas only, minimum two nights.",
  },
  SUNSET5: {
    kind: "flat-per-night",
    value: 50,
    label: "PHP 50 off per night",
    minNights: 1,
    note: "Applies to any room. Valid Sunday to Thursday arrivals only.",
    arrivalDays: [0, 1, 2, 3, 4],
  },
  LONGSTAY: {
    kind: "flat-per-night",
    value: 60,
    label: "PHP 60 off per night on long stays",
    minNights: 7,
    note: "Seven nights or more. Applies automatically at seven nights.",
  },
  BUSINESS18: {
    kind: "percent",
    value: 18,
    label: "18% off a flexible business rate",
    minNights: 1,
    note: "Corporate and business travel only. Proof of company required at check-in.",
  },
};

/* --------------------------------------------------------------------------
   Date helpers — string-in, string-out, no Date object escapes the module
   -------------------------------------------------------------------------- */

export function parseDay(value) {
  if (typeof value !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  // reject impossible dates like 2026-02-31
  const probe = new Date(Date.UTC(y, mo - 1, d));
  if (probe.getUTCFullYear() !== y || probe.getUTCMonth() !== mo - 1 || probe.getUTCDate() !== d) {
    return null;
  }
  return { y, m: mo, d, dow: probe.getUTCDay() };
}

export function toDayString({ y, m, d }) {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function addDays(dayStr, n) {
  const p = parseDay(dayStr);
  if (!p) return null;
  const t = Date.UTC(p.y, p.m - 1, p.d) + n * 86400000;
  const dt = new Date(t);
  return toDayString({ y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() });
}

export function nightsBetween(checkIn, checkOut) {
  const a = parseDay(checkIn);
  const b = parseDay(checkOut);
  if (!a || !b) return 0;
  const ms = Date.UTC(b.y, b.m - 1, b.d) - Date.UTC(a.y, a.m - 1, a.d);
  return Math.round(ms / 86400000);
}

/** Every night actually slept, i.e. checkIn .. checkOut-1. */
export function nightList(checkIn, nights) {
  const out = [];
  for (let i = 0; i < nights; i += 1) {
    const day = addDays(checkIn, i);
    const p = parseDay(day);
    out.push({ date: day, dayOfWeek: p ? p.dow : 0, weekend: p ? WEEKEND_DAYS.has(p.dow) : false });
  }
  return out;
}

export const todayISO = () => {
  const d = new Date();
  return toDayString({ y: d.getFullYear(), m: d.getMonth() + 1, d: d.getDate() });
};

/** The bookable range: today through two years out. */
export function bookableWindow() {
  const start = todayISO();
  return { start, end: addDays(start, TERMS.maxLeadDays) };
}

/* --------------------------------------------------------------------------
   Validation
   -------------------------------------------------------------------------- */

const int = (v, fallback = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};

export function normalize(input = {}) {
  return {
    propertySlug: typeof input.propertySlug === "string" ? input.propertySlug.trim() : "",
    checkIn: typeof input.checkIn === "string" ? input.checkIn.trim() : "",
    checkOut: typeof input.checkOut === "string" ? input.checkOut.trim() : "",
    roomSlug: typeof input.roomSlug === "string" ? input.roomSlug.trim() : "",
    rooms: int(input.rooms, 1),
    adults: int(input.adults, 2),
    children: int(input.children, 0),
    childAges: Array.isArray(input.childAges) ? input.childAges.map((a) => int(a, 8)) : [],
    promo: typeof input.promo === "string" ? input.promo.trim().toUpperCase() : "",
  };
}

/**
 * Returns { ok, errors: {field: message}, value }.
 * Collects every problem rather than throwing on the first.
 */
export function validate(raw = {}) {
  const v = normalize(raw);
  const errors = {};

  const property = propertyBySlug(v.propertySlug);
  if (!v.propertySlug) errors.propertySlug = "Choose a property.";
  else if (!property) errors.propertySlug = "That property is not available.";

  const room = roomBySlug(v.roomSlug);
  if (!v.roomSlug) errors.roomSlug = "Choose a room.";
  else if (!room) errors.roomSlug = "That room is not available.";

  const win = bookableWindow();

  if (!parseDay(v.checkIn)) errors.checkIn = "Enter a valid arrival date.";
  if (!parseDay(v.checkOut)) errors.checkOut = "Enter a valid departure date.";

  if (!errors.checkIn && v.checkIn < win.start) {
    errors.checkIn = "Arrival cannot be in the past.";
  }
  if (!errors.checkIn && v.checkIn > win.end) {
    errors.checkIn = `Reservations open up to ${win.end}.`;
  }

  if (!errors.checkOut && v.checkOut > win.end) {
    errors.checkOut = "Departure must fall inside the bookable window.";
  }

  const nights = errors.checkIn || errors.checkOut ? 0 : nightsBetween(v.checkIn, v.checkOut);
  if (!errors.checkOut && !errors.checkIn) {
    if (nights < 1) errors.checkOut = "Departure must be after arrival.";
    else if (nights < TERMS.minNights) errors.checkOut = `Minimum stay is ${TERMS.minNights} night.`;
    else if (nights > TERMS.maxNights) errors.checkOut = `Maximum stay is ${TERMS.maxNights} nights.`;
  }

  if (v.rooms < 1) errors.rooms = "At least one room.";
  else if (v.rooms > TERMS.maxRooms) errors.rooms = `Maximum ${TERMS.maxRooms} rooms per booking.`;

  if (v.adults < 1) errors.adults = "At least one adult.";
  if (v.children < 0) errors.children = "Children cannot be negative.";

  if (room) {
    const perRoom = v.rooms;
    const capacity = room.maxGuests * perRoom;
    if (v.adults + v.children > capacity) {
      errors.adults =
        `${room.name} sleeps ${perRoom === 1 ? room.maxGuests : room.maxGuests * perRoom} guests. ` +
        "Add a villa, or book a connecting room.";
    }
  }

  let promo = null;
  if (v.promo) {
    promo = PROMOS[v.promo] || null;
    if (!promo) {
      errors.promo = "That promo code is not recognised.";
    } else if (!errors.checkIn && !errors.checkOut && nights >= 0) {
      // Run the same constraint check the pricer will run, so the form's live
      // validation can never disagree with the quote.
      const pc = checkPromo(v.promo, {
        nights,
        room,
        property,
        arrivalDay: parseDay(v.checkIn)?.dow,
      });
      if (!pc.ok) errors.promo = pc.message;
    }
  }

  return { ok: Object.keys(errors).length === 0, errors, value: v, property, room, promo, nights };
}

/** Re-check a promo against a specific stay; returns { ok, message }. */
export function checkPromo(promoCode, { nights, room, property, arrivalDay }) {
  if (!promoCode) return { ok: true };
  const promo = PROMOS[promoCode];
  if (!promo) return { ok: false, message: "That promo code is not recognised." };
  if (nights < promo.minNights) {
    return { ok: false, message: `${promo.label} requires a minimum of ${promo.minNights} nights.` };
  }
  if (promo.brands && property && !promo.brands.includes(property.brand)) {
    const allowed = promo.brands
      .map((b) => (b === "aether-by-ultra" ? "Aether by Ultra" : "Ultra Resorts"))
      .join(" or ");
    return { ok: false, message: `${promo.label} applies to ${allowed} only.` };
  }
  if (promo.roomSlugs && room && !promo.roomSlugs.includes(room.slug)) {
    return { ok: false, message: `${promo.label} applies to suites and villas only.` };
  }
  if (promo.arrivalDays && arrivalDay != null && !promo.arrivalDays.includes(arrivalDay)) {
    return { ok: false, message: `${promo.label} requires arrival Sunday to Thursday.` };
  }
  return { ok: true, promo };
}

/* --------------------------------------------------------------------------
   Pricing
   -------------------------------------------------------------------------- */

/**
 * Price a stay night by night.
 * Returns a full breakdown — the guest sees the same line items the server
 * computed, in the same order, with the same integers.
 */
export function quote(raw = {}) {
  const v = normalize(raw);
  const property = propertyBySlug(v.propertySlug);
  const room = roomBySlug(v.roomSlug);

  const result = {
    ok: false,
    errors: {},
    nights: 0,
    property: property
      ? {
          slug: property.slug,
          name: property.name,
          city: property.city,
          country: property.country,
          brand: property.brand,
        }
      : null,
    room: room ? { slug: room.slug, name: room.name, sqm: room.sqm, view: room.view, maxGuests: room.maxGuests } : null,
    nightlyCents: 0,
    lines: [],
    baseCents: 0,
    upliftCents: 0,
    extrasCents: 0,
    subtotalCents: 0,
  };

  if (!property) {
    result.errors.propertySlug = v.propertySlug
      ? "That property is not available."
      : "Choose a property.";
  }
  if (!room) {
    result.errors.roomSlug = v.roomSlug ? "That room is not available." : "Choose a room.";
  }

  const win = bookableWindow();
  const inDay = parseDay(v.checkIn);
  const outDay = parseDay(v.checkOut);
  if (!inDay) result.errors.checkIn = "Enter a valid arrival date.";
  if (!outDay) result.errors.checkOut = "Enter a valid departure date.";

  const nights = inDay && outDay ? nightsBetween(v.checkIn, v.checkOut) : 0;
  result.nights = nights;

  if (inDay && outDay) {
    if (nights < TERMS.minNights) result.errors.checkOut = `Minimum stay is ${TERMS.minNights} night.`;
    if (v.checkIn < win.start || v.checkOut > win.end) {
      result.errors.checkIn = "Those dates fall outside the bookable window.";
    }
  }

  if (v.rooms < 1 || v.rooms > TERMS.maxRooms) result.errors.rooms = `Choose between 1 and ${TERMS.maxRooms} rooms.`;

  if (room) {
    const capacity = room.maxGuests * v.rooms;
    if (v.adults + v.children > capacity) {
      result.errors.adults = `${room.name} sleeps ${capacity} guests at this room count.`;
    }
  }

  if (Object.keys(result.errors).length > 0) return result;

  /* --- night by night ------------------------------------------------- */

  // The property sets the floor rate; the room type adds to it.
  const base = (property.fromCents + room.fromCents) || property.fromCents;
  result.nightlyCents = base;
  const list = nightList(v.checkIn, nights);
  const roomNights = v.rooms;

  for (const n of list) {
    const rate = base * roomNights;
    result.baseCents += rate;
    result.lines.push({
      kind: "night",
      date: n.date,
      weekend: n.weekend,
      rateCents: rate,
      upliftCents: 0,
    });
  }

  // apply the weekend uplift after the fact, so each night is itemised
  for (const line of result.lines) {
    if (line.weekend) {
      line.upliftCents = Math.round((line.rateCents * TERMS.weekendUpliftBp) / 10000);
      result.upliftCents += line.upliftCents;
    }
  }

  result.subtotalCents = result.baseCents + result.upliftCents;

  /* --- extra guests --------------------------------------------------- */

  const includedAdults = TERMS.includedAdults * roomNights;
  const includedChildren = TERMS.includedChildren * roomNights;
  const extraAdults = Math.max(0, v.adults - includedAdults);
  const extraChildren = Math.max(
    0,
    v.children - includedChildren,
  );

  if (extraAdults > 0) {
    const cents = extraAdults * TERMS.extraAdultCents * nights;
    result.extrasCents += cents;
    result.lines.push({
      kind: "extraAdult",
      label: `Additional adult × ${extraAdults}`,
      detail: `PHP 120 per adult, per night`,
      qty: extraAdults,
      nights,
      rateCents: TERMS.extraAdultCents,
      upliftCents: 0,
      extraCents: cents,
    });
  }

  if (extraChildren > 0) {
    const cents = extraChildren * TERMS.extraChildCents * nights;
    result.extrasCents += cents;
    result.lines.push({
      kind: "extraChild",
      label: `Additional child under 12 × ${extraChildren}`,
      detail: `PHP 55 per child, per night`,
      qty: extraChildren,
      nights,
      rateCents: TERMS.extraChildCents,
      upliftCents: 0,
      extraCents: cents,
    });
  }

  result.subtotalCents += result.extrasCents;

  /* --- promo ---------------------------------------------------------- */

  const promoCheck = checkPromo(v.promo, { nights, room, property, arrivalDay: inDay.dow });
  result.promo = promoCheck.promo || null;

  if (v.promo && !promoCheck.ok) {
    result.errors.promo = promoCheck.message;
    return result;
  }

  let discountCents = 0;
  const promo = promoCheck.promo;
  if (promo) {
    if (promo.kind === "percent") {
      discountCents = Math.round((result.subtotalCents * promo.value) / 100);
    } else {
      discountCents = promo.value * 100 * nights * roomNights;
    }
    discountCents = Math.min(discountCents, result.subtotalCents);
    result.lines.push({
      kind: "promo",
      label: promo.label,
      detail: promo.note,
      promoCode: v.promo,
      rateCents: 0,
      upliftCents: 0,
      extraCents: -discountCents,
    });
  }
  result.discountCents = discountCents;

  result.totalCents = Math.max(0, result.subtotalCents - discountCents);
  result.taxCents = Math.round((result.totalCents * TERMS.taxBp) / 10000);
  result.grandTotalCents = result.totalCents + result.taxCents;
  result.depositCents = Math.round((result.grandTotalCents * TERMS.depositBp) / 10000);
  result.balanceCents = result.grandTotalCents - result.depositCents;

  result.currency = TERMS.currency;
  result.arrival = v.checkIn;
  result.departure = v.checkOut;
  result.guests = { adults: v.adults, children: v.children, rooms: roomNights };
  result.promoCode = promo ? v.promo : "";
  result.terms = {
    checkInFrom: win.start,
    checkOutBy: win.end,
    minNights: TERMS.minNights,
  };
  result.group = { name: GROUP.name, promise: GROUP.promise };

  result.ok = true;
  return result;
}

/* --------------------------------------------------------------------------
   Display helpers — the one place cents become a string

   The symbol is looked up per currency rather than hardcoded to "$", so
   switching TERMS.currency changes every rendered price at once.
   -------------------------------------------------------------------------- */

const CURRENCY_SYMBOL = {
  PHP: "₱",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SGD: "S$",
  AED: "د.إ",
  JPY: "¥",
};

const symbolFor = (code) => CURRENCY_SYMBOL[code] ?? "";

export function money(cents, { withCode = false } = {}) {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(Math.round(cents));
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${symbolFor(TERMS.currency)}${grouped}.${frac}${withCode ? ` ${TERMS.currency}` : ""}`;
}

export const moneyShort = (cents) =>
  `${symbolFor(TERMS.currency)}${Math.round(cents / 100).toLocaleString("en-US")}`;

/* --------------------------------------------------------------------------
   Confirmation codes — 8 chars from an alphabet with no I/O/0/1, so a code
   survives being read back over the phone.
   -------------------------------------------------------------------------- */

const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function randomCode(len = 8) {
  const bytes = new Uint8Array(len);
  globalThis.crypto.getRandomValues(bytes);
  let out = "";
  for (let i = 0; i < len; i += 1) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

export function formatCode(raw) {
  if (typeof raw !== "string") return null;
  // Accept the code exactly as it is issued to the guest (UH-4K7P-2M9Q) as
  // well as the bare 8 characters, so looking a booking up by the number on
  // the confirmation works without the caller having to know the format.
  const upper = raw.toUpperCase();
  const cleaned = upper.replace(/^UH[- ]*/, "").replace(/[^0-9A-Z]/g, "");
  if (cleaned.length !== 8) return null;
  if ([...cleaned].some((ch) => !ALPHABET.includes(ch))) return null;
  return `UH-${cleaned.slice(0, 4)}-${cleaned.slice(4)}`;
}

export const stripCode = (raw) => (typeof raw === "string" ? raw.toUpperCase().replace(/^UH[- ]*/, "").replace(/[^0-9A-Z]/g, "") : "");
