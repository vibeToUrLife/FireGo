/**
 * Small helpers shared by the API route handlers, so every endpoint returns
 * errors in the same shape: { error: string, issues?: {path, message}[] }.
 */

import { NextResponse } from "next/server";
import type { ZodError } from "zod";

/** Turn a Zod validation failure into a 400 response with readable field errors. */
export function badRequest(
  error: ZodError,
  message = "Some details need fixing.",
) {
  return NextResponse.json(
    {
      error: message,
      issues: error.issues.map((i) => ({
        path: i.path.join("."),
        message: i.message,
      })),
    },
    { status: 400 },
  );
}

/** A plain JSON error with a status code. */
export function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}
