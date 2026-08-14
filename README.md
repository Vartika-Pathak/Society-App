# Pavilion

Pavilion is a full-stack residential society management app — the day-to-day tools a housing
society's residents, security guards, and management committee actually need: visitor entry with
OTPs, maintenance and complaints, amenity bookings, maintenance billing, notices and events, and an
admin panel to run all of it.

- **Live app**: https://society-app-objc.onrender.com
- **Backend API docs (Swagger)**: https://pavilion-kic0.onrender.com/swagger-ui.html
- **Backend source**: https://github.com/Vartika-Pathak/Pavilion

> Free-tier hosting — the backend spins down after 15 minutes idle and takes 30–50s to wake up on
> the first request after a quiet period. That's normal, not a bug.

## What it does

- **Sign-up & verification** — a first-time resident applies with name + flat number; an admin
  reviews and approves before the signup form is even reachable. Two-step email-OTP signup after
  that, protected by reCAPTCHA.
- **Gate & visitor entry** — a resident logs a visitor (guest, cab/delivery, household help,
  maintenance staff) and gets an OTP for the guard to check at the gate. Household help gets a
  90-day standing pass instead of a one-time code, since they come every day; the resident can
  revoke it early. A society-wide Entry Log shows everyone who's come and gone.
- **Maintenance & complaints** — residents report issues with photos; staff track status; the
  resident confirms a fix before it's actually closed (or reopens it if it isn't).
- **Emergency alerts** — one tap notifies every neighbor, the guard, and the admin.
- **Amenities & payments** — book the clubhouse/pool for free, or pay for the tennis court/party
  hall via Stripe. Vehicle registration and paid parking passes. Maintenance dues payable online per
  flat, plus the admin-side billing: vendor bills, bill payments, collections, discounts, reports
  (income statement, balance sheet, monthly trends).
- **Admin panel** — masters (society/building/flat), notices, events, a photo gallery admins
  manage by uploading files directly, member directory, and a full audit log of every admin action.
- **AI help chatbot** — a floating assistant (Google Gemini) that answers "how do I…" questions
  about the app itself, for signed-in and signed-out visitors alike.

## Architecture

Two repos, two deploys:

- **This repo** — the React/TypeScript frontend (`artifacts/pavilion`), plus the shared
  OpenAPI spec and generated API client/Zod schemas (`lib/`) the frontend uses to talk to the
  backend.
- **[Pavilion](https://github.com/Vartika-Pathak/Pavilion)** — the Java/Spring Boot backend:
  REST API, JWT auth, Spring Security role checks, Flyway-migrated SQLite/MySQL database, Stripe
  payments, and 298 integration tests.

The backend replaced an earlier Node/Express/Drizzle prototype entirely — every feature in the list
above is served by the Java backend now.

**Stack**: React 19, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query, wouter · Java 21,
Spring Boot, Spring Data JPA, Spring Security, Flyway · SQLite / MySQL · Stripe · Google Gemini ·
Orval (OpenAPI → typed React Query hooks + Zod schemas)

## Running it locally

```bash
pnpm install
pnpm --filter @workspace/pavilion run dev
```

This starts the Vite dev server on port 5173. It proxies `/api/*` to a backend — by default that's
the Java backend on port 8081 (see the [backend README](https://github.com/Vartika-Pathak/Pavilion)
for how to run it locally). Point the proxy elsewhere with `API_PORT`.

```bash
pnpm run typecheck   # across the whole workspace
pnpm run build        # typecheck + production build
```

## Repo layout

```
artifacts/
  pavilion/         The app itself — pages, components, routing
  mockup-sandbox/   Design/prototyping sandbox, unrelated to the shipped app
lib/
  api-spec/         The OpenAPI contract shared with the backend (openapi.yaml)
  api-client-react/ Generated: typed React Query hooks (orval)
  api-zod/          Generated: Zod schemas + TS types (orval)
```
