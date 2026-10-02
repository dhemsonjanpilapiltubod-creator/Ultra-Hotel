/* ==========================================================================
   Ultra Hotel — HTTP server
   Static files plus a small JSON API. No framework, no dependencies.

   Routes
     GET  /api/health
     GET  /api/catalog
      GET  /api/quote?property=&checkIn=&checkOut=&room=&adults=&children=&rooms=&promo=
     POST /api/bookings
     GET  /api/bookings/:code
     GET  /api/bookings?email=
     POST /api/newsletter
     POST /api/enquiries
     POST /api/dining-reservations
     POST /api/spa-appointments
     POST /api/proposals
   ========================================================================== */

import http from "node:http";
import { createReadStream } from "node:fs";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createStore } from "./store.mjs";
import { quote, formatCode, stripCode, money, TERMS, PROMOS, bookableWindow } from "../shared/booking.mjs";
import {
  GROUP, BRANDS, REGIONS, PROPERTIES, ROOM_TYPES, DINING, TIERS, propertyBySlug, diningBySlug,
} from "../shared/catalog.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUBLIC = path.join(ROOT, "public");
const SHARED = path.join(ROOT, "shared");
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".txt": "text/plain; charset=utf-8",
  ".pdf": "application/pdf",
  ".webmanifest": "application/manifest+json",
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

const send = (res, status, body, headers = {}) => {
  const payload = typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    ...headers,
  });
  res.end(payload);
};

const json = (res, status, data, headers) => send(res, status, data, headers);

async function readBody(req, limitBytes = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limitBytes) {
      const err = new Error("payload too large");
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  const text = Buffer.concat(chunks).toString("utf8");
  const type = req.headers["content-type"] || "";
  if (type.includes("application/json")) {
    try {
      return JSON.parse(text);
    } catch {
      const err = new Error("body is not valid JSON");
      err.status = 400;
      throw err;
    }
  }
  if (type.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(text));
  }
  return {};
}

/* --- rate limiting: in-memory per-IP, resets on restart --------------- */

const WINDOW_MS = 60_000;
const buckets = new Map();

