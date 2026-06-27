# Deploy — putting FireGo live on the internet (Vercel)

This guide takes FireGo from your machine to a public URL anyone can visit. It's
written for a beginner, on Windows, using **Vercel** (the company that makes
Next.js — it's the easiest host for this app and has a free tier).

> **You won't paste any password or secret into this file or into git.** Your
> secrets only ever go into Vercel's encrypted **Environment Variables** screen
> and your local `.env`. Never commit `.env`; never paste real secrets anywhere
> public.

**The big picture:** your code is already on GitHub. Deploying just means:
connect Vercel to that GitHub repo → give Vercel the same environment variables
you have in `.env` → click Deploy. That's it. The phases below add the details.

---

## Where things stand right now (already done)

- ✅ Code is committed and pushed to GitHub (`vibeToUrLife/FireGo`, branch `master`).
- ✅ `.env` is **not** in git (only `.env.example` is) — your secrets are safe.
- ✅ Your Supabase database already has the tables (from `npx prisma db push`).

So you can skip straight to **Phase 1 (Vercel)**. Phase 0 is a quick double-check.

---

## Phase 0 — Pre-flight (2 minutes)

**0a. Node version.** Next.js 16 needs Node 20.9 or newer:

```powershell
node -v
```

If it's `v18` or lower, install Node 20 or 22 from <https://nodejs.org> first.

**0b. Local build passes.** Vercel runs this exact command; catching errors here
is faster than waiting on a failed cloud build:

```powershell
npm run build
```

Success = it prints a list of routes and ends with no red errors. (Your local
`.env` must be filled in for this to work, since the app reads `DATABASE_URL`.)

> Note: in Next.js 16, `next build` does **not** run ESLint, so style warnings
> won't fail the build — but TypeScript type errors **will**.

---

## Phase 1 — Connect Vercel to your GitHub repo

1. Go to <https://vercel.com> and click **Continue with GitHub**. This installs
   the "Vercel for GitHub" app. When GitHub asks which repos to grant, you can
   pick **Only select repositories → FireGo** (you don't have to grant all).
2. In the Vercel dashboard: **Add New… → Project**.
3. Find **FireGo** under "Import Git Repository" and click **Import**.
   - Don't see it? Click **Adjust GitHub App Permissions** and grant access to
     the repo. (You must be the repo's **owner** to import it.)
4. On the configure screen, **leave everything at the defaults** — Vercel
   auto-detects Next.js and fills in the right settings:
   - Framework Preset: **Next.js** (auto)
   - Build Command: your `package.json` build script (`prisma generate && next build`) — correct, leave it
   - Install Command / Output Directory / Root Directory: leave as detected
5. **Don't click Deploy yet** — first add the environment variables (Phase 2).
   (If you already deployed, that's fine; you'll add the vars and redeploy.)

---

## Phase 2 — Environment variables (the important part)

Vercel needs the same secrets your local `.env` has. On the import screen expand
**Environment Variables**, or add them later under **Project → Settings →
Environment Variables**. Add each row below.

| Variable             | Required?    | What to paste                                                                               |
| -------------------- | ------------ | ------------------------------------------------------------------------------------------- |
| `DATABASE_URL`       | **Required** | Supabase **Transaction pooler** string — port **6543**, ends with `?pgbouncer=true`         |
| `DIRECT_URL`         | **Required** | Supabase **Session pooler** string — port **5432** (no `pgbouncer` flag)                    |
| `AUTH_SECRET`        | **Required** | A long random string. Generate one with `npx auth secret` (or reuse the one in your `.env`) |
| `AUTH_GOOGLE_ID`     | Optional     | Google OAuth **Client ID** — only if you want Google sign-in                                |
| `AUTH_GOOGLE_SECRET` | Optional     | Google OAuth **Client Secret** — only if you want Google sign-in                            |

These are the **same values that are already in your local `.env`** — open that
file and copy each across. (Get fresh copies from Supabase any time via the green
**Connect → ORM** button on your project dashboard.)

**Which environments to tick:** Vercel offers Production / Preview / Development
checkboxes per variable.

- The simplest setup (reusing your one Supabase project): tick **Production**
  for all five. If you also want branch "preview" deployments to work, tick
  **Preview** too — just know those previews will read/write your **real**
  database. For a hobby project that's fine.
- Cleaner setup (optional, later): make a **second** Supabase project for
  dev/preview so test deployments can't touch real data — see Phase 4.

> ⚠️ **Two things NOT to do:**
>
> - **Do NOT** add an `AUTH_URL` variable. FireGo already sets `trustHost: true`
>   in `src/auth.ts`, so Auth.js auto-detects your live domain. Adding a stale
>   `AUTH_URL` (e.g. `localhost`) would make sign-in redirect to the wrong place.
> - **Do NOT** put `NEXT_PUBLIC_` in front of any of these — they're server-only
>   secrets and must never be shipped to the browser.

---

## Phase 3 — Deploy

Click **Deploy**. Vercel installs, runs `prisma generate && next build`, and
within a minute or two gives you a live URL like **`https://firego.vercel.app`**.

From now on, **every push to your `master` branch automatically redeploys** the
live site. Pushes to other branches create temporary "preview" URLs.

---

## Phase 4 — The production database

**Simplest (recommended for now): reuse your existing Supabase project.**
Because your `DATABASE_URL` / `DIRECT_URL` point at the same Supabase project you
built with, the tables **already exist** (you ran `prisma db push` earlier).
There is **nothing to do here** — the live site uses that database immediately.

**Optional, cleaner setup — a separate database for production:** keeping dev and
prod separate means a mistake while developing can never touch real users' data.
The Supabase free tier allows 2 active projects.

1. Create a second Supabase project. Copy its two connection strings from
   **Connect → ORM** (6543 transaction pooler, 5432 session pooler).
2. Create the tables in it. Because this repo has **no migration files** (the
   schema was built with `db push`), use `db push` against the new database — in
   PowerShell, temporarily point the env vars at the prod project and push:
   ```powershell
   $env:DATABASE_URL="<prod transaction pooler 6543 url>"
   $env:DIRECT_URL="<prod session pooler 5432 url>"
   npx prisma db push
   ```
3. Put the prod project's strings into Vercel's **Production** env vars (and keep
   your original project's strings for **Preview/Development**).

> Security note: the connection string logs Prisma in as a privileged role that
> **bypasses Supabase Row-Level Security**. Your protection is keeping that
> string server-side only (never `NEXT_PUBLIC_`, never committed) and enforcing
> sign-in in the app — which FireGo does.

---

## Phase 5 — Google sign-in on the live domain

Skip this if you don't use Google sign-in. Otherwise, your existing Google OAuth
client only trusts `localhost` right now — you must add the live domain.

In **Google Cloud Console → APIs & Services → Credentials → (your OAuth 2.0
Client ID) → Edit**, **add** these (keep the localhost ones for local dev):

- **Authorized JavaScript origins:**
  - `https://firego.vercel.app` (your real Vercel domain)
- **Authorized redirect URIs** (this is the one that matters most):
  - `https://firego.vercel.app/api/auth/callback/google`

The match must be **exact** — `https` (not `http`), the precise domain, no
trailing slash. A mismatch gives `redirect_uri_mismatch`. Changes can take a few
minutes to take effect.

**Test users / publishing:** while your OAuth consent screen is in **Testing**
mode, only Google accounts you've added under **Test users** can sign in (anyone
else gets `access_denied`). To let the public in, open **OAuth consent screen →
Publish app**. With only basic profile/email scopes it goes live immediately.

---

## Phase 6 — Check it works

1. Open your live URL.
2. Create an account with **email + password**, sign in, **save a plan** — this
   exercises the database end to end.
3. If Google is set up, test **Continue with Google**.
4. Something broken? Vercel → **Deployments → (latest) → Logs / Functions** shows
   the real server error.

> **The #1 beginner gotcha — redeploy after changing env vars.** Editing an
> environment variable does **not** affect the site that's already running. The
> new value is only picked up on the **next build**. After adding or changing any
> variable, go to **Deployments → ⋯ (on the latest) → Redeploy** (or push a
> commit).

---

## Troubleshooting

| Symptom                                                   | Cause                                                                                        | Fix                                                                                                                                |
| --------------------------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Sign-in redirects to `localhost` or the wrong URL         | A stale `AUTH_URL` env var is set                                                            | **Delete** any `AUTH_URL` variable in Vercel and redeploy. FireGo trusts the host automatically (`trustHost: true`).               |
| `/api/auth/error?error=Configuration`                     | `AUTH_SECRET` missing, or Google ID/secret missing/wrong                                     | Confirm `AUTH_SECRET` (and the Google vars if used) are set for the right environment, then **redeploy**.                          |
| Google `Error 400: redirect_uri_mismatch`                 | Live redirect URI not registered, or not an exact match                                      | Add `https://<your-domain>/api/auth/callback/google` to the OAuth client. Exact scheme/host, no trailing slash. Wait a minute.     |
| Google `access_denied`                                    | Consent screen in Testing and the account isn't a test user                                  | Add the account under **Test users**, or **Publish app**.                                                                          |
| Build fails: `DATABASE_URL is not set`                    | The app reads `DATABASE_URL` during the build (`src/lib/db.ts`), and it wasn't set in Vercel | Add `DATABASE_URL` with the **Production** scope ticked, then redeploy. (It's not `prisma generate` that needs it — it's the app.) |
| Intermittent `prepared statement "s0" already exists`     | Using the 6543 transaction pooler without the pgbouncer flag                                 | Make sure `DATABASE_URL` ends with `?pgbouncer=true`.                                                                              |
| `too many connections` / `Max client connections reached` | Many serverless instances each opening connections                                           | Use the **6543 pooler** for `DATABASE_URL`; optionally add `&connection_limit=1`.                                                  |
| Site suddenly can't reach the database after a quiet week | Free Supabase project **auto-paused** after ~7 days of no database activity                  | Un-pause it from the Supabase dashboard. For low-traffic apps, consider a scheduled keep-alive or the Pro plan.                    |

---

## A note on secrets

You never need to write a real secret into any file in this repo. If a secret
ever **did** reach GitHub (even a private repo, even later deleted — it stays in
history forever), rotate all of them: reset the Supabase database password,
regenerate `AUTH_SECRET` (`npx auth secret`), and reset the Google client secret.
For this repo that hasn't happened — `.env` was never committed — so there's
nothing to rotate.

Once it's live, see **README.md** for the overview and **ARCHITECTURE.md** for how
it all fits together.
