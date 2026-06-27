/**
 * Auth.js (NextAuth v5) configuration — the heart of authentication.
 *
 * Exports four things the rest of the app uses:
 *   - handlers : the GET/POST route handlers for /api/auth/*
 *   - auth     : read the current session in server components / route handlers
 *   - signIn   : trigger a sign-in (used by server actions if needed)
 *   - signOut  : trigger a sign-out
 *
 * Two sign-in methods, exactly as chosen in the design:
 *   1. Credentials  — email + password, checked against a bcrypt hash we store.
 *   2. Google OAuth — only enabled if AUTH_GOOGLE_ID/SECRET are present, so the
 *      app still runs locally with no Google setup.
 *
 * Session strategy is "jwt": the Credentials provider requires it (you can't
 * persist a database session for a hand-rolled login), and it keeps every
 * request fast since the session lives in a signed cookie, not the database.
 */

import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

/** Google is only wired up when both credentials are configured. */
export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "Email and password",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(credentials) {
      const email =
        typeof credentials?.email === "string" ? credentials.email : "";
      const password =
        typeof credentials?.password === "string" ? credentials.password : "";
      if (!email || !password) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      // No user, or a Google-only account with no password set.
      if (!user || !user.passwordHash) return null;

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
      };
    },
  }),
];

if (googleEnabled) {
  providers.push(
    Google({
      // Link a Google sign-in to an existing account that has the same email.
      // Safe here because Google verifies the email — it lets you use BOTH
      // email/password and Google for the one account, instead of hitting the
      // "OAuthAccountNotLinked" error.
      allowDangerousEmailAccountLinking: true,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  providers,
  callbacks: {
    // Persist the user id onto the JWT the first time it's issued…
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    // …then expose it on the session object the app reads.
    async session({ session, token }) {
      if (session.user && typeof token.id === "string") {
        session.user.id = token.id;
      }
      return session;
    },
  },
});
