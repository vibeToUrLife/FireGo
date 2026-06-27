import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, LANG_COOKIE, isLang, type Lang } from "./config";
import { dict, type Dict } from "./dictionary";

/**
 * Server-side language helpers. Server components read the chosen language from
 * the cookie and pull strings from the dictionary — no client JavaScript needed,
 * so the first paint is already in the right language.
 */

export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

export async function getDict(): Promise<Dict> {
  return dict[await getLang()];
}
