import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";

/**
 * The top navigation. It's a server component, so it can read the session
 * directly with `auth()` and show the right links (Sign in vs My plans) without
 * any client-side flash.
 */
export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="border-border bg-surface/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="rounded-md" aria-label="FireGo home">
          <Brand />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">Calculator</Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">My plans</Link>
              </Button>
              <UserMenu name={user.name} email={user.email} />
            </>
          ) : (
            <Button asChild variant="primary" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
