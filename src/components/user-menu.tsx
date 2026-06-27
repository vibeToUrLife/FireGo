"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDict } from "@/lib/i18n/provider";

/**
 * Shows the signed-in user's initial + name and a sign-out button. Kept as a
 * tiny client component because signing out is a browser action.
 */
export function UserMenu({
  name,
  email,
}: {
  name?: string | null;
  email?: string | null;
}) {
  const t = useDict();
  const label = name || email || t.nav.account;
  const initial = (name || email || "?").charAt(0).toUpperCase();

  return (
    <div className="flex items-center gap-2">
      <span
        aria-hidden="true"
        className="bg-primary-soft text-primary grid size-8 place-items-center rounded-full text-sm font-semibold"
      >
        {initial}
      </span>
      <span className="text-muted-foreground hidden max-w-[10rem] truncate text-sm sm:inline">
        {label}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => signOut({ callbackUrl: "/" })}
        aria-label={t.nav.signOut}
      >
        <LogOut />
        <span className="hidden sm:inline">{t.nav.signOut}</span>
      </Button>
    </div>
  );
}
