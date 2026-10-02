# Ultra Hotel

Ultra Hotel — a 5-star family-friendly beachfront resort, presented as a group
portfolio site. Static front end, zero-dependency booking and enquiry back end,
and one shared pricing engine that both sides import.

- **No dependencies.** `dependencies` is empty. Everything runs on the Node
  standard library.
- **No build step.** The browser loads the same `.mjs` modules the server runs.
- **No lockfile.** There is nothing to install.

## Requirements

- Node.js **>= 22.5.0** (the store uses the built-in `node:sqlite` module)

Verified on Node v24.21.0.

## Quick start

```bash
npm start          # http://127.0.0.1:3000
```

Other scripts:

| Script          | What it does                                              |
| --------------- | --------------------------------------------------------- |
| `npm start`     | Serve `public/` and the JSON API                           |
| `npm run dev`   | Same, with `--watch` for auto-restart on file changes      |
| `npm run reset` | Delete the local store (reservations, enquiries, signups)  |
| `npm test`      | `node --test` — currently reports **0 tests**; exits clean |

There is nothing to install first — skip `npm install` entirely.

### Resetting the store

`npm run reset` prints the files it will delete and exits. Confirm with:

```bash
npm run reset -- --yes
```

Stop the server first on Windows; SQLite holds a lock on the file.

## Configuration

Both variables are optional — the defaults are what you get with a plain
`npm start`.

| Variable | Default     | Notes                                |
| -------- | ----------- | ------------------------------------ |
| `PORT`   | `3000`      | HTTP port                            |
| `HOST`   | `127.0.0.1` | Loopback only, so not network-exposed |

## Layout

```
public/            13 static pages + assets
  index.html         home
  hotels.html        properties and room types
  book.html          booking flow with the live quote
  dining.html        restaurants
  events.html        meetings and functions
  weddings.html      weddings
  business.html      corporate
  brands.html        the brand portfolio
  gallery.html       photography
  ultra-circle.html  loyalty programme
  app.html           mobile app
  about.html         about the group
  404.html
  assets/css/        tokens, base, components, pages, motion
  assets/js/         core, nav, chrome, cards, forms, ui, motion, booking
  assets/js/pages/   one module per page
server/index.mjs   HTTP server, static file serving, API routing
server/store.mjs   persistence — SQLite via node:sqlite, JSON fallback
shared/catalog.mjs catalogue: brands, properties, dining, tiers, programmes
shared/booking.mjs validation and pricing. Pure — no I/O, no DOM
tools/reset-db.mjs wipes the local store
data/              runtime store (git-ignored, recreated on first start)
```

`shared/` is the important part: the browser imports `booking.mjs` to draw the
live quote, and the server imports the very same module to re-price every
submission. The number a guest watches and the number the API charges cannot
drift apart.

Money is integer PHP centavos. Dates are `YYYY-MM-DD` local date strings with
no timezone attached — a hotel night is a calendar day, not an instant.

## API

All responses are JSON.

| Method | Route                 | Notes                                        |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/api/health`         | Liveness                                      |
| GET    | `/api/catalog`        | Full catalogue                                |
| GET    | `/api/quote`          | `?property=&checkIn=&checkOut=&room=&adults=&children=&rooms=&promo=` |
| POST   | `/api/bookings`       | Create a reservation, returns a code         |
| GET    | `/api/bookings`       | List, filter with `?email=`                  |
| GET    | `/api/bookings/:code` | Look up one reservation                       |
| POST   | `/api/newsletter`     | Signup                                        |
| POST   | `/api/enquiries`      | General contact                               |
| POST   | `/api/dining-reservations` | Table booking                            |
| POST   | `/api/spa-appointments`   | Spa booking                               |
| POST   | `/api/proposals`      | Events and weddings                           |

Try it:

```bash
curl http://127.0.0.1:3000/api/health
```

## Persistence

`server/store.mjs` writes to SQLite in `data/` through the standard-library
`node:sqlite` module, and falls back to a JSON file with identical behaviour
where that is unavailable. The four-method repository interface in that file
is the seam: swap the factory for a Postgres or Prisma implementation and the
HTTP layer does not change.

The store is runtime state and is **not** committed — `data/` is git-ignored
apart from a `.gitkeep`, and the server recreates it empty on first start.

## Licence

Private project. All rights reserved.