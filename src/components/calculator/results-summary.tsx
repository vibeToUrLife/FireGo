import type { RetirementResult } from "@/lib/retirement.types";
import {
  formatCurrency,
  formatAge,
  formatYears,
  formatPercent,
} from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Wallet,
  CalendarClock,
  Coins,
  TrendingUp,
  CircleCheck,
  TriangleAlert,
  Info,
} from "lucide-react";

/** One labelled figure in the stats grid. */
function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <Card className="p-4">
      <div className="text-muted-foreground flex items-center gap-2">
        <span className="text-muted-foreground [&_svg]:size-4">{icon}</span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-foreground mt-2 font-mono text-xl font-semibold tabular-nums">
        {value}
      </p>
      {sub && <p className="text-muted-foreground mt-0.5 text-xs">{sub}</p>}
    </Card>
  );
}

export function ResultsSummary({ result }: { result: RetirementResult }) {
  const {
    inputs,
    willLast,
    depletionAge,
    endingBalance,
    yearsShort,
    balanceAtRetirement,
    sustainableAnnualSpending,
    realAnnualReturnPct,
    warnings,
  } = result;
  const c = inputs.currency;

  return (
    <section aria-label="Your results" className="space-y-4">
      {/* Headline verdict */}
      <Card
        className={cn(
          "border-l-4 p-5",
          willLast ? "border-l-positive" : "border-l-negative",
        )}
      >
        <div className="flex flex-wrap items-center gap-3">
          {willLast ? (
            <Badge tone="positive">
              <CircleCheck className="size-3.5" />
              On track
            </Badge>
          ) : (
            <Badge tone="negative">
              <TriangleAlert className="size-3.5" />
              Falls short
            </Badge>
          )}
        </div>

        {willLast ? (
          <>
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              Your savings last through age {inputs.planToAge}.
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {endingBalance > 1
                ? `You'd have roughly ${formatCurrency(endingBalance, c)} left over at age ${inputs.planToAge} — a comfortable margin.`
                : "It's close — your savings cover your plan with little to spare."}
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              Your savings run out around age{" "}
              {depletionAge !== null ? formatAge(depletionAge) : "—"}.
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              That&apos;s about {formatYears(yearsShort)} short of your age-
              {inputs.planToAge} goal. Try saving a little more, spending less,
              or retiring later.
            </p>
          </>
        )}
      </Card>

      {/* Key figures */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<Wallet />}
          label="At retirement"
          value={formatCurrency(balanceAtRetirement, c)}
          sub={`saved by age ${inputs.retirementAge}`}
        />
        <Stat
          icon={<CalendarClock />}
          label="Money lasts to"
          value={
            willLast
              ? `Age ${inputs.planToAge}+`
              : `Age ${depletionAge !== null ? formatAge(depletionAge) : "—"}`
          }
          sub={willLast ? "your full plan" : `${formatYears(yearsShort)} short`}
        />
        <Stat
          icon={<Coins />}
          label="Can spend / year"
          value={formatCurrency(sustainableAnnualSpending, c)}
          sub={`≈ ${formatCurrency(sustainableAnnualSpending / 12, c)}/mo sustainably`}
        />
        <Stat
          icon={<TrendingUp />}
          label="Real return"
          value={formatPercent(realAnnualReturnPct)}
          sub="a year, after inflation"
        />
      </div>

      {/* Calm, non-alarming notes about unusual inputs */}
      {warnings.length > 0 && (
        <ul className="space-y-1.5">
          {warnings.map((w, i) => (
            <li key={i} className="text-muted-foreground flex gap-2 text-xs">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>{w}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
