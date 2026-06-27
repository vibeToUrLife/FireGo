/**
 * Unit tests for the pure retirement engine.
 *
 * These tests are the safety net for the math. They run with Vitest (`npm test`)
 * and don't need a browser, a server, or a database — that's the whole point of
 * keeping the engine pure. We lean on a few hand-computable scenarios (zero
 * return, zero spending) plus property checks (more saving => more money).
 */

import { describe, it, expect } from "vitest";
import {
  computeRealReturn,
  monthlyRate,
  projectRetirement,
} from "./retirement";
import type { RetirementInputs } from "./retirement.types";
import { DEFAULT_INPUTS } from "./constants";

/** Build a full input object, overriding just the fields a test cares about. */
function makeInputs(
  overrides: Partial<RetirementInputs> = {},
): RetirementInputs {
  return { ...DEFAULT_INPUTS, ...overrides };
}

describe("computeRealReturn", () => {
  it("combines nominal return and inflation via the Fisher equation", () => {
    // 7% nominal, 3% inflation -> (1.07 / 1.03) - 1 ≈ 0.038835
    expect(computeRealReturn(7, 3)).toBeCloseTo(0.038835, 5);
  });

  it("is zero when return exactly matches inflation", () => {
    expect(computeRealReturn(5, 5)).toBeCloseTo(0, 10);
  });

  it("goes negative when inflation outpaces return", () => {
    expect(computeRealReturn(2, 6)).toBeLessThan(0);
  });
});

describe("monthlyRate", () => {
  it("compounds back to the annual rate over 12 months", () => {
    const annual = 0.06;
    const m = monthlyRate(annual);
    expect(Math.pow(1 + m, 12) - 1).toBeCloseTo(annual, 10);
  });

  it("is zero for a zero annual rate", () => {
    expect(monthlyRate(0)).toBe(0);
  });
});

