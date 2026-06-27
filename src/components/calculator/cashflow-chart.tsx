"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { RetirementResult } from "@/lib/retirement.types";
import { cashFlowSeries, type CashFlowPoint } from "@/lib/chart-data";
import { formatCurrency, formatCurrencyShort } from "@/lib/format";
import { useDict } from "@/lib/i18n/provider";

const IN = "var(--positive)";
const OUT = "var(--negative)";

function CashFlowTooltip({
  active,
  payload,
  currency = "RM",
}: {
  active?: boolean;
  payload?: Array<{ payload: CashFlowPoint }>;
  currency?: string;
}) {
  const t = useDict();
  if (!active || !payload || payload.length === 0) return null;
  const p = payload[0].payload;
  if (p.kind === "none") {
    return (
      <div className="border-border bg-surface rounded-md border px-3 py-2 text-xs shadow-md">
        <p className="text-foreground font-medium">
          {t.charts.ageLabel(p.age)}
        </p>
        <p className="text-muted-foreground">{t.charts.noFlow}</p>
      </div>
    );
  }
  const paidIn = p.kind === "in";
  return (
    <div className="border-border bg-surface rounded-md border px-3 py-2 text-xs shadow-md">
      <p className="text-foreground font-medium">{t.charts.ageLabel(p.age)}</p>
      <p className="text-muted-foreground">
        {paidIn ? t.charts.paidIn : t.charts.takenOut}
      </p>
      <p
        className="font-mono tabular-nums"
        style={{ color: paidIn ? IN : OUT }}
      >
        {paidIn ? "+" : "−"}
        {formatCurrency(Math.abs(p.amount), currency)}
      </p>
    </div>
  );
}

/**
 * The plan's yearly rhythm: green bars rising above the line are money you pay
 * in while working; red bars below the line are money you draw out once retired.
 * The flip from green to red is the moment you stop saving and start spending.
 */
export function CashFlowChart({ result }: { result: RetirementResult }) {
  const t = useDict();
  const c = result.inputs.currency;
  const data = cashFlowSeries(result);
  const retirementAge = result.inputs.retirementAge;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: IN }}
          />
          <span className="text-muted-foreground">{t.charts.paidInSaving}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-block size-2.5 rounded-sm"
            style={{ background: OUT }}
          />
          <span className="text-muted-foreground">
            {t.charts.takenOutRetired}
          </span>
        </span>
      </div>

      <div
        className="h-[300px] w-full"
        role="img"
        aria-label={t.charts.cashflowAria(
          retirementAge,
          result.inputs.planToAge,
        )}
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
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
              tickFormatter={(v: number) => formatCurrencyShort(Math.abs(v), c)}
            />
            <Tooltip
              cursor={{ fill: "var(--muted)", fillOpacity: 0.4 }}
              content={<CashFlowTooltip currency={c} />}
            />
            <ReferenceLine y={0} stroke="var(--border)" />
            <Bar dataKey="amount" isAnimationActive={false} maxBarSize={14}>
              {data.map((p) => (
                <Cell key={p.age} fill={p.kind === "out" ? OUT : IN} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
