import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parsePlanInputs } from "@/lib/plan";
import { Calculator } from "@/components/calculator/calculator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const plan = await prisma.plan.findFirst({
    where: { id, userId: session.user.id },
  });
  if (!plan) {
    notFound();
  }

  const inputs = parsePlanInputs(plan.inputs);
  if (!inputs) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft />
            Back to plans
          </Link>
        </Button>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">
          {plan.name}
        </h1>
        <p className="text-muted-foreground text-sm">
          Adjust anything and hit Update to save your changes.
        </p>
      </div>

      <Calculator
        initialInputs={inputs}
        planId={plan.id}
        planName={plan.name}
        isAuthed
      />
    </div>
  );
}
