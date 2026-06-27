"use client";

import { useState } from "react";
import type { RetirementResult } from "@/lib/retirement.types";
import { useDict } from "@/lib/i18n/provider";
import { BalanceChart } from "./balance-chart";
import { CompositionChart } from "./composition-chart";
import { CashFlowChart } from "./cashflow-chart";
import { ScenarioChart } from "./scenario-chart";
import { BreakdownTable } from "./breakdown-table";
import { cn } from "@/lib/utils";

type TabKey = "balance" | "composition" | "cashflow" | "scenarios";

/**
 * One panel, four views. The charts all tell different stories about the same
 * projection, so instead of stacking four tall charts we switch between them —
 * calmer, and easy to compare. The year-by-year table (the accessible,
 * screen-reader-friendly version of the data) lives below, always available.
 */
export function ChartPanel({ result }: { result: RetirementResult }) {
  const t = useDict();
  const [tab, setTab] = useState<TabKey>("balance");

  const tabs: { key: TabKey; label: string; hint: string }[] = [
    {
      key: "balance",
      label: t.charts.tabBalance,
      hint: t.charts.tabBalanceHint,
    },
    {
      key: "composition",
      label: t.charts.tabComposition,
      hint: t.charts.tabCompositionHint,
    },
    {
      key: "cashflow",
      label: t.charts.tabCashflow,
      hint: t.charts.tabCashflowHint,
    },
    {
      key: "scenarios",
      label: t.charts.tabScenarios,
      hint: t.charts.tabScenariosHint,
    },
  ];
  const active = tabs.find((x) => x.key === tab)!;

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        aria-label={t.charts.panelAria}
        className="bg-muted inline-flex flex-wrap gap-1 rounded-lg p-1"
      >
        {tabs.map((x) => (
          <button
            key={x.key}
            type="button"
            role="tab"
            id={`tab-${x.key}`}
            aria-selected={tab === x.key}
            aria-controls={`panel-${x.key}`}
            onClick={() => setTab(x.key)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              tab === x.key
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {x.label}
          </button>
        ))}
      </div>

      <p className="text-muted-foreground text-xs">{active.hint}</p>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === "balance" && <BalanceChart result={result} />}
        {tab === "composition" && <CompositionChart result={result} />}
        {tab === "cashflow" && <CashFlowChart result={result} />}
        {tab === "scenarios" && <ScenarioChart result={result} />}
      </div>

      <BreakdownTable result={result} />
    </div>
  );
}
