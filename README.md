# MediBook — Clinic Appointment System

A real-time clinic booking app: patients browse doctors by specialty, see live
availability generated from each doctor's working hours, and book a time slot —
with **guaranteed no double-booking, enforced at the database level**.

Built as a portfolio project to showcase scheduling logic, timezone handling,
and Postgres concurrency guarantees.

## Architecture

A monorepo (npm workspaces) with a clean client/server split:

```
clinic-booking/
├─ web/      React 19 SPA (Vite, React Router, Tailwind v4)
├─ server/   Express API (Drizzle ORM, JWT auth, Postgres)
└─ docker-compose.yml   local Postgres 16
```

- **web** is a static SPA. It talks to the backend only through a small fetch
  client (`web/src/lib/api.ts`) that attaches a JWT and parses JSON.
- **server** is the only thing with database credentials. It owns auth
  (bcrypt + JWT), validation (Zod), slot computation, and the booking logic.
- **Postgres** runs in Docker for local dev; `server/src/db/init.sql` is the
  authoritative schema and Drizzle (`server/src/db/schema.ts`) builds the
  queries.

## Tech stack

- **Frontend:** React 19, Vite, React Router, Tailwind CSS v4, TypeScript
- **Backend:** Node + Express, Drizzle ORM, `pg`, JWT (`jsonwebtoken`),
  `bcryptjs`, Zod, `date-fns-tz`
- **Database:** PostgreSQL 16 (Docker)
- **Tests:** Vitest

## The interesting parts

### 1. Slot generation (`server/src/lib/slots.ts`)
A pure, timezone-free algorithm that turns a doctor's working windows +
appointment length + already-booked ranges into the list of free start times.
It's plain integer math on minutes-from-midnight, which keeps it fully
unit-tested (`web/src/lib/slots.test.ts`, 12 cases incl. half-open overlaps,
back-to-back bookings, and hiding past slots). Availability is computed
server-side now and exposed at `GET /api/doctors/:id/slots`.

### 2. No double-booking, guaranteed by the database
A Postgres `EXCLUDE` constraint (via `btree_gist`) makes it impossible for two
non-cancelled appointments with the same doctor to have overlapping time
ranges. Even under a race between two patients, exactly one insert wins; the
API catches the violation and returns a friendly 409:

```sql
exclude using gist (
  doctor_id with =,
  tstzrange(starts_at, ends_at) with &&
) where (status <> 'cancelled')
```

### 3. Timezone handling
Appointments are stored in **UTC**. The clinic operates in one timezone
(`CLINIC_TIMEZONE`); the API converts the patient's wall-clock date+time to UTC
on the way in (`date-fns-tz`) and the slot algorithm stays timezone-agnostic.

### 4. Security
- All authorization lives in the API. Protected routes require a valid Bearer
  JWT (`server/src/auth.ts`); passwords are hashed with bcrypt.
- The booking endpoint sets the patient from the token, derives the end time
  from the doctor's slot length, rejects past times, and relies on the
  exclusion constraint — a client can't forge a booking or skip the checks.
- Appointment queries are always scoped to the authenticated user; cancel only
  affects the caller's own rows.

## Getting started

You need **Docker** (for Postgres) and **Node 20+**.

```bash
npm install                      # installs web + server workspaces

cp server/.env.example server/.env       # defaults work for local Docker
cp web/.env.local.example web/.env.local # defaults to http://localhost:4000

npm run setup     # docker compose up + migrate schema + seed demo data
npm run dev       # starts the API (:4000) and the web app (:5173) together
```

Then open http://localhost:5173, sign up, pick a doctor, and book a slot.

> The local Postgres is published on host port **5433** (to avoid clashing with
> an existing Postgres on 5432). Change `docker-compose.yml` and
> `server/.env` together if you want a different port.

## Scripts (root)

| Command | Description |
|---|---|
| `npm run dev` | Run the API and web dev servers together |
| `npm run dev:web` / `npm run dev:server` | Run one side only |
| `npm run build` | Build the web app and type-check the server |
| `npm run db:up` / `npm run db:down` | Start / stop the Postgres container |
| `npm run migrate` | Apply `server/src/db/init.sql` to the database |
| `npm run seed` | Seed demo doctors, specialties and schedules |
| `npm run setup` | `db:up` + `migrate` + `seed` in one step |
| `npm test -w web` | Run the slot-logic unit tests |

## API reference

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | — | Create account, returns `{ token, user }` |
| POST | `/api/auth/login` | — | Log in, returns `{ token, user }` |
| GET | `/api/auth/me` | ✓ | Current user |
| GET | `/api/specialties` | — | List specialties |
| GET | `/api/doctors` | — | List active doctors (`?specialtyId=`) |
| GET | `/api/doctors/:id` | — | One doctor |
| GET | `/api/doctors/:id/availability` | — | Weekly working hours |
| GET | `/api/doctors/:id/slots?date=` | — | Free slot start times for a day |
| GET | `/api/appointments` | ✓ | The caller's appointments |
| POST | `/api/appointments` | ✓ | Book a slot |
| PATCH | `/api/appointments/:id/cancel` | ✓ | Cancel one of the caller's appointments |

## Deployment

- **Frontend:** any static host (Netlify, Cloudflare Pages, Vercel) — serve
  `web/dist/` with a SPA fallback to `index.html`. Set `VITE_API_URL` to the
  deployed API URL.
- **Backend:** any Node host (Render, Railway, Fly.io). Set `DATABASE_URL`,
  `JWT_SECRET`, and `WEB_ORIGIN`.
- **Database:** any managed Postgres. Run the migration against it once.

> This is a portfolio demo, not a real medical service.
# clinic-booking
