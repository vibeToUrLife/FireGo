/**
 * Language (i18n) configuration.
 *
 * FireGo speaks English and Simplified Chinese. The chosen language lives in a
 * cookie so BOTH server components (which read it via `getDict()`) and client
 * components (via the `LanguageProvider`) render in the same language with no
 * flash of the wrong text on load.
 */

export type Lang = "en" | "zh";

export const LANGS: ReadonlyArray<{
  code: Lang;
  label: string;
  short: string;
}> = [
  { code: "en", label: "English", short: "EN" },
  { code: "zh", label: "简体中文", short: "中文" },
];

export const DEFAULT_LANG: Lang = "en";

/** Cookie that remembers the visitor's language choice (read on the server). */
export const LANG_COOKIE = "lang";

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "zh";
}
