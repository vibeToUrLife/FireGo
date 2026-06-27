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
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { useDict } from "@/lib/i18n/provider";

interface ChartPoint {
  age: number;
  balance: number;
  phase: string;
}

/** Custom tooltip — Recharts injects `active`/`payload` when it clones this. */
function ChartTooltip({
  active,
  payload,
  currency = "RM",
}: {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint }>;
  currency?: string;
}) {
  const t = useDict();
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload;
  return (
    <div className="border-border bg-surface rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="text-foreground font-medium">
        {t.charts.ageLabel(point.age)}
      </p>
      <p className="text-foreground font-mono tabular-nums">
        {formatCurrency(point.balance, currency)}
      </p>
      <p className="text-muted-foreground">
        {point.phase === "accumulation"
          ? t.charts.phaseAccumulation
          : t.charts.phaseDrawdown}
      </p>
    </div>
  );
}

/**
 * The portfolio's whole journey: saving up, the peak at retirement, then drawing
 * down. Dashed reference lines mark the retirement age and (if it happens) the
 * point the money runs out. The year-by-year table below is the accessible,
 * screen-reader-friendly version of this same data.
 */
export function BalanceChart({ result }: { result: RetirementResult }) {
  const t = useDict();
  const c = result.inputs.currency;
  const data: ChartPoint[] = result.yearly.map((y) => ({
    age: y.age,
    balance: Math.max(0, Math.round(y.endBalance)),
    phase: y.phase,
  }));

  const retirementAge = result.inputs.retirementAge;
  const depletionAge =
    result.depletionAge !== null ? Math.round(result.depletionAge) : null;

  return (
    <div
      className="h-[300px] w-full"
      role="img"
      aria-label={
        result.willLast
          ? t.charts.balanceAriaOk(
              formatCurrency(result.balanceAtRetirement, c),
              retirementAge,
              result.inputs.planToAge,
            )
          : t.charts.balanceAriaFail(
              formatCurrency(result.balanceAtRetirement, c),
              retirementAge,
              String(depletionAge),
            )
      }
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
            </linearGradient>
          </defs>
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
          <Tooltip content={<ChartTooltip currency={c} />} />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--primary)"
            strokeWidth={2}
            fill="url(#balanceFill)"
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
          {depletionAge !== null && (
            <ReferenceLine
              x={depletionAge}
              stroke="var(--negative)"
              strokeDasharray="4 4"
              label={{
                value: t.charts.runsOut,
                position: "insideTopRight",
                fill: "var(--negative)",
                fontSize: 11,
              }}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
