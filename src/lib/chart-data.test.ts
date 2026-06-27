/**
 * Unit tests for the chart-data derivations.
 *
 * These guard the maths that feeds the four calculator charts. Like the engine
 * tests they're pure — no rendering, no DOM — and lean on hand-checkable cases
 * (zero return) plus reconciliation and ordering properties.
 */

import { describe, it, expect } from "vitest";
import {
  composeBalanceSeries,
  cashFlowSeries,
  spendingComparison,
  sensitivitySeries,
  RETURN_DELTA,
} from "./chart-data";
import { projectRetirement } from "./retirement";
import type { RetirementInputs } from "./retirement.types";
import { DEFAULT_INPUTS, LIMITS } from "./constants";

function makeInputs(
  overrides: Partial<RetirementInputs> = {},
): RetirementInputs {
  return { ...DEFAULT_INPUTS, ...overrides };
}

describe("composeBalanceSeries", () => {
  it("has one point per year, aligned with the trajectory", () => {
    const result = projectRetirement(makeInputs());
    const series = composeBalanceSeries(result);
    expect(series).toHaveLength(result.yearly.length);
    expect(series[0].age).toBe(result.yearly[0].age);
  });

  it("deposits + growth reconcile to the balance during accumulation", () => {
    const result = projectRetirement(makeInputs());
    // Accumulation has a positive real return here, so the split is exact
    // (give or take 1 from rounding each band independently).
    for (const point of composeBalanceSeries(result)) {
      const row = result.yearly.find((y) => y.age === point.age)!;
      if (row.phase === "accumulation") {
        const diff = point.deposits + point.growth - Math.round(row.endBalance);
        expect(Math.abs(diff)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("with zero real return, growth stays ~0 and the pot is all deposits", () => {
    const result = projectRetirement(
      makeInputs({
        currentAge: 40,
        retirementAge: 60,
        planToAge: 61,
        currentSavings: 10_000,
        monthlyContribution: 500,
        monthlyIncome: 0,
        pensionContributionPct: 0,
        annualContributionIncreasePct: 0,
        nominalReturnPct: 3,
        inflationPct: 3, // real return exactly 0
        desiredAnnualSpending: 0,
      }),
    );
    const lastAccum = composeBalanceSeries(result)
      .filter((_, i) => result.yearly[i].phase === "accumulation")
      .at(-1)!;
    expect(lastAccum.growth).toBeCloseTo(0, 0);
    expect(lastAccum.deposits).toBeGreaterThan(0);
  });

  it("growth makes up a meaningful share by retirement on a normal plan", () => {
    const result = projectRetirement(makeInputs());
    const atRetirement = composeBalanceSeries(result).find(
      (p) => p.age === result.inputs.retirementAge,
    );
    // Over 30 years at ~3.9% real, compounding should contribute a real chunk.
    expect(atRetirement).toBeDefined();
    expect(atRetirement!.growth).toBeGreaterThan(0);
  });

  it("never renders a negative band", () => {
    const result = projectRetirement(
      makeInputs({ desiredAnnualSpending: 200_000 }), // depletes hard
    );
    for (const point of composeBalanceSeries(result)) {
      expect(point.deposits).toBeGreaterThanOrEqual(0);
      expect(point.growth).toBeGreaterThanOrEqual(0);
    }
  });
});

describe("cashFlowSeries", () => {
  it("is positive while saving and negative while drawing down", () => {
    const result = projectRetirement(makeInputs());
    const series = cashFlowSeries(result);
    expect(series).toHaveLength(result.yearly.length);

    for (let i = 0; i < series.length; i++) {
      const row = result.yearly[i];
      const point = series[i];
      if (row.phase === "accumulation") {
        expect(point.kind).toBe("in");
        expect(point.amount).toBeGreaterThan(0);
      } else if (row.withdrawals > 0) {
        expect(point.kind).toBe("out");
        expect(point.amount).toBeLessThan(0);
      }
    }
  });
});

describe("spendingComparison", () => {
  it("reports headroom when savings sustain more than desired", () => {
    const result = projectRetirement(
      makeInputs({
        currentAge: 64,
        retirementAge: 65,
        planToAge: 85,
        currentSavings: 2_000_000,
        monthlyContribution: 0,
        desiredAnnualSpending: 40_000,
      }),
    );
    const cmp = spendingComparison(result);
    expect(cmp.meetsDesired).toBe(true);
    expect(cmp.difference).toBeGreaterThan(0);
    expect(cmp.sustainable).toBeGreaterThan(cmp.desired);
  });

  it("reports a shortfall when desired spending is too high", () => {
    const result = projectRetirement(
      makeInputs({
        currentSavings: 10_000,
        monthlyContribution: 0,
        monthlyIncome: 0,
        pensionContributionPct: 0,
        currentAge: 39,
        retirementAge: 40,
        planToAge: 90,
        desiredAnnualSpending: 60_000,
      }),
    );
    const cmp = spendingComparison(result);
    expect(cmp.meetsDesired).toBe(false);
    expect(cmp.difference).toBeLessThan(0);
  });
});

describe("sensitivitySeries", () => {
  it("returns three scenarios with the base return unchanged", () => {
    const inputs = makeInputs({ nominalReturnPct: 7 });
    const { scenarios } = sensitivitySeries(inputs);
    expect(scenarios.map((s) => s.key)).toEqual([
      "pessimistic",
      "base",
      "optimistic",
    ]);
    const base = scenarios.find((s) => s.key === "base")!;
    expect(base.nominalReturnPct).toBe(7);
  });

  it("flexes the return up and down by RETURN_DELTA", () => {
    const inputs = makeInputs({ nominalReturnPct: 7 });
    const { scenarios } = sensitivitySeries(inputs);
    const lower = scenarios.find((s) => s.key === "pessimistic")!;
    const upper = scenarios.find((s) => s.key === "optimistic")!;
    expect(lower.nominalReturnPct).toBe(7 - RETURN_DELTA);
    expect(upper.nominalReturnPct).toBe(7 + RETURN_DELTA);
  });

  it("a higher return yields a bigger pot at retirement", () => {
    const { scenarios } = sensitivitySeries(
      makeInputs({ nominalReturnPct: 7 }),
    );
    const lower = scenarios.find((s) => s.key === "pessimistic")!;
    const base = scenarios.find((s) => s.key === "base")!;
    const upper = scenarios.find((s) => s.key === "optimistic")!;
    expect(upper.balanceAtRetirement).toBeGreaterThan(base.balanceAtRetirement);
    expect(base.balanceAtRetirement).toBeGreaterThan(lower.balanceAtRetirement);
  });

  it("clamps the return to sane bounds at the extremes", () => {
    const { scenarios } = sensitivitySeries(
      makeInputs({ nominalReturnPct: LIMITS.returnPct.max }),
    );
    const upper = scenarios.find((s) => s.key === "optimistic")!;
    expect(upper.nominalReturnPct).toBe(LIMITS.returnPct.max);
  });

  it("gives one chart point per year, aligned across scenarios", () => {
    const inputs = makeInputs();
    const { points } = sensitivitySeries(inputs);
    const base = projectRetirement(inputs);
    expect(points).toHaveLength(base.yearly.length);
    expect(points[0].age).toBe(base.yearly[0].age);
  });
});