describe("projectRetirement — accumulation", () => {
  it("with zero real return and no current savings, the pot is just the contributions", () => {
    // Real return is zero when nominal === inflation, so growth contributes
    // nothing and the pot is purely the money paid in.
    const inputs = makeInputs({
      currentAge: 59,
      retirementAge: 60, // exactly 12 months of saving
      planToAge: 61,
      currentSavings: 0,
      monthlyContribution: 1_000,
      monthlyIncome: 0, // no pension component, keep it clean
      pensionContributionPct: 0,
      annualContributionIncreasePct: 0,
      nominalReturnPct: 3,
      inflationPct: 3, // -> real return 0
      desiredAnnualSpending: 0,
      otherAnnualIncome: 0,
    });
    const r = projectRetirement(inputs);
    // 12 months * RM1,000 = RM12,000, no growth.
    expect(r.balanceAtRetirement).toBeCloseTo(12_000, 6);
  });

  it("treats retirementAge === currentAge as 'already retired' (pot = current savings)", () => {
    const inputs = makeInputs({
      currentAge: 65,
      retirementAge: 65,
      planToAge: 90,
      currentSavings: 750_000,
    });
    const r = projectRetirement(inputs);
    expect(r.balanceAtRetirement).toBe(750_000);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it("saving more each month always produces a bigger retirement pot", () => {
    const low = projectRetirement(makeInputs({ monthlyContribution: 500 }));
    const high = projectRetirement(makeInputs({ monthlyContribution: 1_500 }));
    expect(high.balanceAtRetirement).toBeGreaterThan(low.balanceAtRetirement);
  });

  it("an annual contribution increase raises the pot versus a flat contribution", () => {
    const flat = projectRetirement(
      makeInputs({ annualContributionIncreasePct: 0 }),
    );
    const rising = projectRetirement(
      makeInputs({ annualContributionIncreasePct: 5 }),
    );
    expect(rising.balanceAtRetirement).toBeGreaterThan(
      flat.balanceAtRetirement,
    );
  });

  it("a negative real return shrinks an un-topped-up pot during accumulation", () => {
    const inputs = makeInputs({
      currentAge: 40,
      retirementAge: 50,
      planToAge: 80,
      currentSavings: 100_000,
      monthlyContribution: 0,
      monthlyIncome: 0,
      pensionContributionPct: 0,
      nominalReturnPct: 0,
      inflationPct: 5, // real return clearly negative
    });
    const r = projectRetirement(inputs);
    expect(r.balanceAtRetirement).toBeLessThan(100_000);
  });
});

describe("projectRetirement — drawdown", () => {
  it("never depletes when spending is zero", () => {
    const r = projectRetirement(makeInputs({ desiredAnnualSpending: 0 }));
    expect(r.willLast).toBe(true);
    expect(r.depletionAge).toBeNull();
    expect(r.status).toBe("on_track");
  });

  it("flags depletion when spending is far too high for the pot", () => {
    const r = projectRetirement(
      makeInputs({
        currentSavings: 10_000,
        monthlyContribution: 0,
        monthlyIncome: 0,
        pensionContributionPct: 0,
        retirementAge: 40,
        currentAge: 39,
        planToAge: 90,
        desiredAnnualSpending: 60_000,
      }),
    );
    expect(r.willLast).toBe(false);
    expect(r.depletionAge).not.toBeNull();
    expect(r.depletionAge!).toBeLessThan(90);
    expect(r.yearsShort).toBeGreaterThan(0);
    expect(r.status).toBe("depletes_early");
  });

  it("lasts comfortably with a large pot and modest spending (surplus left over)", () => {
    const r = projectRetirement(
      makeInputs({
        currentAge: 64,
        retirementAge: 65,
        planToAge: 85,
        currentSavings: 2_000_000,
        monthlyContribution: 0,
        desiredAnnualSpending: 40_000,
        otherAnnualIncome: 0,
      }),
    );
    expect(r.willLast).toBe(true);
    expect(r.endingBalance).toBeGreaterThan(0);
  });

  it("other income that covers spending means savings are never touched", () => {
    const r = projectRetirement(
      makeInputs({
        desiredAnnualSpending: 30_000,
        otherAnnualIncome: 30_000,
      }),
    );
    expect(r.netAnnualSpending).toBe(0);
    expect(r.willLast).toBe(true);
  });
});

describe("projectRetirement — sustainable spending", () => {
  it("spending at the sustainable level lasts, and a bit above it does not", () => {
    const base = projectRetirement(
      makeInputs({
        currentAge: 64,
        retirementAge: 65,
        planToAge: 90,
        currentSavings: 1_000_000,
        monthlyContribution: 0,
        otherAnnualIncome: 0,
      }),
    );
    const sustainable = base.sustainableAnnualSpending;
    expect(sustainable).toBeGreaterThan(0);

    const atLevel = projectRetirement(
      makeInputs({
        currentAge: 64,
        retirementAge: 65,
        planToAge: 90,
        currentSavings: 1_000_000,
        monthlyContribution: 0,
        otherAnnualIncome: 0,
        desiredAnnualSpending: sustainable * 0.99, // just under
      }),
    );
    expect(atLevel.willLast).toBe(true);

    const aboveLevel = projectRetirement(
      makeInputs({
        currentAge: 64,
        retirementAge: 65,
        planToAge: 90,
        currentSavings: 1_000_000,
        monthlyContribution: 0,
        otherAnnualIncome: 0,
        desiredAnnualSpending: sustainable * 1.05, // clearly over
      }),
    );
    expect(aboveLevel.willLast).toBe(false);
  });
});

describe("projectRetirement — trajectory shape", () => {
  it("produces one row per year from currentAge up to planToAge", () => {
    const inputs = makeInputs({
      currentAge: 30,
      retirementAge: 60,
      planToAge: 90,
    });
    const r = projectRetirement(inputs);
    expect(r.yearly).toHaveLength(90 - 30);
    expect(r.yearly[0].age).toBe(30);
    expect(r.yearly[r.yearly.length - 1].age).toBe(89);
  });

  it("switches phase exactly at the retirement age", () => {
    const r = projectRetirement(
      makeInputs({ currentAge: 30, retirementAge: 60, planToAge: 90 }),
    );
    const lastAccum = r.yearly.filter((y) => y.phase === "accumulation").at(-1);
    const firstDraw = r.yearly.find((y) => y.phase === "drawdown");
    expect(lastAccum?.age).toBe(59);
    expect(firstDraw?.age).toBe(60);
  });

  it("each row reconciles: end = start + contributions + growth - withdrawals", () => {
    const r = projectRetirement(makeInputs());
    for (const row of r.yearly) {
      const recomputed =
        row.startBalance + row.contributions + row.growth - row.withdrawals;
      expect(recomputed).toBeCloseTo(row.endBalance, 4);
    }
  });

  it("stays bounded and fast even at the maximum horizon", () => {
    const r = projectRetirement(
      makeInputs({ currentAge: 16, retirementAge: 17, planToAge: 120 }),
    );
    expect(r.yearly).toHaveLength(120 - 16);
    expect(Number.isFinite(r.balanceAtRetirement)).toBe(true);
  });
});
