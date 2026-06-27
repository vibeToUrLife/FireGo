/**
 * Derived data series for the calculator's charts.
 *
 * Like the engine itself (src/lib/retirement.ts) these are PURE functions:
 * a RetirementResult (or the inputs) go in, plain arrays come out. Keeping the
 * data-shaping here means the chart components stay tiny and declarative, and
 * the maths can be unit-tested (chart-data.test.ts) without rendering anything.
 */

import type { RetirementResult, RetirementInputs } from "./retirement.types";
import { projectRetirement } from "./retirement";
import { LIMITS } from "./constants";

/* ------------------------------------------------------------------ *
 * 1. Composition — "what's your money made of"
 * ------------------------------------------------------------------ */

/** One point of the composition chart. `deposits + growth ≈ endBalance`. */
export interface CompositionPoint {
  age: number;
  /** Your own money still invested (starting savings + contributions). */
  deposits: number;
  /** Investment earnings stacked on top. */
  growth: number;
}

/**
 * Split the portfolio at each age into "your deposits" vs "investment growth".
 *
 * We track two running buckets that always sum to the balance: contributions go
 * into `deposits`, each year's growth goes into `growth`, and withdrawals are
 * taken out of both in proportion to their current size. With a positive real
 * return (the normal case) the split is exact; in unusual down years we clamp
 * the display so neither band renders negative.
 */
export function composeBalanceSeries(
  result: RetirementResult,
): CompositionPoint[] {
  let deposits = result.inputs.currentSavings;
  let growth = 0;

  return result.yearly.map((row) => {
    deposits += row.contributions;
    growth += row.growth;

    if (row.withdrawals > 0) {
      const total = deposits + growth;
      if (total > 0) {
        const taken = Math.min(row.withdrawals, total);
        deposits -= taken * (deposits / total);
        growth -= taken * (growth / total);
      }
    }

    return {
      age: row.age,
      deposits: Math.max(0, Math.round(deposits)),
      growth: Math.max(0, Math.round(growth)),
    };
  });
}

/* ------------------------------------------------------------------ *
 * 2. Cash flow — "money in, then money out"
 * ------------------------------------------------------------------ */

/** One year's net cash flow. `amount` is signed: + paid in, − taken out. */
export interface CashFlowPoint {
  age: number;
  amount: number;
  kind: "in" | "out" | "none";
}

/**
 * The yearly rhythm of the plan: contributions (positive, while saving) then
 * withdrawals (negative, while drawing down). A single signed value per year
 * makes a clean diverging bar around the zero line.
 */
export function cashFlowSeries(result: RetirementResult): CashFlowPoint[] {
  return result.yearly.map((row) => {
    if (row.contributions > 0) {
      return {
        age: row.age,
        amount: Math.round(row.contributions),
        kind: "in",
      };
    }
    if (row.withdrawals > 0) {
      return {
        age: row.age,
        amount: -Math.round(row.withdrawals),
        kind: "out",
      };
    }
    return { age: row.age, amount: 0, kind: "none" };
  });
}

/* ------------------------------------------------------------------ *
 * 3. Spending — "desired vs sustainable"
 * ------------------------------------------------------------------ */

/** The desired-vs-sustainable annual spending comparison. */
export interface SpendingComparison {
  desired: number;
  sustainable: number;
  /** sustainable − desired: positive = headroom, negative = shortfall. */
  difference: number;
  meetsDesired: boolean;
}

export function spendingComparison(
  result: RetirementResult,
): SpendingComparison {
  const desired = result.inputs.desiredAnnualSpending;
  const sustainable = result.sustainableAnnualSpending;
  return {
    desired,
    sustainable,
    difference: sustainable - desired,
    meetsDesired: sustainable >= desired,
  };
}

/* ------------------------------------------------------------------ *
 * 4. Sensitivity — "what if returns are different"
 * ------------------------------------------------------------------ */

/** How far up/down we flex the nominal return, in percentage points. */
export const RETURN_DELTA = 2;

/** A single return scenario. */
export interface Scenario {
  key: "pessimistic" | "base" | "optimistic";
  /** The nominal return % used for this run (after clamping to sane bounds). */
  nominalReturnPct: number;
  balanceAtRetirement: number;
  willLast: boolean;
  depletionAge: number | null;
  endingBalance: number;
}

export interface SensitivityData {
  scenarios: Scenario[];
  /** One row per age with all three balances, ready for a multi-line chart. */
  points: Array<{
    age: number;
    pessimistic: number;
    base: number;
    optimistic: number;
  }>;
}

function clampReturn(pct: number): number {
  return Math.min(LIMITS.returnPct.max, Math.max(LIMITS.returnPct.min, pct));
}

function toScenario(key: Scenario["key"], result: RetirementResult): Scenario {
  return {
    key,
    nominalReturnPct: result.inputs.nominalReturnPct,
    balanceAtRetirement: result.balanceAtRetirement,
    willLast: result.willLast,
    depletionAge: result.depletionAge,
    endingBalance: result.endingBalance,
  };
}

/**
 * Re-run the projection at a worse and a better return to show how much the
 * outcome hinges on that single assumption. Cheap, because the engine is pure —
 * we just call it three times.
 */
export function sensitivitySeries(inputs: RetirementInputs): SensitivityData {
  const base = projectRetirement(inputs);
  const lower = projectRetirement({
    ...inputs,
    nominalReturnPct: clampReturn(inputs.nominalReturnPct - RETURN_DELTA),
  });
  const upper = projectRetirement({
    ...inputs,
    nominalReturnPct: clampReturn(inputs.nominalReturnPct + RETURN_DELTA),
  });

  const points = base.yearly.map((row, i) => ({
    age: row.age,
    pessimistic: Math.max(0, Math.round(lower.yearly[i]?.endBalance ?? 0)),
    base: Math.max(0, Math.round(row.endBalance)),
    optimistic: Math.max(0, Math.round(upper.yearly[i]?.endBalance ?? 0)),
  }));

  return {
    scenarios: [
      toScenario("pessimistic", lower),
      toScenario("base", base),
      toScenario("optimistic", upper),
    ],
    points,
  };
}
