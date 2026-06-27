"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { LANG_COOKIE, type Lang } from "./config";
import { dict, type Dict } from "./dictionary";

/**
 * Client-side language state. Initialised from the same cookie the server read
 * (passed in as `initialLang`), so there's no mismatch on hydration. Switching
 * language updates the cookie and calls `router.refresh()` so server components
 * re-render in the new language too.
 */

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  /** The strings for the current language. */
  t: Dict;
}

const LangContext = createContext<LangContextValue | null>(null);

export function LanguageProvider({
  initialLang,
  children,
}: {
  initialLang: Lang;
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>(initialLang);
  const router = useRouter();

  const setLang = useCallback(
    (next: Lang) => {
      setLangState(next);
      // Remember the choice for a year, for this and future visits.
      document.cookie = `${LANG_COOKIE}=${next};path=/;max-age=31536000;samesite=lax`;
      // Re-render server components (header/footer/pages) in the new language.
      router.refresh();
    },
    [router],
  );

  const value = useMemo<LangContextValue>(
    () => ({ lang, setLang, t: dict[lang] }),
    [lang, setLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) {
    throw new Error("useLang must be used within a <LanguageProvider>");
  }
  return ctx;
}

/** Convenience for components that only need the strings, not the setter. */
export function useDict(): Dict {
  return useLang().t;
}
