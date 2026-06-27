# Architecture

This document explains how FireGo is put together: how the files are split, how
state flows, and the design trade-offs behind the key decisions. If you're new to
these frameworks, read [`LEARN.md`](./LEARN.md) first — it explains the concepts
this document assumes.

## Big picture

FireGo is a single **Next.js (App Router)** application that contains both the UI
and the backend. There is no separate API server. Three ideas shape everything:

1. **The maths is a pure module.** All retirement calculations live in
   `src/lib/retirement.ts` as pure functions with no React, no network, no
   database. That single module runs in two places — in the browser for instant
   live results, and on the server as the authoritative calculation — so the
   logic is never duplicated and is trivially unit-testable.
2. **Zod is the single source of truth for "valid input."** The same schema
   validates the form in the browser and the request body on the server, and it
   produces the TypeScript types, so they can't drift apart.
3. **The server owns the truth.** Reads are rendered by server components that
   call the engine directly; writes go through validated API routes with
   per-user ownership checks. The browser is never trusted to compute what gets
   stored.

```
            ┌─────────────────────── Next.js app ───────────────────────┐
 Browser ─► │  Server Components            Route Handlers (/api/*)      │
            │   page.tsx, dashboard   ◄──►   plans, register, auth       │
            │        │                          │                        │
            │        ▼                          ▼                        │
            │   src/lib/retirement.ts   ◄── same engine ──►  Prisma 7    │
            │   (pure calc engine)                            │          │
            └─────────────────────────────────────────────────┼─────────┘
                                                               ▼
                                                          PostgreSQL
```

## Directory layout

```
src/
  app/                         # routes (App Router: folders = URLs)
    layout.tsx                 # root shell: fonts, <SiteHeader/>, <SiteFooter/>
    page.tsx                   # "/"  public calculator (parses shared-link query)
    (auth)/login | register/   # auth pages (route group, no URL segment)
    dashboard/
      page.tsx                 # list of the user's saved plans (protected)
      plans/[id]/page.tsx      # open/edit one saved plan (protected)
    api/
      auth/[...nextauth]/      # Auth.js handler
      register/                # POST: create an email/password account
      plans/                   # GET list · POST create
      plans/[id]/              # GET · PUT · DELETE one plan
  components/
    calculator/                # the calculator feature, split by concern
      calculator.tsx           #   orchestrator: owns state, runs the engine
      inputs-form.tsx          #   all the inputs
      number-field.tsx         #   one reusable labelled input (+ slider)
      results-summary.tsx      #   the verdict + key stat cards
      balance-chart.tsx        #   Recharts area chart
      breakdown-table.tsx      #   collapsible year-by-year table
      save-plan-bar.tsx        #   share link + save/update
      disclaimer.tsx           #   honest caveats
    ui/                        # shadcn-style primitives (button, input, card…)
    site-header.tsx · site-footer.tsx · brand.tsx · user-menu.tsx
    auth/ · dashboard/         # feature-specific pieces
  lib/
    retirement.ts              # ★ the pure calculation engine
    retirement.types.ts        #   its input/output interfaces
    retirement.test.ts         #   Vitest tests for the engine
    validation.ts              # Zod schemas (the source of truth for inputs)
    constants.ts               # defaults, currencies, limits
    format.ts                  # money/percent/age formatting
    share.ts                   # inputs <-> URL query
    plan.ts                    # safely parse a stored plan's inputs
    db.ts                      # Prisma client singleton
    api.ts                     # shared API error responses
    utils.ts                   # cn() class-name helper
  auth.ts                      # Auth.js configuration
  generated/prisma/            # generated Prisma client (git-ignored)
prisma/schema.prisma           # database schema
```

## The calculation engine

`src/lib/retirement.ts` is the heart of the app. It works entirely in **real
(inflation-adjusted) terms**, so every amount is in *today's money*.

1. **Real return.** `realReturn = (1 + nominal) / (1 + inflation) − 1` (the Fisher
   equation). This is converted to a monthly rate so the simulation can step
   month by month.
