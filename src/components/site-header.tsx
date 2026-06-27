import Link from "next/link";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { Brand } from "@/components/brand";
import { UserMenu } from "@/components/user-menu";
import { LanguageToggle } from "@/components/language-toggle";
import { getDict } from "@/lib/i18n/server";

/**
 * The top navigation. It's a server component, so it can read the session
 * directly with `auth()` and show the right links (Sign in vs My plans) without
 * any client-side flash.
 */
export async function SiteHeader() {
  const session = await auth();
  const user = session?.user;
  const t = await getDict();

  return (
    <header className="border-border bg-surface/85 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="rounded-md" aria-label={t.nav.brandHome}>
          <Brand />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          <LanguageToggle />
          <Button asChild variant="ghost" size="sm">
            <Link href="/">{t.nav.calculator}</Link>
          </Button>
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm">
                <Link href="/dashboard">{t.nav.myPlans}</Link>
              </Button>
              <UserMenu name={user.name} email={user.email} />
            </>
          ) : (
            <Button asChild variant="primary" size="sm">
              <Link href="/login">{t.nav.signIn}</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
