"use client";

import { useState } from "react";
import type { RetirementResult } from "@/lib/retirement.types";
import { formatCurrency } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useDict } from "@/lib/i18n/provider";

/**
 * The same trajectory as the chart, but as numbers — collapsed by default to
 * keep the page calm, and the accessible alternative to the chart. The table
 * scrolls horizontally inside its own box on small screens (the page doesn't).
 */
export function BreakdownTable({ result }: { result: RetirementResult }) {
  const [open, setOpen] = useState(false);
  const c = result.inputs.currency;
  const t = useDict();

  return (
    <div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <ChevronDown
          className={cn("transition-transform", open && "rotate-180")}
        />
        {open ? t.breakdown.hide : t.breakdown.show}
      </Button>

      {open && (
        <div className="border-border mt-4 overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[660px] border-collapse text-sm">
            <thead>
              <tr className="border-border bg-muted/60 text-muted-foreground border-b text-left text-xs">
                <th className="px-3 py-2.5 font-medium">
                  {t.breakdown.colAge}
                </th>
                <th className="px-3 py-2.5 font-medium">
                  {t.breakdown.colPhase}
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  {t.breakdown.colStart}
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  {t.breakdown.colAdded}
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  {t.breakdown.colGrowth}
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  {t.breakdown.colTakenOut}
                </th>
                <th className="px-3 py-2.5 text-right font-medium">
                  {t.breakdown.colEnd}
                </th>
              </tr>
            </thead>
            <tbody>
              {result.yearly.map((y) => (
                <tr
                  key={y.age}
                  className="border-border/60 hover:bg-muted/30 border-b last:border-0"
                >
                  <td className="px-3 py-2 font-mono tabular-nums">{y.age}</td>
                  <td className="px-3 py-2">
                    <Badge
                      tone={y.phase === "accumulation" ? "primary" : "neutral"}
                    >
                      {y.phase === "accumulation"
                        ? t.breakdown.phaseSaving
                        : t.breakdown.phaseDrawing}
                    </Badge>
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-right font-mono tabular-nums">
                    {formatCurrency(y.startBalance, c)}
                  </td>
                  <td className="text-positive px-3 py-2 text-right font-mono tabular-nums">
                    {y.contributions > 0
                      ? formatCurrency(y.contributions, c)
                      : "—"}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-right font-mono tabular-nums">
                    {formatCurrency(y.growth, c)}
                  </td>
                  <td className="text-negative px-3 py-2 text-right font-mono tabular-nums">
                    {y.withdrawals > 0 ? formatCurrency(y.withdrawals, c) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right font-mono font-medium tabular-nums">
                    {formatCurrency(y.endBalance, c)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
