/**
 * Module augmentation: teach TypeScript that our session/token carry a user `id`.
 *
 * Auth.js (NextAuth) ships generic types; here we extend them so that
 * `session.user.id` and `token.id` are known throughout the app instead of
 * being `any` or missing. This file has no runtime code — it's types only.
 */

import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
  }
}
