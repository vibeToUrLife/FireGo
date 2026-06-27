"use client";

import type { RetirementResult } from "@/lib/retirement.types";
import { spendingComparison } from "@/lib/chart-data";
import { formatCurrency } from "@/lib/format";
import { useDict } from "@/lib/i18n/provider";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A single labelled bar, scaled against the larger of the two values. */
function Bar({
  label,
  value,
  max,
  currency,
  color,
  perYrLabel,
}: {
  label: string;
  value: number;
  max: number;
  currency: string;
  color: string;
  perYrLabel: string;
}) {
  const pct = max > 0 ? Math.max(2, (value / max) * 100) : 0;
  return (
    <div className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="text-foreground font-mono font-medium tabular-nums">
          {formatCurrency(value, currency)}
          <span className="text-muted-foreground font-sans font-normal">
            {" "}
            {perYrLabel}
          </span>
        </span>
      </div>
      <div
        className="bg-muted h-2.5 overflow-hidden rounded-full"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

/**
 * The "can I actually afford my plan?" check: the spending you want, against the
 * most your savings can sustain to the end of your horizon. A green/red verdict
 * line spells out the headroom or shortfall, per year and per month.
 */
export function SpendingComparison({ result }: { result: RetirementResult }) {
  const t = useDict();
  const c = result.inputs.currency;
  const { desired, sustainable, difference, meetsDesired } =
    spendingComparison(result);
  const max = Math.max(desired, sustainable, 1);
  const gap = Math.abs(difference);

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h3 className="text-sm font-semibold">{t.spending.title}</h3>
        <p className="text-muted-foreground mt-0.5 text-xs">
          {t.spending.desc(result.inputs.planToAge)}
        </p>
      </div>

      <div className="space-y-3">
        <Bar
          label={t.spending.wantToSpend}
          value={desired}
          max={max}
          currency={c}
          color="var(--muted-foreground)"
          perYrLabel={t.spending.perYr}
        />
        <Bar
          label={t.spending.savingsSustain}
          value={sustainable}
          max={max}
          currency={c}
          color={meetsDesired ? "var(--positive)" : "var(--negative)"}
          perYrLabel={t.spending.perYr}
        />
      </div>

      <p
        className={cn(
          "text-sm font-medium",
          meetsDesired ? "text-positive" : "text-negative",
        )}
      >
        {meetsDesired
          ? t.spending.headroom(
              formatCurrency(gap, c),
              formatCurrency(gap / 12, c),
            )
          : t.spending.shortfall(
              formatCurrency(gap, c),
              formatCurrency(gap / 12, c),
            )}
      </p>
    </Card>
  );
}