function rateLimit(req, { max = 30, windowMs = WINDOW_MS } = {}) {
  const ip = req.socket.remoteAddress || "unknown";
  // Bucket per endpoint, not per IP. A single IP-only counter meant a guest
  // filling in the contact form then the dining form then the newsletter was
  // throttled by the *sum* of all three limits, and the tightest limit won.
  const route = String(req.url || "/").split("?")[0];
  const key = `${ip}|${route}`;
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now - bucket.start > windowMs) {
    bucket = { start: now, count: 0 };
    buckets.set(key, bucket);
  }
  bucket.count += 1;

  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (now - v.start > windowMs) buckets.delete(k);
  }

  const remaining = Math.max(0, max - bucket.count);
  return {
    ok: bucket.count <= max,
    headers: {
      "x-ratelimit-limit": String(max),
      "x-ratelimit-remaining": String(remaining),
      "x-ratelimit-reset": String(Math.ceil((bucket.start + windowMs) / 1000)),
    },
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function requireEmail(body) {
  const email = String(body.email || "").trim();
  if (!EMAIL_RE.test(email)) {
    const err = new Error("A valid email address is required.");
    err.status = 422;
    throw err;
  }
  return email;
}

function requireText(body, field, { max = 200, min = 2 } = {}) {
  const value = String(body[field] || "").trim();
  if (value.length < min) {
    const err = new Error(`Please provide ${field.replace(/[A-Z]/g, (c) => ` ${c.toLowerCase()}`)}.`);
    err.status = 422;
    throw err;
  }
  if (value.length > max) {
    const err = new Error(`${field} is too long.`);
    err.status = 422;
    throw err;
  }
  return value;
}

/** Optional form fields worth keeping, so a brief is never silently trimmed. */
function extras(body, keys) {
  const out = {};
  for (const key of keys) {
    const value = body[key];
    if (value != null && value !== "" && value !== false) out[key] = value;
  }
  return out;
}

/* --------------------------------------------------------------------------
   Static files
   -------------------------------------------------------------------------- */

const PAGES = new Set([
  "index.html", "book.html", "hotels.html", "brands.html", "ultra-circle.html",
  "dining.html", "business.html", "events.html", "weddings.html", "about.html",
  "app.html", "gallery.html", "404.html",
]);

/** Read once at boot so a miss does not hit the disk on every request. */
let notFoundBody = null;
try {
  notFoundBody = await readFile(path.join(PUBLIC, "404.html"));
} catch {
  console.warn("[ultra] public/404.html is missing — unknown URLs will return JSON");
}

async function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  // A trailing slash means the directory, and the only directory that has an
  // index is the site root. Appending index.html to /book/ asked for
  // public/book/index.html, which does not exist, so every trailing-slash URL
  // 404'd while /book worked.
  rel = rel.replace(/\/+$/, "") || "/";
  if (rel === "/") rel = "/index.html";

  // /shared/*.mjs is served too, so the browser and the server import one copy.
  // The base already points at /shared, so the prefix is stripped from the
  // path before joining — otherwise it gets doubled into shared/shared/.
  const fromShared = rel.startsWith("/shared/");
  const base = fromShared ? SHARED : PUBLIC;
  const relForFs = fromShared ? rel.slice("/shared".length) : rel;
  let target = path.join(base, relForFs);

  // extensionless → the matching page
  if (!path.extname(target) && PAGES.has(`${rel.replace(/^\//, "")}.html`)) {
    target = `${target}.html`;
  }

  // path traversal guard. A plain startsWith(base) is a prefix test, not a
  // path test: /../publicity/secret.txt normalises to public\\..\\publicity and
  // still starts with public. Compare against base + separator instead.
  const normalized = path.normalize(target);
  if (normalized !== base && !normalized.startsWith(base + path.sep)) {
    return send(res, 403, { error: "Forbidden" });
  }

  try {
    const info = await stat(normalized);
    if (info.isDirectory()) {
      return serveStatic(req, res, `${rel}/index.html`);
    }

    const ext = path.extname(normalized).toLowerCase();
    const etag = `W/"${info.size}-${Number(info.mtimeMs).toString(36)}"`;

    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304, { etag });
      return res.end();
    }

    // Shared modules change with the code; hashed assets would not.
    const cache = fromShared || ext === ".html"
      ? "no-cache"
      : "public, max-age=3600, stale-while-revalidate=86400";

    res.writeHead(200, {
      "content-type": MIME[ext] || "application/octet-stream",
      "content-length": info.size,
      "cache-control": cache,
      etag,
      "x-content-type-options": "nosniff",
    });

    if (req.method === "HEAD") return res.end();
    createReadStream(normalized).pipe(res);
  } catch {
    // The 404 page is read once at boot. Doing it here meant a synchronous
    // read inside a dynamic import on every miss.
    //
    // Assets get a bare 404 instead. Handing a stylesheet or script request the
    // HTML page meant <link> and <script type=module> were served markup they
    // cannot parse — a syntax error in the console for a missing file, which
    // reads nothing like the real problem.
    const ext = path.extname(rel).toLowerCase();
    const wantsHtml = (req.headers.accept || "").includes("text/html");
    if (notFoundBody && (ext === ".html" || ext === "" || wantsHtml)) {
      res.writeHead(404, {
        "content-type": MIME[".html"],
        "content-length": notFoundBody.length,
        "cache-control": "no-store",
        "x-content-type-options": "nosniff",
      });
      return res.end(req.method === "HEAD" ? undefined : notFoundBody);
    }
    return send(res, 404, { error: "Not found" });
  }
}

/* --------------------------------------------------------------------------
   API
   -------------------------------------------------------------------------- */

