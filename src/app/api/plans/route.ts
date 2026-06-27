/**
 * /api/plans — the collection endpoint.
 *   GET  -> list the signed-in user's saved plans (newest first)
 *   POST -> create a new plan from { name, inputs }
 *
 * Every request is gated on a valid session, and the body is validated with the
 * same Zod schema the browser uses — so nothing invalid ever reaches the table.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { planPayloadSchema } from "@/lib/validation";
import { badRequest, jsonError } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("You need to be signed in.", 401);
  }

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ plans });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("You need to be signed in.", 401);
  }

  const body = await request.json().catch(() => null);
  const parsed = planPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  const plan = await prisma.plan.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      // Inputs are stored as a JSON blob; the cast tells Prisma it's valid JSON.
      inputs: parsed.data.inputs as unknown as Prisma.InputJsonObject,
    },
  });

  return NextResponse.json({ plan }, { status: 201 });
}
