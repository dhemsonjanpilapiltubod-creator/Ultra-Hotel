/* ==========================================================================
   Ultra Hotel — reservation store
   Reservations and enquiries go to SQLite via the built-in node:sqlite module.
   If that is unavailable the store falls back to a JSON file with identical
   behaviour. The repository interface below is the seam: swap the factory for
   a Postgres/Prisma implementation with the same four methods and the HTTP
   layer never changes.
   ========================================================================== */

import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { randomCode } from "../shared/booking.mjs";

const DATA_DIR = path.join(process.cwd(), "data");

/* --------------------------------------------------------------------------
   SQLite
   -------------------------------------------------------------------------- */

async function createSqliteStore(file) {
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(file);

  db.exec(`
    CREATE TABLE IF NOT EXISTS reservations (
      code            TEXT PRIMARY KEY,
      email           TEXT NOT NULL,
      full_name       TEXT NOT NULL,
      phone           TEXT,
      property_slug   TEXT,
      property_name   TEXT,
      room_slug       TEXT NOT NULL,
      room_name       TEXT NOT NULL,
      check_in        TEXT NOT NULL,
      check_out       TEXT NOT NULL,
      nights          INTEGER NOT NULL,
      adults          INTEGER NOT NULL,
      children        INTEGER NOT NULL,
      rooms_count     INTEGER NOT NULL,
      promo_code      TEXT,
      total_cents     INTEGER NOT NULL,
      tax_cents       INTEGER NOT NULL,
      grand_cents     INTEGER NOT NULL,
      deposit_cents   INTEGER NOT NULL,
      status          TEXT NOT NULL DEFAULT 'confirmed',
      created_at      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_res_email ON reservations(email);
    CREATE TABLE IF NOT EXISTS enquiries (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      kind         TEXT NOT NULL,
      payload      TEXT NOT NULL,
      created_at   TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subscribers (
      email       TEXT PRIMARY KEY,
      created_at  TEXT NOT NULL
    );
  `);

  // Additive migrations. `CREATE TABLE IF NOT EXISTS` leaves an existing table
  // alone, so a database written by an earlier version needs its new columns
  // added explicitly — otherwise the INSERT below fails on an old file.
  //
  // Indexes on the new columns are created *after* the ALTERs. They cannot live
  // in the exec() block above: against a pre-existing table the CREATE TABLE is
  // a no-op, so the index would try to build on a column that does not exist
  // yet and abort the whole batch.
  const columns = new Set(db.prepare(`PRAGMA table_info(reservations)`).all().map((c) => c.name));
  let migrated = false;
  for (const [name, type] of [["property_slug", "TEXT"], ["property_name", "TEXT"]]) {
    if (!columns.has(name)) {
      db.exec(`ALTER TABLE reservations ADD COLUMN ${name} ${type}`);
      migrated = true;
      console.log(`[store] migrated reservations.${name}`);
    }
  }
  if (columns.has("property_slug")) {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_res_property ON reservations(property_slug)`);
  }
  if (migrated) {
    // older rows predate the property columns; backfill from the room name so
    // "my bookings" lists are not blank for anything booked before the rewrite
    db.exec(`UPDATE reservations SET property_name = COALESCE(property_name, room_name) WHERE property_name IS NULL`);
  }

  const insert = db.prepare(`
    INSERT INTO reservations
      (code,email,full_name,phone,property_slug,property_name,room_slug,room_name,
       check_in,check_out,nights,adults,children,rooms_count,promo_code,total_cents,
       tax_cents,grand_cents,deposit_cents,status,created_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
  `);

  const findByCode = db.prepare(`SELECT * FROM reservations WHERE code = ?`);
  const findByEmail = db.prepare(`SELECT * FROM reservations WHERE email = ? ORDER BY created_at DESC`);
  const allCodes = db.prepare(`SELECT code FROM reservations`);

  return {
    kind: "sqlite",
    file,

    async createReservation(row) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const code = randomCode(8);
        try {
          insert.run(
            code, row.email, row.fullName, row.phone || null,
            row.propertySlug || null, row.propertyName || null,
            row.roomSlug, row.roomName,
            row.checkIn, row.checkOut, row.nights, row.adults, row.children, row.rooms,
            row.promoCode || null, row.totalCents, row.taxCents, row.grandCents,
            row.depositCents, "confirmed", new Date().toISOString(),
          );
          return { code, ...row, status: "confirmed", createdAt: new Date().toISOString() };
        } catch (err) {
          // unique violation → re-roll against the real table
          if (attempt === 11 || !/UNIQUE|PRIMARY/i.test(String(err && err.message))) throw err;
        }
      }
      throw new Error("could not allocate a confirmation code");
    },

    async getByCode(code) {
      return findByCode.get(code) || null;
    },

    async listByEmail(email) {
      return findByEmail.all(email);
    },

    async recordEnquiry(kind, payload) {
      db.prepare(`INSERT INTO enquiries (kind, payload, created_at) VALUES (?,?,?)`)
        .run(kind, JSON.stringify(payload), new Date().toISOString());
    },

    async subscribe(email) {
      db.prepare(`INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?,?)`)
        .run(email.toLowerCase(), new Date().toISOString());
    },

    async codes() {
      return allCodes.all().map((r) => r.code);
    },

    close() {
      try { db.close(); } catch { /* already closed */ }
    },
  };
}

/* --------------------------------------------------------------------------
   JSON fallback
   -------------------------------------------------------------------------- */

async function createJsonStore(file) {
  const state = { reservations: [], enquiries: [], subscribers: [] };

  const flush = async () => {
    const tmp = `${file}.tmp`;
    await writeFile(tmp, JSON.stringify(state, null, 2), "utf8");
    await rename(tmp, file);
  };

  if (existsSync(file)) {
    try {
      Object.assign(state, JSON.parse(await readFile(file, "utf8")));
    } catch {
      // a corrupt store should not stop the site serving; start clean
      Object.assign(state, { reservations: [], enquiries: [], subscribers: [] });
    }
  }
  state.reservations ||= [];
  state.enquiries ||= [];
  state.subscribers ||= [];

  return {
    kind: "json",
    file,

    async createReservation(row) {
      const taken = new Set(state.reservations.map((r) => r.code));
      let code = randomCode(8);
      for (let attempt = 0; taken.has(code) && attempt < 12; attempt += 1) code = randomCode(8);
      if (taken.has(code)) throw new Error("could not allocate a confirmation code");

      const saved = { code, ...row, status: "confirmed", createdAt: new Date().toISOString() };
      state.reservations.push(saved);
      await flush();
      return saved;
    },

    async getByCode(code) {
      return state.reservations.find((r) => r.code === code) || null;
    },

    async listByEmail(email) {
      const key = String(email).toLowerCase();
      return state.reservations.filter((r) => String(r.email).toLowerCase() === key);
    },

    async recordEnquiry(kind, payload) {
      state.enquiries.push({ id: state.enquiries.length + 1, kind, payload, createdAt: new Date().toISOString() });
      await flush();
    },

    async subscribe(email) {
      const key = email.toLowerCase();
      if (!state.subscribers.some((s) => s.email === key)) {
        state.subscribers.push({ email: key, createdAt: new Date().toISOString() });
        await flush();
      }
    },

    async codes() {
      return state.reservations.map((r) => r.code);
    },

    close() {},
  };
}

/* --------------------------------------------------------------------------
   Factory
   -------------------------------------------------------------------------- */

export async function createStore({ file = path.join(DATA_DIR, "reservations.db") } = {}) {
  await mkdir(path.dirname(file), { recursive: true });
  try {
    return await createSqliteStore(file);
  } catch (err) {
    // Degrading to JSON still serves the site, but it must never be silent —
    // a quiet fallback here hides a broken schema behind a working-looking
    // process. Print the actual reason.
    console.error(`[store] SQLite unavailable (${err && err.message}); falling back to JSON.`);
    console.error(`[store] this is a bug if node:sqlite should be available on ${process.version}`);
    return createJsonStore(path.join(path.dirname(file), "reservations.json"));
  }
}
