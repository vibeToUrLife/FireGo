"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RetirementResult } from "@/lib/retirement.types";
import { sensitivitySeries, type Scenario } from "@/lib/chart-data";
import {
  formatCurrency,
  formatCurrencyShort,
  formatAge,
  formatPercent,
} from "@/lib/format";
import { useDict } from "@/lib/i18n/provider";
import type { Dict } from "@/lib/i18n/dictionary";

const COLORS: Record<Scenario["key"], string> = {
  pessimistic: "var(--warning)",
  base: "var(--primary)",
  optimistic: "var(--positive)",
};

/** The translated display name for each scenario. */
function titles(t: Dict): Record<Scenario["key"], string> {
  return {
    pessimistic: t.charts.lowerReturns,
    base: t.charts.yourEstimate,
    optimistic: t.charts.higherReturns,
  };
}

function ScenarioTooltip({
  active,
  payload,
  label,
  currency = "RM",
}: {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; color: string }>;
  label?: number;
  currency?: string;
}) {
  const t = useDict();
  if (!active || !payload || payload.length === 0) return null;
  const TITLES = titles(t);
  const order: Scenario["key"][] = ["optimistic", "base", "pessimistic"];
  return (
    <div className="border-border bg-surface rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="text-foreground font-medium">
        {t.charts.ageLabel(label ?? 0)}
      </p>
      {order.map((key) => {
        const row = payload.find((p) => p.dataKey === key);
        if (!row) return null;
        return (
          <p
            key={key}
            className="flex items-center justify-between gap-4 font-mono tabular-nums"
          >
            <span className="text-muted-foreground">{TITLES[key]}</span>
            <span style={{ color: COLORS[key] }}>
              {formatCurrency(row.value, currency)}
            </span>
          </p>
        );
      })}
    </div>
  );
}

/** One legend entry: colour, what return it used, and how it ends up. */
function LegendItem({ scenario }: { scenario: Scenario }) {
  const t = useDict();
  const TITLES = titles(t);
  const verdict = scenario.willLast
    ? t.charts.lastsWholePlan
    : scenario.depletionAge !== null
      ? t.charts.runsOutAtAge(formatAge(scenario.depletionAge))
      : t.charts.runsOutEarly;
  return (
    <li className="flex items-start gap-2">
      <span
        className="mt-1 inline-block h-0.5 w-4 shrink-0 rounded-full"
        style={{ background: COLORS[scenario.key] }}
      />
      <span className="text-xs">
        <span className="text-foreground font-medium">
          {TITLES[scenario.key]}
        </span>{" "}
        <span className="text-muted-foreground">
          {t.charts.returnLabel(formatPercent(scenario.nominalReturnPct, 0))}
          <span
            style={{
              color: scenario.willLast ? "var(--positive)" : "var(--negative)",
            }}
          >
            {verdict}
          </span>
        </span>
      </span>
    </li>
  );
}

/**
 * The same plan re-run at a lower and a higher return, to show how much the
 * outcome leans on that one guess. The spread between the lines is the honest
 * message: a few points of return is the difference between comfort and running
 * short. Everything else (saving, spending, ages) is held identical.
 */
export function ScenarioChart({ result }: { result: RetirementResult }) {
  const t = useDict();
  const c = result.inputs.currency;
  const { scenarios, points } = sensitivitySeries(result.inputs);
  const retirementAge = result.inputs.retirementAge;
  // Legend reads nicely high → low.
  const legendOrder = [...scenarios].reverse();

  return (
    <div className="space-y-3">
      <div
        className="h-[300px] w-full"
        role="img"
        aria-label={t.charts.scenarioAria(
          result.inputs.currentAge,
          result.inputs.planToAge,
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={points}
            margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid stroke="var(--border)" vertical={false} />
            <XAxis
              dataKey="age"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickMargin={8}
              minTickGap={24}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={56}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              tickFormatter={(v: number) => formatCurrencyShort(v, c)}
            />
            <Tooltip content={<ScenarioTooltip currency={c} />} />
            <ReferenceLine
              x={retirementAge}
              stroke="var(--muted-foreground)"
              strokeDasharray="4 4"
              label={{
                value: t.charts.retire(retirementAge),
                position: "insideTopLeft",
                fill: "var(--muted-foreground)",
                fontSize: 11,
              }}
            />
            <Line
              type="monotone"
              dataKey="optimistic"
              stroke={COLORS.optimistic}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="base"
              stroke={COLORS.base}
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="pessimistic"
              stroke={COLORS.pessimistic}
              strokeWidth={2}
              strokeDasharray="5 4"
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <ul className="space-y-1.5">
        {legendOrder.map((s) => (
          <LegendItem key={s.key} scenario={s} />
        ))}
      </ul>
    </div>
  );
}
