"use client";

import type { RetirementResult } from "@/lib/retirement.types";
import { formatCurrency, formatAge, formatPercent } from "@/lib/format";
import { useDict } from "@/lib/i18n/provider";
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
  const t = useDict();
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
  const depletionText = depletionAge !== null ? formatAge(depletionAge) : "—";
  const yearsShortText = t.format.years(Math.round(yearsShort));

  return (
    <section aria-label={t.results.ariaResults} className="space-y-4">
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
              {t.results.onTrack}
            </Badge>
          ) : (
            <Badge tone="negative">
              <TriangleAlert className="size-3.5" />
              {t.results.fallsShort}
            </Badge>
          )}
        </div>

        {willLast ? (
          <>
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              {t.results.lastsThroughAge(inputs.planToAge)}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {endingBalance > 1
                ? t.results.leftOver(
                    formatCurrency(endingBalance, c),
                    inputs.planToAge,
                  )
                : t.results.itsClose}
            </p>
          </>
        ) : (
          <>
            <h2 className="mt-3 text-xl font-semibold tracking-tight sm:text-2xl">
              {t.results.runsOutAroundAge(depletionText)}
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              {t.results.shortfallBody(yearsShortText, inputs.planToAge)}
            </p>
          </>
        )}
      </Card>

      {/* Key figures */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<Wallet />}
          label={t.results.statAtRetirement}
          value={formatCurrency(balanceAtRetirement, c)}
          sub={t.results.statSavedByAge(inputs.retirementAge)}
        />
        <Stat
          icon={<CalendarClock />}
          label={t.results.statMoneyLastsTo}
          value={
            willLast
              ? t.results.statAgePlus(inputs.planToAge)
              : t.results.statAgeValue(depletionText)
          }
          sub={
            willLast
              ? t.results.statFullPlan
              : t.results.statShort(yearsShortText)
          }
        />
        <Stat
          icon={<Coins />}
          label={t.results.statCanSpend}
          value={formatCurrency(sustainableAnnualSpending, c)}
          sub={t.results.statPerMoSustainably(
            formatCurrency(sustainableAnnualSpending / 12, c),
          )}
        />
        <Stat
          icon={<TrendingUp />}
          label={t.results.statRealReturn}
          value={formatPercent(realAnnualReturnPct)}
          sub={t.results.statPerYearAfterInflation}
        />
      </div>

      {/* Calm, non-alarming notes about unusual inputs */}
      {warnings.length > 0 && (
        <ul className="space-y-1.5">
          {warnings.map((w) => (
            <li key={w} className="text-muted-foreground flex gap-2 text-xs">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              <span>{t.warnings[w]}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
