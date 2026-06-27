# Learn FireGo: A Beginner's Guide to the Code

Welcome! This guide explains how the FireGo retirement calculator is built, written for someone who has never touched these tools before. Read it top to bottom the first time — each section builds on the last — then come back to any part as a reference. Wherever something matters, we point you at the real file so you can see it for yourself.

## Table of contents

1. [The 60-second mental model](#the-60-second-mental-model)
2. [What tech is used](#what-tech-is-used)
3. [A guided tour, in beginner order](#a-guided-tour-in-beginner-order)
   - [TypeScript](#typescript-javascript-that-checks-itself)
   - [React](#react-the-screen-in-small-pieces)
   - [Next.js](#nextjs-folders-as-urls-server-vs-client)
   - [Tailwind, design tokens, and the ui/ primitives](#tailwind-design-tokens-and-the-ui-primitives)
   - [Zod](#zod-the-bouncer-at-the-door)
   - [Prisma + PostgreSQL/Supabase](#prisma--postgresqlsupabase-the-database)
   - [Auth.js](#authjs-logging-in)
   - [Recharts](#recharts-the-charts)
4. [The calculation engine (the heart)](#the-calculation-engine-the-heart)
5. [Follow one click end-to-end](#follow-one-click-end-to-end)
6. [Run it & safe first edits](#run-it--safe-first-edits)
7. [Mini-glossary](#mini-glossary)
8. [Where to go next](#where-to-go-next)

---

## The 60-second mental model

FireGo is a website where someone can type in their savings, retirement age, and spending plans, and instantly see whether their money will last. Under the hood, it's three layers:

1. **The maths** — a single file of pure number-crunching that takes your inputs and projects your money forward, month by month, until you retire and then spend it down. No screen, no internet, just numbers in and numbers out.
2. **The screen** — the boxes, sliders, cards, and charts you see and click. These are built from small reusable pieces (React components) and styled with short class names (Tailwind).
3. **The backend** — the server-side part that only runs when you save a plan or log in: a database that remembers your plans, and a login system that remembers who you are.

Most of FireGo lives in your browser (layers 1 and 2). The backend (layer 3) only gets involved when something needs to be _remembered_ between visits. Keep these three layers in mind and the rest of this guide will slot into place.

---

## What tech is used

Every tool below appears in `package.json` — the file that lists the project's libraries (its "dependencies") and the exact version of each. A `^` in front of a version (like `^4.4.3`) just means "this version or any newer minor update" — it's normal and you can ignore it for now.

### Core stack

These libraries make the app run and show up in the browser.

| Tool                       | Version          | What it is in one line                                                                          | What it does in FireGo                                                                                                                                       |
| -------------------------- | ---------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Next.js**                | `16.2.9`         | A full-featured framework built on top of React for websites and web apps.                      | The backbone — it handles pages, routing (which URL shows which screen), the server side, and the build. Configured in `next.config.ts`.                     |
| **React**                  | `19.2.4`         | A library for building user interfaces out of reusable "components."                            | Every piece of the screen (buttons, the form, charts) is a React component.                                                                                  |
| **react-dom**              | `19.2.4`         | The part of React that draws components into the web page.                                      | Renders the React components as real HTML in the browser. Always paired with React.                                                                          |
| **TypeScript**             | `^5`             | JavaScript with type-checking added — it catches mistakes before you run the code.              | The whole codebase is TypeScript. Settings live in `tsconfig.json`, with `"strict": true` for the most thorough checking.                                    |
| **Tailwind CSS**           | `^4`             | A styling system using small utility class names instead of separate CSS files.                 | All the visual styling (spacing, colours, layout).                                                                                                           |
| **@tailwindcss/postcss**   | `^4`             | The plugin that lets Tailwind v4 plug into PostCSS (a CSS-processing tool).                     | Connects Tailwind into the build. The single plugin in `postcss.config.mjs`.                                                                                 |
| **Recharts**               | `^3.9.0`         | A charting library made for React.                                                              | Draws the retirement projection charts.                                                                                                                      |
| **Prisma**                 | `^7.8.0`         | A database toolkit — describe tables in one file, generate type-safe code.                      | The command-line tool that reads `prisma/schema.prisma` and generates code. ("ORM" = Object-Relational Mapper: it maps database rows to JavaScript objects.) |
| **@prisma/client**         | `^7.8.0`         | The generated, type-safe code your app calls to talk to the database.                           | What the app code actually uses to fetch and save data. Set up once in `src/lib/db.ts`.                                                                      |
| **@prisma/adapter-pg**     | `^7.8.0`         | An adapter that lets Prisma 7 talk to Postgres through the `pg` driver.                         | Bridges Prisma to the real database connection.                                                                                                              |
| **pg**                     | `^8.22.0`        | The low-level Node.js driver ("node-postgres") that opens the connection to Postgres.           | The plumbing underneath the Prisma adapter.                                                                                                                  |
| **PostgreSQL / Supabase**  | (hosted)         | PostgreSQL is a popular open-source database; Supabase hosts one for you.                       | Stores user accounts and saved plans. The connection string lives in environment variables — see `.env.example`.                                             |
| **next-auth (Auth.js v5)** | `^5.0.0-beta.31` | A login/authentication library for Next.js.                                                     | Handles sign-in, sign-out, and sessions. Wired up in `src/auth.ts`.                                                                                          |
| **@auth/prisma-adapter**   | `^2.11.2`        | Lets Auth.js store users and sessions in your Prisma/Postgres database.                         | Saves login records (User, Account, Session) into the database.                                                                                              |
| **bcryptjs**               | `^3.0.3`         | Securely hashes passwords (scrambles them so the raw password is never stored).                 | Hashes new passwords and checks them at login.                                                                                                               |
| **Zod**                    | `^4.4.3`         | A validation library — describe the shape data should have, and it checks real data against it. | Validates user input and is the single source of truth for the plan-input shape stored as JSON.                                                              |
| **@radix-ui/react-label**  | `^2.1.10`        | An unstyled, accessible form-label building block.                                              | Accessible labels for form fields. ("Accessible" = works with screen readers and keyboards.)                                                                 |
| **@radix-ui/react-select** | `^2.3.1`         | An unstyled, accessible dropdown building block.                                                | Powers dropdown menus.                                                                                                                                       |
| **@radix-ui/react-slider** | `^1.4.1`         | An unstyled, accessible slider building block.                                                  | Powers the drag-to-adjust sliders.                                                                                                                           |
| **@radix-ui/react-slot**   | `^1.3.0`         | A helper that lets one component pass its behaviour into another.                               | A low-level utility used by the custom UI components.                                                                                                        |
| **lucide-react**           | `^1.21.0`        | A library of clean, simple icons as React components.                                           | The icons used throughout the interface.                                                                                                                     |

> The four `@radix-ui/*` packages plus `class-variance-authority`, `clsx`, and `tailwind-merge` (below) are the typical foundation of **shadcn/ui** — a popular pattern where you copy small, styleable components into your own project rather than installing one big library.

### Tooling

These don't ship to the user — they help build, style, check, and test the code. They live in `devDependencies`.

| Tool                            | Version                                                                   | What it is in one line                                                                                        | What it does in FireGo                                        |
| ------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| **class-variance-authority**    | `^0.7.1`                                                                  | A helper for defining component "variants" (e.g. a button's primary vs. outline style) with Tailwind classes. | Keeps styling variations organized and consistent.            |
| **clsx**                        | `^2.1.1`                                                                  | A tiny helper for combining CSS class names conditionally.                                                    | Builds class-name strings cleanly.                            |
| **tailwind-merge**              | `^3.6.0`                                                                  | Resolves conflicting Tailwind classes so the last one wins.                                                   | Stops clashing Tailwind classes from fighting.                |
| **Vitest**                      | `^4.1.9`                                                                  | A fast test runner for JavaScript/TypeScript.                                                                 | Runs the unit tests. Configured in `vitest.config.ts`.        |
| **ESLint**                      | `^9`                                                                      | A "linter" — scans code for likely bugs and style problems.                                                   | Enforces code quality. Configured in `eslint.config.mjs`.     |
| **eslint-config-next**          | `16.2.9`                                                                  | A ready-made bundle of ESLint rules tuned for Next.js.                                                        | Provides the actual rules ESLint applies.                     |
| **Prettier**                    | `^3.8.5`                                                                  | An automatic code formatter.                                                                                  | Keeps formatting uniform. Run with `npm run format`.          |
| **prettier-plugin-tailwindcss** | `^0.8.0`                                                                  | A Prettier add-on that sorts Tailwind classes into a standard order.                                          | Reorders Tailwind class names consistently.                   |
| **@types/\* packages**          | `node ^20`, `react ^19`, `react-dom ^19`, `bcryptjs ^2.4.6`, `pg ^8.20.0` | "Type definitions" that teach TypeScript about libraries written in plain JavaScript.                         | Give TypeScript the info it needs for safer, smarter editing. |

### A note on the database

FireGo's database is **PostgreSQL, hosted on Supabase**. One thing worth knowing: the app talks to that database **directly through Prisma** (via the `pg` driver) — it does **not** use the Supabase JavaScript SDK at all. To FireGo, Supabase is simply "a place that runs a Postgres database." You could swap in any other Postgres host by changing only the `DATABASE_URL` in `.env`, and nothing in the app code would change. Notice that `prisma/schema.prisma` just says `provider = "postgresql"` — it never mentions Supabase by name.

### How it all fits together (one line per layer)

The **language** is TypeScript, which everything is written in. The **UI** is built from React components. The **framework** tying those components into a real website — pages, routing, the server — is Next.js. **Styling** is done with Tailwind CSS utility classes. User input is checked by **Zod** before it goes anywhere. Validated data is stored in a **PostgreSQL** database (on Supabase), reached through **Prisma** and the `pg` driver. **Auth** (logins and sessions) is handled by Auth.js / next-auth, with passwords hashed by bcryptjs. **Charts** are drawn with Recharts. And the **tooling** — Vitest, ESLint, Prettier — keeps the code correct and tidy.

---

## A guided tour, in beginner order

We'll now walk through each concept in the order that builds understanding fastest, tying every idea to a real file you can open.

### TypeScript: JavaScript that checks itself

JavaScript is the language web browsers speak. **TypeScript** is JavaScript with one superpower added: _types_. A type is a label that says what kind of value something is — a number, a piece of text, or a particular shape of object. When you say "this must be a number" and then accidentally pass it text, TypeScript flags the mistake _while you're writing code_, before you ever run it.

The whole FireGo codebase is TypeScript, and its strictest checking is turned on (`"strict": true` in `tsconfig.json`). You'll see types most clearly in **interfaces** — a labelled list of what data must be present and what type each piece is, like a contract. The engine's inputs and outputs are defined this way in `src/lib/retirement.types.ts`. Don't worry about memorising syntax; just know that when you see `: number` or `: RetirementInputs`, TypeScript is quietly guarding against a whole class of bugs.

### React: the screen in small pieces

This is the part of FireGo you can see and click. It's all built with **React**, a tool for building screens out of small reusable pieces.

**A component is just a function that returns the screen.** In React, a component is a function that returns **JSX** — HTML-like markup written inside your code that can mix in values. Here's a real, small one from `src/components/ui/card.tsx`:

```tsx
export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "border-border bg-surface rounded-lg border shadow-sm",
        className,
      )}
      {...props}
    />
  );
}
```

That's the whole thing: a function called `Card` that returns a styled `<div>`. Anywhere you write `<Card>…</Card>`, React runs this function. Component names start with a **capital letter** — that's how React tells your components apart from plain HTML tags.

**Props pass information in.** Props (short for "properties") are a component's inputs, just like arguments to a function. Look at `ResultsSummary` in `src/components/calculator/results-summary.tsx`:

```tsx
export function ResultsSummary({ result }: { result: RetirementResult }) { ... }
```

It takes one prop, `result`, holding all the calculated numbers. The parent passes it in with `<ResultsSummary result={result} />`. The curly braces mean "pass the value of this variable," and TypeScript checks that it's the right shape.

**Components nest like LEGO.** Small components snap into bigger ones. The top of the screen is `Calculator`, and inside its JSX it places others:

```tsx
<Card>
  <CardHeader>
    <CardTitle>Your numbers</CardTitle>
    <CardDescription>
      Adjust anything — the results update instantly.
    </CardDescription>
  </CardHeader>
  <CardContent>
    <InputsForm inputs={inputs} onChange={update} errors={errors} />
  </CardContent>
</Card>
```

When a component wraps other content, it receives that content as a special `children` prop — whatever you put _between_ the opening and closing tags arrives as `children` and renders where `{children}` sits.

**State makes results update live.** A component can remember values that change over time using **state**. When state changes, React automatically re-runs the component and redraws the screen — that redraw is called a **re-render**, and it's the secret behind FireGo updating instantly as you type. You create state with the `useState` **hook** (a "hook" is a special React function whose name starts with `use`). In `src/components/calculator/calculator.tsx`:

```tsx
const [inputs, setInputs] = useState<RetirementInputs>(
  initialInputs ?? DEFAULT_INPUTS,
);
```

This gives you the current value (`inputs`) and a **setter** (`setInputs`). The golden rule: **never reassign `inputs` directly — always call the setter.** FireGo wraps it in a small helper so each field updates just its own slice:

```tsx
const update = useCallback((patch: Partial<RetirementInputs>) => {
  setInputs((prev) => ({ ...prev, ...patch }));
}, []);
```

The `{ ...prev, ...patch }` means "keep all previous values, then overwrite the one that changed" — which is why changing your age doesn't wipe out your savings amount.

**`useMemo` avoids redoing heavy work.** Right below the state, FireGo computes your projection:

```tsx
const result = useMemo(() => projectRetirement(inputs), [inputs]);
```

`useMemo` remembers a calculation's result and only re-runs it when its dependency list (`[inputs]`) actually changes. Since the projection is the heavy lifting, this keeps things fast. It's a performance polish, not a correctness requirement.

**Controlled inputs keep the box and the state in sync.** FireGo uses _controlled inputs_: the value shown in a box is always driven by React state, never the browser's own memory. You can see both halves in `src/components/calculator/number-field.tsx`:

```tsx
<Input
  value={Number.isFinite(value) ? value : ""} // screen reflects state
  onChange={handleInputChange} // typing reports a change
/>
```

`value={...}` says "display this." `onChange={...}` says "when the user types, run this." The handler calls the `onChange` prop, which bubbles up to `update`, which calls `setInputs`, which re-renders. Because state is the single source of truth, the displayed number and the results can never drift apart.

### Next.js: folders as URLs, server vs client

FireGo is built with **Next.js**, a framework on top of React, using its **App Router**. The big idea: **your folders ARE your URLs.** You never write a list of routes — Next.js looks at the folders inside `src/app` and turns them into web addresses.

| File path                               | URL it becomes            | What it is                   |
| --------------------------------------- | ------------------------- | ---------------------------- |
| `src/app/page.tsx`                      | `/`                       | The public calculator (home) |
| `src/app/dashboard/page.tsx`            | `/dashboard`              | List of your saved plans     |
| `src/app/dashboard/plans/[id]/page.tsx` | `/dashboard/plans/abc123` | One specific saved plan      |
| `src/app/(auth)/login/page.tsx`         | `/login`                  | The sign-in page             |
| `src/app/(auth)/register/page.tsx`      | `/register`               | The sign-up page             |

Two folder names look strange:

- **`[id]` is a _dynamic_ route.** The square brackets mean "this part of the URL can be anything." `plans/[id]` matches `/dashboard/plans/abc123`, `/dashboard/plans/xyz789`, and so on, handing the value to your page as a variable called `id`. That's how one file shows any plan.
- **`(auth)` is a _route group_.** Round brackets are _not_ put in the URL — they're purely for organising files. So `(auth)/login/page.tsx` becomes `/login`, not `/auth/login`.

There's also a special `src/app/layout.tsx` — the **root layout**, a shared wrapper around every page. It sets up `<html>` and `<body>`, loads fonts, and renders the header and footer once. The `{children}` slot is where each page gets dropped in:

```tsx
<body className="flex min-h-dvh flex-col">
  <SiteHeader />
  <main className="flex-1">{children}</main>
  <SiteFooter />
</body>
```

**Server Components vs Client Components.** This trips up most beginners, so go slow. In the App Router, every component is a **Server Component by default.** "Server" means the code runs on the website's host computer _before_ anything reaches the visitor's browser. Because it runs on the server, it can do server-only things: read the logged-in user's session, talk to the database, read secret keys. The visitor only ever gets the finished HTML.

The catch: Server Components are not interactive. They can't use `useState`, can't respond to clicks or typing. When you need interactivity, you make a **Client Component** by writing `"use client";` at the very top of the file — that ships it to the browser so it can stay live. You'll see it on the first line of `calculator.tsx`, `number-field.tsx`, and `inputs-form.tsx`. The purely-presentational `Card` and `Button` are _not_ client components, so they can be used freely in both worlds.

The two work as a team. FireGo's home page, `src/app/page.tsx`, is a **Server Component** (no `"use client"`). It does the server-only work first, then hands off to the **client** `<Calculator/>` for the live part:

```tsx
export default async function HomePage({ searchParams }: { ... }) {
  const session = await auth();          // server-only: who is signed in?
  const sp = await searchParams;         // the shared-link values from the URL
  const initialInputs = parseInputsFromQuery(query.toString());

  return (
    <Calculator
      isAuthed={Boolean(session?.user)}  // pass simple data down...
      initialInputs={initialInputs}      // ...as props
      syncUrl
    />
  );
}
```

The pattern: **server fetches the data, then passes it as props into a client component that handles the interaction.**

**`async` and `await`.** You'll notice pages are `async function` and use `await` a lot. Plain English: some jobs take a moment (asking the database, checking who's signed in). `await` means "pause here and wait for the answer before moving on." A function must be marked `async` to use `await` inside it. Because Server Components run on the server, they're allowed to be `async`.

One Next.js 16 detail: a page's `params` (the `[id]` value) and `searchParams` (the `?key=value` part) now arrive as **Promises** — values that aren't ready yet — so you must `await` them too. From `src/app/dashboard/plans/[id]/page.tsx`:

```tsx
export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;   // a Promise now, in Next.js 16
}) {
  const { id } = await params;       // await to get the actual id
  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });
```

You'll also meet two helpers from `next/navigation`: `redirect("/login")` sends the visitor elsewhere (used when they're not signed in), and `notFound()` shows the 404 page (used when a plan id doesn't exist).

**The shareable-link loop.** This is the cleverest part of FireGo. All the calculator settings live inside the URL itself, like `/?currentAge=30&retirementAge=60&...`, so "copy the link = share your scenario."

_Reading the link_ (server side, on first load): `page.tsx` reads `searchParams` and calls a helper in `src/lib/share.ts` to turn the text back into real inputs. It's deliberately forgiving — a broken or hand-edited link falls back to sensible defaults so the page can never crash:

```ts
const merged = { ...DEFAULT_INPUTS, ...raw };
const parsed = retirementInputSchema.safeParse(merged);
return parsed.success ? parsed.data : DEFAULT_INPUTS;
```

_Writing the link back_ (client side, as you type): inside `calculator.tsx`, an effect mirrors the inputs into the address bar on every change:

```tsx
useEffect(() => {
  if (syncUrl && typeof window !== "undefined") {
    const query = inputsToQuery(inputs);
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}?${query}`,
    );
  }
}, [inputs, syncUrl]);
```

It uses `replaceState` (not `pushState`) on purpose — editing a number updates the link _without_ stuffing the Back button with hundreds of history entries. The complete round-trip: **server reads the URL → fills the calculator → you tweak a number → the client writes it back → you copy that URL → someone else opens it → their server reproduces your exact scenario.**

### Tailwind, design tokens, and the ui/ primitives

Instead of separate CSS files, FireGo styles elements by adding small, single-purpose **utility classes** right in the JSX. Each class does one thing:

```tsx
<div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
```

Reading that: `grid` (grid layout), `gap-6` (space between items), and the `lg:` ones apply only on large screens. The `lg:` prefix is how Tailwind does **responsive design** — no prefix means "all sizes," `lg:` means "large screens and up." Since FireGo is mobile-first, plain classes describe the phone layout and `lg:` variants rearrange for desktop.

**Colours live as design tokens.** They're defined once as named colour variables in `src/app/globals.css`:

```css
:root {
  --background: #f3f5f8; /* soft cool off-white */
  --foreground: #0f1b2d; /* deep navy-slate ink, not pure black */
  --primary: #1e40af; /* trustworthy "deep water" blue */
  --positive: #0c7a52; /* quiet green for "on track" */
  --negative: #b42318; /* muted red for "falls short" */
}
```

A second block, `@theme inline`, hands those variables to Tailwind so they become class names — that's the bridge that turns `--primary` into `bg-primary` (background) or `text-primary` (text). Retune the whole app's mood by changing the hex values in one place. You'll spot these tokens everywhere: `border-l-positive` for the green "On track" stripe, `text-negative` for errors, `bg-surface` for clean white cards.

**Reusable UI primitives** live in `src/components/ui` — `Button`, `Card`, `Input`, and so on — so the look stays consistent. `Button` (`src/components/ui/button.tsx`) is the richest example. It uses a small library called **class-variance-authority** (`cva`) to define named style **variants**:

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium ...",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        ghost: "text-foreground hover:bg-muted",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: { sm: "h-9 px-3", md: "h-10 px-4", lg: "h-11 px-6 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
```

Now elsewhere you just write `<Button variant="ghost" size="sm">` and get the right classes automatically.

**The `cn()` helper combines classes safely.** Almost every primitive runs its classes through `cn()`, defined in `src/lib/utils.ts`:

```ts
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

It does two jobs: `clsx` lets you add classes conditionally, and `tailwind-merge` resolves _conflicts_ so the last class wins (`cn("px-2", "px-4")` becomes just `"px-4"`). That's why a caller can pass an extra `className` to tweak one instance — and win cleanly against a default. It's how `ResultsSummary` reuses the shared `Card` but adds a coloured left stripe:

```tsx
<Card className={cn("border-l-4 p-5", willLast ? "border-l-positive" : "border-l-negative")}>
```

Same trustworthy card, just nudged — green when on track, red when falling short.

### Zod: the bouncer at the door

**Zod** is a validation library: you describe what valid data looks like, and Zod checks real data against it. FireGo's schemas live in `src/lib/validation.ts`, and the clever part is that **the same schema runs in the browser _and_ on the server.** In the browser it gives instant feedback ("that age can't be before today"); on the server it rejects bad data before saving — so junk can't sneak in even if someone bypasses the form. Schemas can also enforce sensible cross-field rules:

```ts
.refine((d) => d.retirementAge >= d.currentAge, {
  message: "Retirement age can't be before your current age.",
  path: ["retirementAge"],
})
```

Zod is also the single source of truth for the plan-input shape stored as JSON in the database — when a plan comes _back out_ of the database, `src/lib/plan.ts` re-validates it with Zod before trusting it.

### Prisma + PostgreSQL/Supabase: the database

A **database** is an organized place to store data so it survives after you close the tab. FireGo uses **PostgreSQL** ("Postgres"), hosted on **Supabase**. Talking to a database directly is fiddly, so FireGo uses **Prisma** — an **ORM** (Object-Relational Mapper), a tool that lets you read and write rows using normal TypeScript (`prisma.user.create(...)`) instead of raw database commands.

**The schema and its models.** `prisma/schema.prisma` describes the database's shape. Each **model** is one table (think of a table as a spreadsheet; the model lists the columns). FireGo has five models: **User** (a person with an account), **Account / Session / VerificationToken** (three standard tables the login library needs), and **Plan** (one saved retirement scenario). Here's `Plan`:

```prisma
model Plan {
  id        String   @id @default(cuid())
  userId    String
  name      String
  inputs    Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}
```

The clever bit is `inputs Json`. Instead of giving every calculator field its own column, FireGo stuffs them all into one column of type `Json` (a text format for structured data). Why? Because the calculator's input list might change over time, and a single JSON column means you don't have to alter the database every time you add a field. (`userId` links each plan to its owner, and `onDelete: Cascade` means deleting a user automatically deletes their plans.)

After changing the schema, you run a **migration** (or `prisma db push` for quick setups) and Prisma updates the real tables on Supabase to match. The schema file is the plan; the migration makes it real.

**One shared connection.** `src/lib/db.ts` creates the Prisma client. Two ideas: First, Prisma 7 uses a **driver adapter** — the `pg` driver speaks to Postgres, and the adapter reads the address from an **environment variable** called `DATABASE_URL` (a secret setting kept outside the code so passwords aren't committed to git):

```ts
const adapter = new PrismaPg({ connectionString });
return new PrismaClient({ adapter });
```

Second, the **singleton pattern** ("only ever make one"). During development the server reloads on every save, and each reload would otherwise open a fresh pile of connections until Postgres runs out. So `db.ts` stashes the one client on `globalThis` and reuses it:

```ts
export const prisma = globalForPrisma.prisma ?? createPrismaClient();
```

The `??` means "use the existing one if there is one; otherwise make a new one."

**The API: route handlers.** An **API endpoint** is a URL your front end can call to ask the server to do something. In Next.js, each endpoint is a file named `route.ts` under `src/app/api/...`, with one function per HTTP method (`GET` to read, `POST` to create, `PUT` to update, `DELETE` to remove). **CRUD** (Create, Read, Update, Delete) is split across two files: `src/app/api/plans/route.ts` (list all / create) and `src/app/api/plans/[id]/route.ts` (get / update / delete one).

Every handler does the same three guard steps. First, an **auth check** — is the request from a logged-in user?

```ts
const session = await auth();
if (!session?.user?.id) return jsonError("You need to be signed in.", 401);
```

Second, for anything that writes, a **Zod validation** of the body. Third — and this matters a lot — an **ownership check**: queries always filter by _both_ the plan id _and_ your own `userId`, so you can only touch your own rows:

```ts
const result = await prisma.plan.updateMany({
  where: { id, userId: session.user.id },   // must be your row
  data: { name: parsed.data.name, inputs: ... },
});
if (result.count === 0) return jsonError("Plan not found.", 404);   // 404, not 403
```

Notice it returns **404 ("not found"), not 403 ("forbidden")** when the plan isn't yours. A 403 would quietly confirm "this plan exists, you're just not allowed" — leaking that other people's plans exist. A 404 gives nothing away. (Those small numbers are **HTTP status codes**: `401` = not logged in, `404` = not found, `201` = created.)

### Auth.js: logging in

Login is handled by **Auth.js** (formerly NextAuth; this is version 5), in `src/auth.ts`. It handles the tricky, security-sensitive parts so you don't write them yourself. There are **two ways to sign in**:

**1. Email and password ("Credentials").** Auth.js looks up the user and uses **bcrypt** to compare your password against the stored hash. Crucially, FireGo **never stores your actual password** — at sign-up (`src/app/api/register/route.ts`) it runs the password through bcrypt, a one-way **hashing** function that scrambles it into a jumble that can't be reversed:

```ts
const passwordHash = await bcrypt.hash(password, 10); // store this, never the raw password
```

At login, bcrypt re-scrambles what you typed and checks the jumbles match:

```ts
const user = await prisma.user.findUnique({ where: { email } });
if (!user || !user.passwordHash) return null; // no such user, or a Google-only account
const valid = await bcrypt.compare(password, user.passwordHash);
if (!valid) return null;
```

So even if the database leaked, your real password wouldn't be in it.

**2. Google OAuth.** **OAuth** is the "Sign in with Google" flow — you prove who you are to Google, Google vouches for you, and FireGo never sees your Google password. It's only switched on when the Google secrets are present, so the app runs fine locally with no Google setup:

```ts
export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);
```

**The session.** Once logged in, FireGo uses `session: { strategy: "jwt" }`. A **JWT** (JSON Web Token) is a small, digitally-signed token stored in a cookie in your browser ("signed" means the server can tell if it's been tampered with). Two reasons: the Credentials provider basically requires it, and reading a signed cookie is faster than a database lookup on every request. Two small callbacks copy your user **id** onto the token and then onto the session, so the ownership checks above can read `session.user.id`.

**Account linking.** One setting worth understanding:

```ts
Google({ allowDangerousEmailAccountLinking: true });
```

The scary name means: if you signed up with email/password using `you@example.com`, then later click "Sign in with Google" on that _same_ email, Google's login attaches to your existing account instead of erroring out. It's labelled "dangerous" because blindly trusting an email could let an attacker hijack an account — but here it's **safe, because Google verifies the email** before vouching for it. The payoff: you can use either method to reach the one account.

### Recharts: the charts

**Recharts** is a charting library made specifically for React, so a chart is just another component. FireGo feeds the engine's year-by-year output (the `yearly` array, explained next) into Recharts to draw the retirement projection — the line you watch climb while you're saving and fall while you're spending. The chart lives alongside the other calculator pieces and redraws automatically whenever the inputs (and therefore the `result`) change.

---

## The calculation engine (the heart)

If FireGo has a heart, it's `src/lib/retirement.ts`. Everything you see — the charts, the "you'll run out at 84" message, the green "on track" badge — comes from this one file doing maths. It has no buttons, no colours, and no internet. Just numbers in, numbers out. That makes it the easiest part of the whole app to understand and to trust.

### What a "pure function" is

A **function** is a named recipe: hand it ingredients (inputs), it does work, it hands back a result. A **pure function** adds two strict rules:

1. Same ingredients in, same result out — every single time.
2. It doesn't touch anything on the side — no database, no server, no changing things elsewhere. It just computes and returns.

Here's the smallest one in the engine. It turns your investment return and inflation into a single "real" return:

```ts
export function computeRealReturn(
  nominalReturnPct: number,
  inflationPct: number,
): number {
  const nominal = nominalReturnPct / 100;
  const inflation = inflationPct / 100;
  return (1 + nominal) / (1 + inflation) - 1;
}
```

Notice what's _not_ there: no React, no database, no network. That's deliberate, and it buys three big things:

- **Easy to test** — you can check the answer with a calculator.
- **Instant in the browser** — it doesn't wait on a server, so FireGo re-runs the whole projection on _every keystroke_.
- **The server can re-run the exact same code** when you save a plan, so the saved result matches what you saw.

### The model in plain terms

The engine simulates your money one **month at a time**, from your current age to the age you want your money to last. **Everything is in today's money** — the cleverest simplification in the app. Instead of guessing what a coffee will cost in 40 years, the engine folds your investment return _and_ inflation into one **real return** (the "Fisher equation": 7% return with 3% inflation comes out to roughly 3.9% real), then works entirely in today's Ringgit. A helper, `monthlyRate`, turns that yearly rate into a monthly one.

There are two halves of life:

**1. The accumulation phase (saving up).** From now until retirement, each month the rule is **grow first, then add this month's contribution**:

```ts
// Grow first, then add this month's contribution.
balance = balance * (1 + rm) + monthlyContrib;
```

Here `rm` is the monthly real return. Your contribution can creep up each year if you set an annual increase. The balance the instant this phase ends is your retirement pot — `balanceAtRetirement`.

**2. The drawdown phase (spending down).** From retirement to your planning age, the rule flips: each month you **withdraw living costs first**, and only what's left grows:

```ts
balance -= monthlyNet; // take out this month's spending
if (balance <= 0) {
  depletedAtMonth = m; // the money has run out
  balance = 0;
} else {
  balance *= 1 + rm; // grow whatever is left
}
```

**"The money runs out"** simply means a withdrawal couldn't be covered. The engine records the month and reports it as `depletionAge` (which can be a fraction like 84.5, since it can run dry mid-year). If the balance survives to your planning age, `willLast` is `true`.

**Sustainable spending** answers "how much _can_ I actually afford?" The engine finds the highest yearly spending that lasts exactly to your planning age, using a **binary search** — guess a level, simulate, lasts → guess higher, runs out → guess lower. After 60 rounds of halving the gap it lands on a precise `sustainableAnnualSpending`, which you compare against what you _want_ to spend.

A reassuring detail: the simulation **can never loop forever** — the horizon is capped by your planning age (at most 120), so there's always a fixed, small number of months.

### The inputs and outputs

Two clear "shapes" are defined in `src/lib/retirement.types.ts`:

- **`RetirementInputs`** — everything the user can tweak: the timeline (`currentAge`, `retirementAge`, `planToAge`), the saving-up numbers (`currentSavings`, `monthlyContribution`, a pension percentage, an optional yearly raise), the assumptions (`nominalReturnPct`, `inflationPct`), and the spending-down numbers (`desiredAnnualSpending`, `otherAnnualIncome`). Sensible starting values live in `src/lib/constants.ts` as `DEFAULT_INPUTS`.
- **`RetirementResult`** — everything handed back: `balanceAtRetirement`, `willLast`, `depletionAge`, `endingBalance`, `sustainableAnnualSpending`, a plain-English `warnings` list, and `yearly` — an array of one `YearRow` per year that the chart and breakdown table are drawn from. Each `YearRow` reconciles: `endBalance = startBalance + contributions + growth - withdrawals`.

(Formatting the numbers for display — turning `1234567` into `"RM1,234,567"` — is kept separate in `src/lib/format.ts`, so the engine never cares about currency symbols.)

### How the tests protect the maths

Maths bugs are sneaky — a wrong answer still _looks_ like a number. So the engine is wrapped in automated tests in `src/lib/retirement.test.ts`, run with **Vitest** (`npm test`). A test is a small program that calls the engine and asserts "the answer should be X." Here's one of the simplest:

```ts
it("with zero real return and no current savings, the pot is just the contributions", () => {
  const inputs = makeInputs({
    currentAge: 59,
    retirementAge: 60, // exactly 12 months of saving
    currentSavings: 0,
    monthlyContribution: 1_000,
    nominalReturnPct: 3,
    inflationPct: 3, // -> real return 0
    desiredAnnualSpending: 0,
  });
  const r = projectRetirement(inputs);
  expect(r.balanceAtRetirement).toBeCloseTo(12_000, 6);
});
```

The trick is choosing inputs you can verify by hand: if return equals inflation, the real return is zero, so the money never grows. Save RM1,000 a month for exactly 12 months from nothing → exactly RM12,000. (`toBeCloseTo` allows a microscopic rounding wiggle.) The rest of the file checks that more saving always grows a bigger pot, that spending zero never runs out, that over-spending triggers depletion, that the phases switch exactly at retirement age, and that even the longest horizon (age 16 to 120) stays fast and finite.

---

## Follow one click end-to-end

Seeing how data travels is the fastest way to understand the app. Here are two journeys.

### (a) You drag the "Current age" slider

1. The slider lives in `src/components/calculator/number-field.tsx`. Dragging it calls back with the new number:
   ```tsx
   onValueChange={(v) => onChange(v[0])}
   ```
2. That `onChange` was handed in by `inputs-form.tsx`, which wraps the raw number into a labelled change (a "patch" — just the one field):
   ```tsx
   onChange={(v) => onChange({ currentAge: v })}
   ```
3. That bubbles up to `calculator.tsx`, which merges the patch into state with `setInputs`:
   ```tsx
   const update = useCallback((patch) => {
     setInputs((prev) => ({ ...prev, ...patch }));
   }, []);
   ```
4. Because state changed, the component **re-renders**, and this line recomputes the projection:
   ```tsx
   const result = useMemo(() => projectRetirement(inputs), [inputs]);
   ```
5. The fresh `result` flows into `<ResultsSummary>`, `<BalanceChart>`, and `<BreakdownTable>` — so the numbers, chart, and table all redraw at once.
6. A `useEffect` (code that runs _after_ a render) writes the inputs back into the address bar so the link is shareable, using `replaceState` so your Back button doesn't fill up.

The whole live-update loop: **drag → onChange → setInputs → re-render → engine recompute → UI redraws → URL updates.** No server, no waiting.

### (b) You click "Save plan" while signed in

This one _does_ talk to the server.

1. The button is in `src/components/calculator/save-plan-bar.tsx`. Clicking runs `save()`, which sends your plan with `fetch` (a built-in way to make a web request):
   ```tsx
   const res = await fetch(planId ? `/api/plans/${planId}` : "/api/plans", {
     method: planId ? "PUT" : "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       name: name.trim() || "My retirement plan",
       inputs,
     }),
   });
   ```
   New plan → `POST /api/plans`. Editing → `PUT /api/plans/<id>`.
2. The server handler is `src/app/api/plans/route.ts`. Its `POST` does three safety checks in order: **Are you signed in?** (`auth()`, else 401). **Is the data valid?** (`planPayloadSchema.safeParse(body)` via Zod, the same rules the browser uses). **Save it.** (`prisma.plan.create(...)` writes the row, inputs stored as a JSON blob). It replies with the new plan and status `201`.
3. Back in `save()`, on success it redirects you to the saved plan's page:
   ```tsx
   if (!planId && data?.plan?.id)
     router.push(`/dashboard/plans/${data.plan.id}`);
   ```

So a save is: **click → POST → session check → Zod validation → Prisma writes the row → redirect.** If you're _not_ signed in, the bar shows a "Sign in to save" button that sends you to `/login` and brings you back afterwards.

---

## Run it & safe first edits

This is the practical part: get it running, then make four tiny edits so the project feels like _yours_. Nothing here can break anything permanently — you can always undo.

### Running it

All commands live in `package.json` under `"scripts"`. Run them with `npm run <name>` (`npm` is Node's package manager — it installs libraries and runs these shortcuts).

| Command              | What it does                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run dev`        | Starts the local dev server with **hot reload** (auto-refreshes on save). Open <http://localhost:3000>. You'll use this 95% of the time. |
| `npm run build`      | Makes the optimised production version. Runs `prisma generate` then `next build`.                                                        |
| `npm run start`      | Serves the production build. Rarely needed locally.                                                                                      |
| `npm test`           | Runs the math tests once and exits (`vitest run`).                                                                                       |
| `npm run test:watch` | Same tests, but stays open and re-runs on save. Great while editing the engine.                                                          |
| `npm run lint`       | Checks code style and catches common mistakes (ESLint).                                                                                  |
| `npm run format`     | Auto-tidies every file with Prettier (also sorts Tailwind classes).                                                                      |

**Before any of that works, you need a `.env` file** — a plain text file holding secret settings that don't belong in code. Copy the template:

```bash
cp .env.example .env
```

The minimum to fill in (full template in `.env.example`):

- **`DATABASE_URL`** — the Postgres connection string. Wired for **Supabase**: in the dashboard go to **Connect → ORMs** and copy the **transaction pooler** string (port `6543`).
- **`DIRECT_URL`** — the **session pooler** string (port `5432`), used only when creating tables. (If skipped, it falls back to `DATABASE_URL`.)
- **`AUTH_SECRET`** — a random string used to sign login sessions. Generate one with `npx auth secret`.
- **`AUTH_GOOGLE_ID`** and **`AUTH_GOOGLE_SECRET`** — _optional_. Fill them to switch on Google sign-in, or leave blank and the "Continue with Google" button hides itself. Email/password login still works without them.

After editing `.env`, create the tables once with `npx prisma db push`, then run `npm run dev`. Full step-by-step is in `README.md`.

### Four safe first edits

Keep `npm run dev` running so you see each change live. Try them one at a time, and feel free to undo.

1. **Change a starting number.** Open `src/lib/constants.ts` and edit `DEFAULT_INPUTS` — for example bump `monthlyContribution: 1_000` to `1_500`. (The `_` is just a readable thousands separator; `1_500` means 1500.) Reload the calculator with a clean URL and it starts from your new default.

2. **Change the brand colour.** Open `src/app/globals.css`, find `--primary: #1e40af;` (the deep blue), and swap in another hex like `#0f766e` (a teal). Save, and every primary button, link, and accent shifts to match — because the whole app reads this one variable.

3. **Edit the headline.** Open `src/app/page.tsx` and change the `<h1>` text:

   ```tsx
   <h1 className="mt-2 text-3xl font-semibold ...">
     Will your savings last through retirement?
   </h1>
   ```

   Rewrite it in your own words. This is a server component (it runs on the server before the page is sent, which is why it can read your login session), but editing the text works exactly as you'd expect.

4. **Copy a test.** Open `src/lib/retirement.test.ts`, copy an existing `it(...)` block, and tweak the numbers. A great one to clone:
   ```ts
   it("saving more each month always produces a bigger retirement pot", () => {
     const low = projectRetirement(makeInputs({ monthlyContribution: 500 }));
     const high = projectRetirement(makeInputs({ monthlyContribution: 1_500 }));
     expect(high.balanceAtRetirement).toBeGreaterThan(low.balanceAtRetirement);
   });
   ```
   `makeInputs({...})` starts from the defaults and overrides only the fields you name; `expect(...).toBeGreaterThan(...)` fails the test if it isn't true. Run `npm run test:watch` and watch your new test go green.

### The three health checks

After any change, run this trio to confirm everything is still solid:

```bash
npm test          # the math tests all pass
npm run lint      # no style or code problems
npm run build     # the whole app compiles for production
```

If all three are clean, your change is safe. If one complains, read the message — it usually names the exact file and line. This trio is the same gate the project uses before deploying, so getting comfortable with it now is the single best habit you can build.

---

## Mini-glossary

| Term                         | Plain-English meaning                                                                                  |
| ---------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Component**                | A reusable piece of screen, written as a function that returns JSX.                                    |
| **JSX**                      | HTML-like markup written inside your code; it can mix in values.                                       |
| **Props**                    | The inputs you pass into a component, like arguments to a function.                                    |
| **State**                    | Data a component remembers that can change over time; changing it triggers a re-render.                |
| **Hook**                     | A special React function whose name starts with `use` (e.g. `useState`, `useMemo`).                    |
| **Re-render**                | React re-running a component to update the screen after state changes.                                 |
| **Server Component**         | A component that runs on the server before reaching the browser; not interactive.                      |
| **Client Component**         | A component marked `"use client"` that runs in the browser and can be interactive.                     |
| **`async` / `await`**        | `await` pauses until a slow job (like a database call) finishes; a function must be `async` to use it. |
| **Pure function**            | A function with no side effects: same inputs always give the same output.                              |
| **Utility class**            | A tiny single-purpose Tailwind class name like `gap-6` or `bg-primary`.                                |
| **Design token**             | A named colour/style variable defined once (in `globals.css`) and reused everywhere.                   |
| **ORM**                      | Object-Relational Mapper — a tool (Prisma) that lets you use the database via normal code.             |
| **Schema**                   | The blueprint describing the database tables (`prisma/schema.prisma`) or valid data shapes (Zod).      |
| **Migration**                | The step that updates the real database tables to match the schema file.                               |
| **Environment variable**     | A secret setting kept outside the code (in `.env`), like a database password.                          |
| **Endpoint / route handler** | A server URL (`route.ts`) your front end calls to save or fetch data.                                  |
| **CRUD**                     | Create, Read, Update, Delete — the four basic things you do with stored data.                          |
| **HTTP status code**         | A standard signal number: `201` created, `401` not logged in, `404` not found.                         |
| **Hashing**                  | A one-way scramble (bcrypt) that protects passwords; it can't be reversed.                             |
| **JWT**                      | A small, signed token stored in a cookie that proves you're logged in.                                 |
| **OAuth**                    | The "Sign in with Google" flow, where another service vouches for who you are.                         |
| **Validation**               | Checking that data has the right shape before trusting it (done with Zod).                             |

---

## Where to go next

You now have the map. The best way to learn is to open files and poke. A great starting point is `src/lib/retirement.ts` — it's pure maths, has no UI or network, and you can change a number, run `npm run test:watch`, and watch the effect immediately. When you want to go deeper on a specific tool, the official docs are friendly and beginner-aware:

- **TypeScript** — https://www.typescriptlang.org/docs/
- **React** — https://react.dev/learn
- **Next.js (App Router)** — https://nextjs.org/docs
- **Tailwind CSS** — https://tailwindcss.com/docs
- **Zod** — https://zod.dev
- **Prisma** — https://www.prisma.io/docs
- **Auth.js (NextAuth v5)** — https://authjs.dev
- **Recharts** — https://recharts.org
- **Vitest** — https://vitest.dev

Read a little, change a little, run the three health checks, repeat. That loop — and the engine in `src/lib/retirement.ts` — is where FireGo will start to feel like yours.