async function handleApi(req, res, url, store) {
  const { pathname, searchParams } = url;
  const method = req.method;

  /* -- health ---------------------------------------------------------- */
  if (pathname === "/api/health" && method === "GET") {
    const win = bookableWindow();
    return json(res, 200, {
      ok: true,
      service: "ultra-hotel-group",
      store: store.kind,
      node: process.version,
      bookable: { from: win.start, to: win.end, minNights: TERMS.minNights },
    });
  }

  /* -- catalogue -------------------------------------------------------- */
  if (pathname === "/api/catalog" && method === "GET") {
    return json(res, 200, {
      group: GROUP,
      brands: BRANDS.map((b) => ({ slug: b.slug, name: b.name, kicker: b.kicker, rooms: b.rooms })),
      regions: REGIONS.map((r) => ({ id: r.id, name: r.name, note: r.note })),
      roomTypes: ROOM_TYPES.map((r) => ({
        slug: r.slug, name: r.name, sqm: r.sqm, view: r.view,
        bed: r.bed, maxGuests: r.maxGuests, fromCents: r.fromCents,
      })),
      properties: PROPERTIES.map((p) => ({
        slug: p.slug, name: p.name, brand: p.brand, region: p.region,
        city: p.city, country: p.country, star: p.star, rooms: p.rooms,
        fromCents: p.fromCents, tags: p.tags,
      })),
      dining: DINING.map((d) => ({
        slug: d.slug, name: d.name, property: d.property,
        group: d.group, hours: d.hours, reserve: d.reserve,
      })),
      tiers: TIERS.map((t) => ({ slug: t.slug, name: t.name, threshold: t.threshold })),
      terms: TERMS,
      promos: PROMOS,
    }, { "cache-control": "public, max-age=300" });
  }

  /* -- quote ------------------------------------------------------------ */
  if (pathname === "/api/quote" && method === "GET") {
    const result = quote({
      propertySlug: searchParams.get("property"),
      checkIn: searchParams.get("checkIn"),
      checkOut: searchParams.get("checkOut"),
      roomSlug: searchParams.get("room"),
      adults: searchParams.get("adults"),
      children: searchParams.get("children"),
      rooms: searchParams.get("rooms"),
      promo: searchParams.get("promo"),
    });
    if (!result.ok) return json(res, 422, { ok: false, errors: result.errors, quote: null });
    return json(res, 200, {
      ok: true,
      quote: {
        nights: result.nights,
        property: result.property,
        room: result.room,
        nightlyCents: result.nightlyCents,
        totalCents: result.totalCents,
        taxCents: result.taxCents,
        grandTotalCents: result.grandTotalCents,
        depositCents: result.depositCents,
        formatted: {
          nightly: money(result.nightlyCents),
          total: money(result.totalCents, { withCode: true }),
          grandTotal: money(result.grandTotalCents, { withCode: true }),
          deposit: money(result.depositCents, { withCode: true }),
        },
        lines: result.lines,
      },
    });
  }

  /* -- bookings --------------------------------------------------------- */
  if (pathname === "/api/bookings" && method === "POST") {
    const limit = rateLimit(req, { max: 12 });
    if (!limit.ok) return send(res, 429, { error: "Too many requests — please wait a minute." }, limit.headers);

    const body = await readBody(req);
    const email = requireEmail(body);
    const fullName = requireText(body, "fullName", { max: 120 });
    const phone = String(body.phone || "").trim().slice(0, 40);

    // never trust a total from the client: re-price from the catalogue
    const priced = quote({
      propertySlug: body.property,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      roomSlug: body.room,
      adults: body.adults,
      children: body.children,
      rooms: body.rooms,
      promo: body.promo,
    });

    if (!priced.ok) {
      return json(res, 422, { ok: false, errors: priced.errors, error: "Please check your dates and room." });
    }

    const saved = await store.createReservation({
      email, fullName, phone,
      propertySlug: priced.property.slug,
      propertyName: priced.property.name,
      roomSlug: priced.room.slug,
      roomName: priced.room.name,
      checkIn: priced.arrival,
      checkOut: priced.departure,
      nights: priced.nights,
      adults: priced.guests.adults,
      children: priced.guests.children,
      rooms: priced.guests.rooms,
      promoCode: priced.promoCode || null,
      totalCents: priced.totalCents,
      taxCents: priced.taxCents,
      grandCents: priced.grandTotalCents,
      depositCents: priced.depositCents,
    });

    return json(res, 201, {
      ok: true,
      confirmation: formatCode(saved.code),
      reservation: {
        propertyName: saved.propertyName,
        roomName: saved.roomName,
        checkIn: saved.checkIn,
        checkOut: saved.checkOut,
        nights: saved.nights,
        email: saved.email,
        grandTotalCents: saved.grandCents,
        depositCents: saved.depositCents,
      },
      email: { queued: 0, to: saved.email },
    }, limit.headers);
  }

  if (pathname === "/api/bookings" && method === "GET") {
    const email = searchParams.get("email");
    if (!email) return json(res, 400, { error: "Provide an email address." });
    if (!EMAIL_RE.test(email)) return json(res, 422, { error: "That email address is not valid." });
    const rows = await store.listByEmail(email);
    return json(res, 200, {
      ok: true,
      reservations: rows.map((r) => ({
        confirmation: formatCode(r.code),
        propertyName: r.property_name ?? r.propertyName ?? null,
        roomName: r.room_name ?? r.roomName,
        checkIn: r.check_in ?? r.checkIn,
        checkOut: r.check_out ?? r.checkOut,
        nights: r.nights,
        adults: r.adults,
        children: r.children,
        rooms: r.rooms_count ?? r.rooms,
        grandTotalCents: r.grand_cents ?? r.grandCents,
        status: r.status,
        createdAt: r.created_at ?? r.createdAt,
      })),
    });
  }

  const bookingByCode = /^\/api\/bookings\/([A-Za-z0-9-]+)$/.exec(pathname);
  if (bookingByCode && method === "GET") {
    const formatted = formatCode(bookingByCode[1]) || formatCode(stripCode(bookingByCode[1]));
    if (!formatted) return json(res, 400, { error: "That confirmation code is not valid." });
    const row = await store.getByCode(stripCode(formatted));
    if (!row) return json(res, 404, { error: "We could not find a reservation with that code." });
    return json(res, 200, {
      ok: true,
      reservation: {
        confirmation: formatted,
        propertyName: row.property_name ?? row.propertyName ?? null,
        roomName: row.room_name ?? row.roomName,
        checkIn: row.check_in ?? row.checkIn,
        checkOut: row.check_out ?? row.checkOut,
        nights: row.nights,
        adults: row.adults,
        children: row.children,
        rooms: row.rooms_count ?? row.rooms,
        promoCode: row.promo_code ?? row.promoCode,
        grandTotalCents: row.grand_cents ?? row.grandCents,
        depositCents: row.deposit_cents ?? row.depositCents,
        status: row.status,
      },
    });
  }

  /* -- newsletter -------------------------------------------------------- */
  if (pathname === "/api/newsletter" && method === "POST") {
    const limit = rateLimit(req, { max: 8 });
    if (!limit.ok) return send(res, 429, { error: "Too many requests." }, limit.headers);
    const body = await readBody(req);
    const email = requireEmail(body);
    await store.subscribe(email);
    return json(res, 201, { ok: true, email: { queued: 1, to: email } }, limit.headers);
  }

  /* -- the three enquiry forms ------------------------------------------ */

  const ENQUIRY_ROUTES = {
    "/api/enquiries": "contact",
    "/api/dining-reservations": "reservation",
    "/api/spa-appointments": "spa",
    "/api/proposals": "proposal",
  };

  const kind = ENQUIRY_ROUTES[pathname];
  if (kind && method === "POST") {
    const limit = rateLimit(req, { max: 10 });
    if (!limit.ok) return send(res, 429, { error: "Too many requests — please wait a minute." }, limit.headers);

    const body = await readBody(req);
    const email = requireEmail(body);
    const name = requireText(body, "name", { max: 120 });

    // route-specific sanity checks
    if (kind === "reservation") {
      const venue = diningBySlug(String(body.venue || ""));
      const venueName = venue ? venue.name : requireText(body, "venue", { max: 80 });
      const when = requireText(body, "date", { max: 40 });
      if (!/^\d{4}-\d{2}-\d{2}/.test(when)) {
        const err = new Error("Please choose a date for your table.");
        err.status = 422;
        throw err;
      }
      await store.recordEnquiry("dining-reservation", { name, email, venue: venueName, date: when, party: body.party, notes: body.notes });
    } else if (kind === "spa") {
      const property = propertyBySlug(String(body.property || ""));
      const propertyName = property ? property.name : requireText(body, "property", { max: 80 });
      const treatment = requireText(body, "treatment", { max: 80 });
      const date = requireText(body, "date", { max: 40 });
      if (!/^\d{4}-\d{2}-\d{2}/.test(date)) {
        const err = new Error("Please choose a date for your treatment.");
        err.status = 422;
        throw err;
      }
      await store.recordEnquiry("spa-appointment", { name, email, property: propertyName, treatment, date, time: body.time, guests: body.guests, notes: body.notes });
    } else if (kind === "proposal") {
      const eventType = requireText(body, "eventType", { max: 60 });
      const date = requireText(body, "date", { max: 40 });
      const guests = Number(body.guests);
      // weddings and group events across a 112-property group
      if (!Number.isFinite(guests) || guests < 1 || guests > 3000) {
        const err = new Error("Please give us a guest count between 1 and 3000.");
        err.status = 422;
        throw err;
      }
      const property = propertyBySlug(String(body.property || ""));
      await store.recordEnquiry("proposal-request", {
        name, email, eventType, date, guests,
        property: property ? property.name : body.property,
        venue: body.venue, notes: body.notes,
        // the brief also captures these, so keep them rather than dropping them
        ...extras(body, ["company", "phone", "region", "endDate", "package", "rooms", "consent"]),
      });
    } else {
      const topic = requireText(body, "topic", { max: 80 });
      const message = requireText(body, "message", { min: 10, max: 4000 });
      await store.recordEnquiry("contact", {
        name, email, topic, message, phone: body.phone,
        ...extras(body, ["company", "region", "volume", "country", "statusMatch", "consent"]),
      });
    }

    return json(res, 201, {
      ok: true,
      reference: `UH-Q${String(Date.now()).slice(-6)}`,
      email: { queued: 1, to: email },
    }, limit.headers);
  }

  return json(res, 404, { error: "Unknown API route" });
}

