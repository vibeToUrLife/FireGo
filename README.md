# FireGo

**▶︎ Live app: [firego.vercel.app](https://firego.vercel.app/)** — try the finished product, no setup needed.

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
- **Accounts** — sign in with email/password **or Google**, then save, name, edit
  and delete plans on your dashboard.
- **Mobile-first, accessible** — keyboard-operable, visible focus, honest
  disclaimers, respects reduced-motion.

## Tech stack

| Area       | Choice                                                                          |
| ---------- | ------------------------------------------------------------------------------- |
| Framework  | **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)            |
| Styling    | **Tailwind CSS v4** + hand-rolled **shadcn/ui-style** components                |
| Charts     | **Recharts 3**                                                                  |
| Database   | **PostgreSQL** (hosted on **Supabase**) via **Prisma 7** (`@prisma/adapter-pg`) |
| Auth       | **Auth.js v5** (NextAuth) — email/password (bcrypt) + Google OAuth              |
| Validation | **Zod 4** (shared client + server)                                              |
| Tests      | **Vitest 4** (pure calculation engine)                                          |
| Tooling    | ESLint + Prettier                                                               |

The calculation logic is a pure, framework-free module (`src/lib/retirement.ts`)
that runs identically in the browser (instant results) and on the server
(authoritative).

---

## Documentation

| File                                     | What it's for                                                                                |
| ---------------------------------------- | -------------------------------------------------------------------------------------------- |
| **README.md**                            | This overview.                                                                               |
| **[SETUP.md](./SETUP.md)**               | Step-by-step local setup from a fresh clone (Supabase + optional Google), beginner-friendly. |
| **[DEPLOY.md](./DEPLOY.md)**             | Step-by-step guide to putting FireGo live on Vercel, beginner-friendly.                      |
| **[LEARN.md](./LEARN.md)**               | A complete beginner's tour of the whole codebase and every technology used.                  |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | The design, the data model, and the key trade-offs.                                          |

---

## Quick start

> First time? Follow **[SETUP.md](./SETUP.md)** — it walks through getting a free
> Supabase database and (optionally) Google login, step by step. The short version:

```bash
git clone <your-repo-url>
cd FireGo
npm install
cp .env.example .env     # then fill in the values below
npx prisma db push       # create the database tables
npm run dev              # → http://localhost:3000
```

You need a few environment variables in `.env` (see `.env.example`):

| Variable             | Required    | What it is                                                                        |
| -------------------- | ----------- | --------------------------------------------------------------------------------- |
| `DATABASE_URL`       | ✅          | Postgres connection the **app** uses (Supabase **transaction pooler**, port 6543) |
| `DIRECT_URL`         | recommended | Direct connection for **migrations** (Supabase **session pooler**, port 5432)     |
| `AUTH_SECRET`        | ✅          | Session-signing secret. Generate one: `npx auth secret`                           |
| `AUTH_GOOGLE_ID`     | optional    | Google OAuth client id (enables the Google button)                                |
| `AUTH_GOOGLE_SECRET` | optional    | Google OAuth client secret                                                        |

> Leave the Google variables blank and the app simply hides the "Continue with
> Google" button — email/password still works. FireGo talks to Postgres directly
> via Prisma, so you do **not** need the `NEXT_PUBLIC_SUPABASE_*` keys or the
> `@supabase/*` JS packages.

---

## Scripts

| Command              | Does                                          |
| -------------------- | --------------------------------------------- |
| `npm run dev`        | Start the dev server (hot reload)             |
| `npm run build`      | Generate the Prisma client + production build |
| `npm run start`      | Serve the production build                    |
| `npm test`           | Run the calculation-engine unit tests         |
| `npm run test:watch` | Tests in watch mode                           |
| `npm run lint`       | ESLint                                        |
| `npm run format`     | Prettier (also sorts Tailwind classes)        |
| `npx prisma db push` | Apply the schema to your database             |
| `npx prisma studio`  | Browse your database visually                 |

---

## Deploy to Vercel

> Full beginner walkthrough: **[DEPLOY.md](./DEPLOY.md)**. The short version:

1. In [Vercel](https://vercel.com), **Add New → Project** and import this GitHub
   repo (Vercel auto-detects Next.js — leave the build settings as is).
2. In **Settings → Environment Variables**, set `DATABASE_URL`, `DIRECT_URL`,
   `AUTH_SECRET`, and (optionally) `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` — the
   same values from your `.env`. Point `DATABASE_URL` at the **pooled** (6543)
   connection string. Do **not** set `AUTH_URL`.
3. **Deploy.** The build runs `prisma generate && next build` automatically, and
   if you reuse your existing Supabase project the tables already exist.
4. For Google sign-in, add `https://your-domain.com/api/auth/callback/google` to
   your Google OAuth client's redirect URIs. Auth.js auto-detects the host
   (`trustHost: true` in `src/auth.ts`), so no `AUTH_URL` is needed.

> Remember: changing an env var only takes effect on the **next** deploy —
> redeploy after editing one.

---

## A note on honesty

FireGo gives **projections, not promises**. Real returns vary, markets fall as
well as rise, and a bad run early in retirement (sequence-of-returns risk) hurts
more than averages suggest. Treat every figure as a careful estimate to plan
around — not financial advice.