2. **Accumulation** (current age → retirement age): each month, the portfolio
   **grows first, then the contribution is added**. Contributions are the
   personal monthly amount plus a pension/employer slice (`income × pension%`),
   and they can rise each year by a real raise.
3. **Drawdown** (retirement age → plan-until age): each month, living costs are
   **withdrawn first, then the remainder grows**. Net spending is the desired
   spending minus any other retirement income. If a withdrawal can't be covered,
   the money has run out and we record the age.
4. **Outputs:** the balance at retirement, whether the money lasts, the depletion
   age (if any), the ending balance/shortfall, the full year-by-year trajectory,
   and a **sustainable spending** figure (found by binary-searching the spending
   level that lasts exactly to the horizon).

Edge cases are handled deliberately: "already retired" (retirement age ≤ current
age) skips accumulation; negative real returns shrink the pot rather than
erroring; zero spending never depletes; and the horizon is bounded by the
plan-until age (≤ 120), so the loop can never run forever. These are all covered
by `retirement.test.ts`.

**Why pure functions?** Because the same engine then runs unchanged in the client
(`useMemo(() => projectRetirement(inputs), [inputs])` for instant updates) and in
server components (the dashboard computes each saved plan's verdict server-side).
One implementation, one set of tests, two execution contexts.

## State management

There is no global state library — it isn't needed.

- **Calculator state** lives in the `Calculator` client component as a single
  `useState<RetirementInputs>`. Every field reports changes up via an `onChange`
  that merges a partial patch. The result is recomputed with `useMemo`, and
  validation messages with another `useMemo`.
- **Initial state** is resolved on the **server**: the home page reads the
  shared-link query string, the plan page reads the saved row, and either is
  passed in as `initialInputs`. That means the first render already shows the
  correct scenario — no flash of defaults, no hydration mismatch.
- **URL sync** (sharing) is a one-way effect: whenever inputs change, the public
  calculator mirrors them into the URL with `history.replaceState` (no new
  history entries). Decoding happens on the server via `share.ts`.
- **Server state** (the user, their plans) is read directly with Prisma inside
  server components and Auth.js's `auth()` — no client fetching for reads.

## Data flow for a save

1. User adjusts inputs → live results (client engine).
2. Clicks **Save** → `POST /api/plans` with `{ name, inputs }`.
3. The route checks the session, validates the body with the **same Zod schema**,
   and stores it. Inputs are kept as a single **JSON column**.
4. The dashboard re-reads the row, validates it back into typed inputs
   (`plan.ts`), and renders a verdict computed **on the server**.

## Key trade-offs

- **One app, not a separate backend.** Next.js route handlers + server components
  give us a real backend (auth, CRUD, server-side compute) without a second
  service to run. Simpler to reason about and deploy.
- **Inputs stored as JSON, not columns.** The inputs are a cohesive bag that will
  evolve (e.g. when Monte Carlo is added). A `Json` column keeps the database
  schema stable, with Zod as the contract on the way in/out. The cost is we can't
  query *inside* inputs in SQL — which we never need to.
- **JWT sessions.** The Credentials provider requires the JWT session strategy
  (you can't persist a database session for a hand-rolled login). It also keeps
  every request fast — the session is a signed cookie, no DB round-trip.
- **Hand-written UI primitives** instead of the shadcn CLI. Full control over a
  small, consistent component set, no generator step, and a clean fit with
  Tailwind v4 + React 19.
- **Deterministic v1.** The model uses a single expected return rather than
  Monte Carlo. It's honest about that in the disclaimer, and the architecture
  (pure engine, JSON inputs) leaves room to add a probabilistic mode later
  without reshaping the app.

## Where things would change

- **New input field:** add it to `RetirementInputs` (types), `validation.ts`
  (Zod + default in `constants.ts`), a `NumberField` in `inputs-form.tsx`, and
  use it in `retirement.ts`. Nothing else needs to know.
- **New result metric:** add it to `RetirementResult`, compute it in
  `projectRetirement`, and show it in `results-summary.tsx`.
- **New page:** add a folder under `src/app`.
