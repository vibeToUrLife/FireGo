/**
 * The shared Prisma client (our gateway to Postgres).
 *
 * Two things worth understanding here:
 *
 * 1. Prisma 7 connects through a "driver adapter" — a thin wrapper around a real
 *    database driver (node-postgres / `pg` here) — instead of reading the URL
 *    itself. We build the adapter from DATABASE_URL and hand it to the client.
 *
 * 2. The singleton pattern: in development Next.js reloads modules on every
 *    save. Without guarding, each reload would spin up a brand-new client and a
 *    new connection pool, eventually exhausting the database. Stashing the
 *    client on `globalThis` keeps a single instance across reloads.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
    );
  }
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
