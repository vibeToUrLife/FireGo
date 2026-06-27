# Setup — running FireGo locally from zero

This guide takes you from a fresh clone of the repo to FireGo running on your
machine. It's written so a beginner can follow every step.

> **You will need to supply your own secrets** (database connection + auth
> secret). They live in a `.env` file that is **not** committed to GitHub, so a
> fresh clone never includes them — you create your own here. **Never commit
> `.env` or paste real passwords/secrets anywhere public.**

---

## What you'll need first

Free to get, ~15 minutes total:

- **Node.js 20 or newer** — <https://nodejs.org> (the project was built on Node 24).
  Check it's installed: `node -v`
- **Git** — <https://git-scm.com>
- **A code editor** — [VS Code](https://code.visualstudio.com) is a good default.
- **A PostgreSQL database** — easiest is a free [Supabase](https://supabase.com)
  project (used in this guide). Any Postgres works.
- **(Optional) A Google Cloud account** — only if you want "Sign in with Google".
  You can skip it; the app falls back to email/password.

---

## Step 1 — Get the code

```bash
git clone https://github.com/<your-username>/FireGo.git
cd FireGo
```

Replace `<your-username>/FireGo.git` with the actual repository URL.

## Step 2 — Install the dependencies

```bash
npm install
```

This downloads every library and automatically runs `prisma generate` (which
builds the database client). Give it a minute the first time.

> **Why the clone has no `node_modules/`, `.next/`, or `src/generated/prisma/`:**
> that's correct — these are auto-generated and git-ignored, so they're never in
> the repo. You don't copy or create them by hand; the commands make them:
>
> - `node_modules/` and `src/generated/prisma/` ← created by `npm install` (this step)
> - `.next/` ← created when you run `npm run dev` or `npm run build`
>
> If they ever get weird, you can safely delete them and re-run the commands.

## Step 3 — Create your environment file

The app reads its secrets from a file called `.env`. Copy the template:

```bash
# macOS / Linux
cp .env.example .env

# Windows (PowerShell)
Copy-Item .env.example .env
```

Open `.env` in your editor. It has these blanks to fill in (we do that in the
next steps):

```ini
DATABASE_URL="..."   # your database (app uses this)
DIRECT_URL="..."     # your database (migrations use this)
AUTH_SECRET="..."    # a random secret for sign-in
AUTH_GOOGLE_ID=""        # optional (Google login)
AUTH_GOOGLE_SECRET=""    # optional (Google login)
```

> `.env` is git-ignored on purpose — your secrets stay on your machine only.

## Step 4 — Set up the database (Supabase)

1. Create a project at <https://supabase.com> and set a **database password**
   when prompted (remember it — you'll need it in a moment).
2. In the dashboard, click the green **Connect** button (top), or go to
   **Project Settings → Database → Connection string**.
3. Copy **two** connection strings into `.env`:
   - the **Transaction pooler** string (port **6543**) → `DATABASE_URL`
   - the **Session pooler** string (port **5432**) → `DIRECT_URL`

   They look like this (yours will have your own project ref, region, and
   password):

   ```ini
   DATABASE_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres"
   ```

4. **Replace `<password>` with your real database password.**

   > ⚠️ **Two common mistakes:**
   >
   > - If the value still has **square brackets** like `[your-password]`, delete
   >   the brackets — they were just placeholder markers, not part of the password.
   > - If your password has special characters (`@ : / ? # &`), they must be
   >   **URL-encoded** (e.g. `@` → `%40`, `#` → `%23`). The simplest fix is to use
   >   a password with only letters and numbers.

5. Create the tables in your database:

   ```bash
   npx prisma db push
   ```

   When it says "_Your database is now in sync with your Prisma schema_", you're
   set. You can see the new tables in Supabase → **Table Editor**.

## Step 5 — Generate your auth secret

`AUTH_SECRET` is a random string used to sign login sessions. Generate one:

```bash
npx auth secret
```

This prints (or writes) a secret. Put it in `.env`:

```ini
AUTH_SECRET="paste-the-generated-value-here"
```

Any long random string works — just don't reuse it across projects, and don't
share it.

## Step 6 — (Optional) Enable Google sign-in

Skip this and the "Continue with Google" button simply stays hidden — email and
password still work. To enable it:

1. Go to <https://console.cloud.google.com> and create (or pick) a project.
2. Configure the **OAuth consent screen** (User type: **External**) and add your
   own Google address under **Test users**.
3. Create **Credentials → OAuth client ID → Web application** with:
   - **Authorized JavaScript origins:** `http://localhost:3000`
   - **Authorized redirect URIs:** `http://localhost:3000/api/auth/callback/google`
     (must be exact — no trailing slash, `http` not `https`, port `3000`)
4. Copy the **Client ID** and **Client Secret** into `.env`:

   ```ini
   AUTH_GOOGLE_ID="your-google-client-id.apps.googleusercontent.com"
   AUTH_GOOGLE_SECRET="your-google-client-secret"
   ```

## Step 7 — Run it

```bash
npm run dev
```

Open <http://localhost:3000>. You should see the calculator. Create an account
(top-right **Sign in → Create an account**), build a scenario, and hit **Save
plan** — it'll appear on your dashboard, and the row shows up in Supabase.

🎉 You're running FireGo locally.

---

## Everyday commands

| Command              | What it does                                |
| -------------------- | ------------------------------------------- |
| `npm run dev`        | Start the dev server (auto-reloads on save) |
| `npm run build`      | Production build (also checks TypeScript)   |
| `npm run start`      | Serve the production build                  |
| `npm test`           | Run the calculation-engine tests            |
| `npm run lint`       | Check code style                            |
| `npm run format`     | Auto-format the code with Prettier          |
| `npx prisma db push` | Apply schema changes to your database       |
| `npx prisma studio`  | Open a visual editor for your database      |

---

## Troubleshooting

| Symptom                                                                     | Fix                                                                                                                                                        |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **"There is a problem with the server configuration"** after editing `.env` | Restart the dev server — env changes only load on start (Ctrl+C, then `npm run dev`).                                                                      |
| Google login sends you back to the login page                               | Make sure you didn't open the callback URL directly — start from `/login` and click the Google button. Also restart after adding the Google env vars.      |
| `redirect_uri_mismatch` from Google                                         | The redirect URI in Google must be exactly `http://localhost:3000/api/auth/callback/google`.                                                               |
| Database connection errors                                                  | Check the password has no `[ ]` brackets, special characters are URL-encoded, and you used port **6543** for `DATABASE_URL` and **5432** for `DIRECT_URL`. |
| Changes to `.env` seem ignored                                              | Stop and restart the dev server.                                                                                                                           |

---

## A note on safety

- **Never commit `.env`** — it's already in `.gitignore`. Only `.env.example`
  (which has no real values) is committed.
- If you ever leak a secret (paste it somewhere public), rotate it: reset the
  database password in Supabase, regenerate `AUTH_SECRET`, or reset the Google
  client secret in Google Cloud.

Need more on _how the project works_ once it's running? See **`LEARN.md`** (a
beginner's tour of the whole codebase) and **`ARCHITECTURE.md`** (the design).
