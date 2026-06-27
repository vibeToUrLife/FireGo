# FireGo

A calm, honest **retirement calculator**. Enter your age, savings, contributions,
expected return and inflation, and FireGo shows — in today's money — how your
savings grow, the pot you'll have at retirement, and **whether the money lasts**
through your planning horizon. Sign in to save and revisit scenarios.

No hype, no "get rich" energy. Just clear projections you can plan around.

---

## What it does

- **Live calculator** — every figure updates instantly as you type or drag a slider.
- **Accumulation → drawdown model** — simulates saving up to retirement, then
  spending down, month by month, in real (inflation-adjusted) terms.
- **Clear verdict** — "on track" or "falls short", when the money runs out, and
  the spending level your savings can actually sustain.
- **Balance-over-life chart** (Recharts) + collapsible year-by-year table.
- **Shareable links** — your inputs live in the URL, so copying the link shares
  the exact scenario.
- **Accounts** — sign in with email/password or Google, then save, name, edit
  and delete plans on your dashboard.
- **Mobile-first, accessible** — keyboard-operable, visible focus, honest
  disclaimers, respects reduced-motion.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict) |
| Styling | **Tailwind CSS v4** + hand-rolled **shadcn/ui-style** components |
| Charts | **Recharts 3** |
| Database | **PostgreSQL** via **Prisma 7** (driver adapter `@prisma/adapter-pg`) |
| Auth | **Auth.js v5** (NextAuth) — credentials (bcrypt) + Google OAuth |
| Validation | **Zod 4** (shared client + server) |
| Tests | **Vitest 4** (pure calculation engine) |
| Tooling | ESLint + Prettier |

The calculation logic is a pure, framework-free module (`src/lib/retirement.ts`)
that runs identically in the browser (instant results) and on the server
(authoritative). See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full design,
and [`LEARN.md`](./LEARN.md) for a beginner-friendly tour of every part.

---

## Run it locally

### 1. Prerequisites

- **Node.js 20+** (built and tested on Node 24)
- A **PostgreSQL** database. Easiest free options:
  - [Neon](https://neon.tech) (hosted, free tier) — copy the connection string, or
  - `npx prisma dev` to run Postgres locally in a terminal, or
  - your own local Postgres / Docker.

### 2. Install

```bash
npm install
```

### 3. Configure environment

Copy the example and fill in your values. Use **`.env`** (not `.env.local`) — both
the app and the Prisma CLI read it, and it's git-ignored:

```bash
cp .env.example .env
```

| Variable | Required | What it is |
| --- | --- | --- |
| `DATABASE_URL` | ✅ | Postgres connection the **app** uses (pooled, for serverless) |
| `DIRECT_URL` | recommended | Direct/session connection used for **migrations** (falls back to `DATABASE_URL` if unset) |
| `AUTH_SECRET` | ✅ | Session-signing secret. Generate one: `npx auth secret` |
| `AUTH_GOOGLE_ID` | optional | Google OAuth client id (enables the Google button) |
| `AUTH_GOOGLE_SECRET` | optional | Google OAuth client secret |

> Leave the Google variables blank and the app simply hides the "Continue with
> Google" button — email/password still works.

#### Using Supabase

Supabase is plain Postgres, so it works with no code changes. In the Supabase
dashboard, click **Connect → ORMs** (or **Project Settings → Database**) and copy:

- the **transaction pooler** string (port `6543`) → `DATABASE_URL`
- the **session pooler** string (port `5432`) → `DIRECT_URL`

Replace `[YOUR-PASSWORD]` with your database password. (FireGo talks to Postgres
directly via Prisma — you do **not** need the `NEXT_PUBLIC_SUPABASE_*` keys or the
`@supabase/*` JS packages.)

### 4. Create the database tables

```bash
npx prisma db push      # quick: syncs the schema straight to your database
# — or, for versioned migrations —
npx prisma migrate dev --name init
```

### 5. Start the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

---

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Start the dev server (hot reload) |
| `npm run build` | Generate the Prisma client + production build |
| `npm run start` | Serve the production build |
| `npm test` | Run the calculation-engine unit tests |
| `npm run test:watch` | Tests in watch mode |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (also sorts Tailwind classes) |

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Add New → Project** and import the repo.
3. Add a Postgres database (Vercel Postgres or Neon). For serverless, use a
   **pooled** connection string.
4. Set the environment variables from step 3 above in **Project → Settings →
   Environment Variables** (`DATABASE_URL`, `AUTH_SECRET`, and optionally the two
   Google ones).
5. Deploy. The build runs `prisma generate` automatically.
6. Create the tables on your production database once:
   ```bash
   # locally, with DATABASE_URL pointed at the production database:
   npx prisma db push
   ```

For Google sign-in in production, add the redirect URI
`https://your-domain.com/api/auth/callback/google` to your Google OAuth client.

---

## A note on honesty

FireGo gives **projections, not promises**. Real returns vary, markets fall as
well as rise, and a bad run early in retirement (sequence-of-returns risk) hurts
more than averages suggest. Treat every figure as a careful estimate to plan
around — not financial advice.
