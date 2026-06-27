/**
 * The catch-all Auth.js route. Every request to /api/auth/* (sign-in, sign-out,
 * callbacks, session, the Google OAuth dance…) is handled here. We just re-export
 * the handlers built in src/auth.ts.
 */

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
