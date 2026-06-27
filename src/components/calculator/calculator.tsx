"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { RetirementInputs } from "@/lib/retirement.types";
import { projectRetirement } from "@/lib/retirement";
import { retirementInputSchema } from "@/lib/validation";
import { DEFAULT_INPUTS } from "@/lib/constants";
import { inputsToQuery } from "@/lib/share";
import { InputsForm } from "./inputs-form";
import { ResultsSummary } from "./results-summary";
import { SpendingComparison } from "./spending-comparison";
import { ChartPanel } from "./chart-panel";
import { Disclaimer } from "./disclaimer";
import { SavePlanBar } from "./save-plan-bar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDict } from "@/lib/i18n/provider";

export interface CalculatorProps {
  /** Pre-fill from a saved plan. When omitted, we read the URL or fall back to defaults. */
  initialInputs?: RetirementInputs;
  isAuthed: boolean;
  planId?: string;
  planName?: string;
  /** Mirror inputs into the URL for sharing (public calculator only). */
  syncUrl?: boolean;
}

/**
 * The calculator's "brain". It owns the inputs state, recomputes the projection
 * on every change (the engine is pure + cheap, so this is instant), surfaces
 * validation messages, and optionally keeps the URL in sync for sharing.
 *
 * Notice there's no data fetching here for the maths — the same engine that runs
 * on the server runs right here in the browser, which is why results feel live.
 */
export function Calculator({
  initialInputs,
  isAuthed,
  planId,
  planName,
  syncUrl = false,
}: CalculatorProps) {
  const t = useDict();
  // The starting inputs are resolved on the server (from a saved plan or from
  // the URL query) and passed in, so the first render already shows the right
  // scenario — no flash, no hydration mismatch.
  const [inputs, setInputs] = useState<RetirementInputs>(
    initialInputs ?? DEFAULT_INPUTS,
  );

  // Reflect the current inputs back into the URL without piling up history.
  useEffect(() => {
    if (syncUrl && typeof window !== "undefined") {
      const query = inputsToQuery(inputs);
      window.history.replaceState(
        null,
        "",
        `${window.location.pathname}?${query}`,
      );
    }
  }, [inputs, syncUrl]);

  const update = useCallback((patch: Partial<RetirementInputs>) => {
    setInputs((prev) => ({ ...prev, ...patch }));
  }, []);

  // The projection. useMemo means we only recompute when inputs actually change.
  const result = useMemo(() => projectRetirement(inputs), [inputs]);

  // Field-level validation messages (results still compute regardless).
  const errors = useMemo(() => {
    const parsed = retirementInputSchema.safeParse(inputs);
    if (parsed.success) return {};
    const map: Partial<Record<keyof RetirementInputs, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as keyof RetirementInputs;
      if (key && !map[key]) map[key] = issue.message;
    }
    return map;
  }, [inputs]);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:items-start">
      {/* Inputs */}
      <Card>
        <CardHeader>
          <CardTitle>{t.calculator.yourNumbers}</CardTitle>
          <CardDescription>{t.calculator.adjustHint}</CardDescription>
        </CardHeader>
        <CardContent>
          <InputsForm inputs={inputs} onChange={update} errors={errors} />
        </CardContent>
      </Card>

      {/* Results */}
      <div className="space-y-6">
        <ResultsSummary result={result} />

        <SpendingComparison result={result} />

        <Card>
          <CardHeader>
            <CardTitle>{t.calculator.savingsOverTime}</CardTitle>
            <CardDescription>
              {t.calculator.fromAgeThrough(inputs.currentAge, inputs.planToAge)}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChartPanel result={result} />
          </CardContent>
        </Card>

        <SavePlanBar
          inputs={inputs}
          isAuthed={isAuthed}
          planId={planId}
          initialName={planName}
        />

        <Disclaimer />
      </div>
    </div>
  );
}