/* --------------------------------------------------------------------------
   Server
   -------------------------------------------------------------------------- */

const store = await createStore();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || `${HOST}:${PORT}`}`);

  res.setHeader("referrer-policy", "strict-origin-when-cross-origin");
  res.setHeader("x-frame-options", "SAMEORIGIN");

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "GET,HEAD,POST,OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    });
    return res.end();
  }

  try {
    if (url.pathname.startsWith("/api/")) {
      return await handleApi(req, res, url, store);
    }
    if (req.method === "GET" || req.method === "HEAD") {
      return await serveStatic(req, res, url.pathname);
    }
    return json(res, 405, { error: "Method not allowed" }, { allow: "GET, HEAD, POST" });
  } catch (err) {
    const status = err.status || 500;
    if (status >= 500) console.error("[ultra]", req.method, url.pathname, err);
    return json(res, status, { error: err.message || "Something went wrong" });
  }
});

server.listen(PORT, HOST, () => {
  const win = bookableWindow();
  console.log("  Ultra Hotel Group | " + GROUP.promise);
  console.log("  front end + booking API   http://" + `${HOST}:${PORT}`);
  console.log("  collection                " + GROUP.properties + " hotels, " + GROUP.destinations + " destinations, " + BRANDS.length + " brands");
  console.log("  store                     " + store.kind + " (" + store.file + ")");
  console.log("  bookable                  " + win.start + " to " + win.end + ", min " + TERMS.minNights + " night");
});

const shutdown = () => {
  server.close(() => {
    store.close();
    process.exit(0);
  });
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

export { server, store };
