/**
 * /api/plans/[id] — the single-plan endpoint.
 *   GET    -> fetch one plan you own
 *   PUT    -> update its name/inputs
 *   DELETE -> remove it
 *
 * Ownership is enforced everywhere: we only ever touch rows where userId matches
 * the signed-in user, and we return 404 (not 403) for someone else's plan so the
 * existence of other people's plans isn't leaked.
 *
 * Next.js 16 note: in route handlers `params` is now a Promise, so we await it.
 */

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Prisma } from "@/generated/prisma/client";
import { planPayloadSchema } from "@/lib/validation";
import { badRequest, jsonError } from "@/lib/api";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("You need to be signed in.", 401);
  }
  const { id } = await context.params;

  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!plan) {
    return jsonError("Plan not found.", 404);
  }

  return NextResponse.json({ plan });
}

export async function PUT(request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("You need to be signed in.", 401);
  }
  const { id } = await context.params;

  const body = await request.json().catch(() => null);
  const parsed = planPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return badRequest(parsed.error);
  }

  // Update only if this user owns the row; updateMany returns a count so we can
  // tell "not found / not yours" apart from a successful change.
  const result = await prisma.plan.updateMany({
    where: { id, userId: session.user.id },
    data: {
      name: parsed.data.name,
      inputs: parsed.data.inputs as unknown as Prisma.InputJsonObject,
    },
  });
  if (result.count === 0) {
    return jsonError("Plan not found.", 404);
  }

  const plan = await prisma.plan.findUnique({ where: { id } });
  return NextResponse.json({ plan });
}

export async function DELETE(_request: Request, context: Context) {
  const session = await auth();
  if (!session?.user?.id) {
    return jsonError("You need to be signed in.", 401);
  }
  const { id } = await context.params;

  const result = await prisma.plan.deleteMany({
    where: { id, userId: session.user.id },
  });
  if (result.count === 0) {
    return jsonError("Plan not found.", 404);
  }

  return NextResponse.json({ ok: true });
}
