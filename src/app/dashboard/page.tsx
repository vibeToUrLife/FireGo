import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { parsePlanInputs } from "@/lib/plan";
import { projectRetirement } from "@/lib/retirement";
import { formatCurrency, formatAge } from "@/lib/format";
import { getDict } from "@/lib/i18n/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeletePlanButton } from "@/components/dashboard/delete-plan-button";
import { CircleCheck, TriangleAlert, Plus, ArrowRight } from "lucide-react";

// Reads the session + database, so it must render per-request.
export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const t = await getDict();
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?next=/dashboard");
  }

  const plans = await prisma.plan.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {t.dashboard.title}
          </h1>
          <p className="text-muted-foreground text-sm">
            {t.dashboard.subtitle}
          </p>
        </div>
        <Button asChild>
          <Link href="/">
            <Plus />
            {t.dashboard.newPlan}
          </Link>
        </Button>
      </div>

      {plans.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <p className="text-foreground font-medium">
            {t.dashboard.emptyTitle}
          </p>
          <p className="text-muted-foreground mx-auto mt-1 max-w-sm text-sm">
            {t.dashboard.emptyBody}
          </p>
          <Button asChild className="mt-4">
            <Link href="/">
              {t.dashboard.openCalculator}
              <ArrowRight />
            </Link>
          </Button>
        </Card>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => {
            const inputs = parsePlanInputs(plan.inputs);
            const result = inputs ? projectRetirement(inputs) : null;

            return (
              <Card key={plan.id} className="flex flex-col">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="truncate">{plan.name}</CardTitle>
                    {result &&
                      (result.willLast ? (
                        <Badge tone="positive">
                          <CircleCheck className="size-3.5" />
                          {t.dashboard.onTrack}
                        </Badge>
                      ) : (
                        <Badge tone="negative">
                          <TriangleAlert className="size-3.5" />
                          {t.dashboard.short}
                        </Badge>
                      ))}
                  </div>
                  {inputs && (
                    <CardDescription>
                      {t.dashboard.retireAtPlanTo(
                        inputs.retirementAge,
                        inputs.planToAge,
                      )}
                    </CardDescription>
                  )}
                </CardHeader>

                <CardContent className="flex flex-1 flex-col justify-end gap-3">
                  {result && inputs ? (
                    <dl className="space-y-1 text-sm">
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">
                          {t.dashboard.atRetirement}
                        </dt>
                        <dd className="font-mono tabular-nums">
                          {formatCurrency(
                            result.balanceAtRetirement,
                            inputs.currency,
                          )}
                        </dd>
                      </div>
                      <div className="flex justify-between gap-2">
                        <dt className="text-muted-foreground">
                          {t.dashboard.moneyLastsTo}
                        </dt>
                        <dd className="font-mono tabular-nums">
                          {result.willLast
                            ? t.dashboard.agePlus(inputs.planToAge)
                            : t.dashboard.ageValue(
                                result.depletionAge !== null
                                  ? formatAge(result.depletionAge)
                                  : "—",
                              )}
                        </dd>
                      </div>
                    </dl>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {t.dashboard.savedScenario}
                    </p>
                  )}

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/dashboard/plans/${plan.id}`}>
                        {t.dashboard.open}
                      </Link>
                    </Button>
                    <DeletePlanButton planId={plan.id} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
