"use client";

import { useLang } from "@/lib/i18n/provider";
import { LANGS } from "@/lib/i18n/config";
import { cn } from "@/lib/utils";

/**
 * A compact EN | 中文 switch. Shows both languages with the active one
 * highlighted, so it's obvious which is selected and what you'll switch to.
 */
export function LanguageToggle() {
  const { lang, setLang, t } = useLang();

  return (
    <div
      role="group"
      aria-label={t.language.label}
      className="border-border flex items-center rounded-md border p-0.5"
    >
      {LANGS.map((l) => {
        const active = l.code === lang;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLang(l.code)}
            aria-pressed={active}
            aria-label={active ? undefined : t.language.switchTo(l.label)}
            className={cn(
              "rounded px-2 py-1 text-xs font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {l.short}
          </button>
        );
      })}
    </div>
  );
}
