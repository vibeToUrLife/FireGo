/**
 * Encode/decode calculator inputs to and from the URL query string.
 *
 * This is the "copy the link = share your scenario" feature. We keep it as a
 * tiny URLSearchParams helper (the nuqs-style approach the brief allows) so the
 * whole input set round-trips through the address bar and reloads identically.
 */

import { retirementInputSchema } from "./validation";
import { DEFAULT_INPUTS } from "./constants";
import type { RetirementInputs } from "./retirement.types";

/** Inputs -> "currentAge=30&retirementAge=60&…" */
export function inputsToQuery(inputs: RetirementInputs): string {
  const params = new URLSearchParams();
  (Object.keys(inputs) as (keyof RetirementInputs)[]).forEach((key) => {
    params.set(key, String(inputs[key]));
  });
  return params.toString();
}

/**
 * Query string -> inputs. Anything missing falls back to the defaults, and an
 * unparseable/invalid query falls back to the defaults entirely — so a hand-
 * edited or truncated link can never crash the page.
 */
export function parseInputsFromQuery(search: string): RetirementInputs {
  const params = new URLSearchParams(search);
  const raw: Record<string, string> = {};
  for (const [key, value] of params.entries()) {
    raw[key] = value;
  }
  // Layer provided values over the defaults, then validate/coerce the result.
  const merged = { ...DEFAULT_INPUTS, ...raw };
  const parsed = retirementInputSchema.safeParse(merged);
  return parsed.success ? parsed.data : DEFAULT_INPUTS;
}
