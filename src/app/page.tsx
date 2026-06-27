import { auth } from "@/auth";
import { Calculator } from "@/components/calculator/calculator";
import { parseInputsFromQuery } from "@/lib/share";

/**
 * The public calculator. It's a server component so it can: (a) read the session
 * to tell the calculator whether the visitor is signed in, and (b) parse any
 * shared-link parameters from the URL and hand them to the calculator as its
 * starting point. The live updates then happen in the client <Calculator>.
 *
 * Next.js 16: searchParams arrives as a Promise.
 */
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  const sp = await searchParams;

  // Rebuild a query string from the params so we can reuse the shared parser.
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (typeof value === "string") query.set(key, value);
  }
  const initialInputs = parseInputsFromQuery(query.toString());

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <section className="mx-auto max-w-2xl text-center">
        <p className="text-primary text-sm font-medium">Retirement, honestly</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Will your savings last through retirement?
        </h1>
        <p className="text-muted-foreground mt-3 text-pretty">
          See how your money grows, when you could retire, and whether it lasts
          — all in today&apos;s money, with no hype. Change anything and the
          answer updates instantly.
        </p>
      </section>

      <div className="mt-10">
        <Calculator
          isAuthed={Boolean(session?.user)}
          initialInputs={initialInputs}
          syncUrl
        />
      </div>
    </div>
  );
}
