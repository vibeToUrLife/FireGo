"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RetirementResult } from "@/lib/retirement.types";
import { composeBalanceSeries, type CompositionPoint } from "@/lib/chart-data";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { useDict } from "@/lib/i18n/provider";

const DEPOSITS = "var(--primary)";
const GROWTH = "var(--positive)";

function CompositionTooltip({
  active,
  payload,
  currency = "RM",
}: {
  active?: boolean;
  payload?: Array<{ payload: CompositionPoint }>;
  currency?: string;
}) {
  const t = useDict();
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  const total = p.deposits + p.growth;
  const growthShare = total > 0 ? Math.round((p.growth / total) * 100) : 0;
  return (
    <div className="border-border bg-surface rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="text-foreground font-medium">{t.charts.ageLabel(p.age)}</p>
      <p className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-muted-foreground">{t.charts.yourDeposits}</span>
        <span style={{ color: DEPOSITS }}>
          {formatCurrency(p.deposits, currency)}
        </span>
      </p>
      <p className="flex items-center justify-between gap-4 font-mono tabular-nums">
        <span className="text-muted-foreground">
          {t.charts.investmentGrowth}
        </span>
        <span style={{ color: GROWTH }}>
          {formatCurrency(p.growth, currency)}
        </span>
      </p>
      <p className="text-muted-foreground border-border mt-1 border-t pt-1">
        {t.charts.ofPotIsGrowth(growthShare)}
      </p>
    </div>
  );
}

/**
 * The same balance shape as the main chart, but split into the two things it's
 * made of: the money you actually put in (deposits) and what the market added
 * on top (investment growth). The growth band fattening over time is compound
 * interest made visible.
 */
export function CompositionChart({ result }: { result: RetirementResult }) {
  const t = useDict();
  const c = result.inputs.currency;
  const data = composeBalanceSeries(result);
  const retirementAge = result.inputs.retirementAge;

  const atRetirement =
    data.find((p) => p.age === retirementAge) ?? data[data.length - 1];
  const retTotal = atRetirement
    ? atRetirement.deposits + atRetirement.growth
    : 0;
  const growthShare =
    retTotal > 0 ? Math.round((atRetirement.growth / retTotal) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: DEPOSITS }}
          />
          <span className="text-muted-foreground">{t.charts.yourDeposits}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: GROWTH }}
          />
          <span className="text-muted-foreground">
            {t.charts.investmentGrowth}
          </span>
        </span>
      </div>

      <div
        className="h-[300px] w-full"
        role="img"
        aria-label={t.charts.compositionAria(
          retirementAge,
          growthShare,
          formatCurrency(retTotal, c),
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
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
            <Tooltip content={<CompositionTooltip currency={c} />} />
            <Area
              type="monotone"
              dataKey="deposits"
              stackId="pot"
              stroke={DEPOSITS}
              strokeWidth={1.5}
              fill={DEPOSITS}
              fillOpacity={0.18}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="growth"
              stackId="pot"
              stroke={GROWTH}
              strokeWidth={1.5}
              fill={GROWTH}
              fillOpacity={0.18}
              isAnimationActive={false}
            />
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
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
