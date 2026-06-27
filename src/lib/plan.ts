/**
 * Helper for reading a plan's stored inputs back out of the database.
 *
 * The inputs were saved as a JSON blob, so on the way out we validate them with
 * the same Zod schema. If a row is somehow malformed (hand-edited, or from an
 * older shape), we return null rather than trusting bad data.
 */

import { retirementInputSchema } from "./validation";
import type { RetirementInputs } from "./retirement.types";

export function parsePlanInputs(json: unknown): RetirementInputs | null {
  const parsed = retirementInputSchema.safeParse(json);
  return parsed.success ? parsed.data : null;
}
