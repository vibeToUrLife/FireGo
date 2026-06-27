/**
 * POST /api/register — create a new email/password account.
 *
 * Flow: validate the body with Zod -> reject duplicate emails -> hash the
 * password with bcrypt -> store the user. We never store the raw password.
 * After this succeeds, the client signs the user in via the credentials provider.
 */

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation";
import { badRequest, jsonError } from "@/lib/api";

// bcrypt + Prisma need the Node.js runtime (not the Edge runtime).
export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  const { name, email, password } = parsed.data;
  const normalisedEmail = email.toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalisedEmail },
  });
  if (existing) {
    return jsonError("An account with that email already exists.", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { name, email: normalisedEmail, passwordHash },
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
