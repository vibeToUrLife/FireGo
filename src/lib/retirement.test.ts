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
import { retirementInputSchema } from "./validation";

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

describe("projectRetirement — withdrawal rate", () => {
  it("reports the initial withdrawal rate as net draw over the pot", () => {
    // Real return 0 and no contributions -> the pot is exactly current savings.
    const r = projectRetirement(
      makeInputs({
        currentAge: 64,
        retirementAge: 65,
        planToAge: 90,
        currentSavings: 1_000_000,
        monthlyContribution: 0,
        monthlyIncome: 0,
        pensionContributionPct: 0,
        nominalReturnPct: 5,
        inflationPct: 5, // real return 0 -> pot stays at 1,000,000
        desiredAnnualSpending: 40_000,
        otherAnnualIncome: 0,
      }),
    );
    expect(r.balanceAtRetirement).toBeCloseTo(1_000_000, 4);
    expect(r.initialWithdrawalRatePct).toBeCloseTo(4, 6); // 40k / 1m
  });

  it("annotates drawdown rows with a rate and leaves accumulation rows null", () => {
    const r = projectRetirement(makeInputs());
    for (const row of r.yearly) {
      if (row.phase === "accumulation") {
        expect(row.withdrawalRatePct).toBeNull();
      }
    }
    const firstDraw = r.yearly.find(
      (y) => y.phase === "drawdown" && y.withdrawals > 0,
    )!;
    expect(firstDraw.withdrawalRatePct).not.toBeNull();
    expect(firstDraw.withdrawalRatePct!).toBeGreaterThan(0);
  });

  it("has no rate to report when there is no pot to draw from", () => {
    const r = projectRetirement(
      makeInputs({
        currentAge: 65,
        retirementAge: 65,
        planToAge: 90,
        currentSavings: 0,
        monthlyContribution: 0,
      }),
    );
    expect(r.balanceAtRetirement).toBe(0);
    expect(r.initialWithdrawalRatePct).toBeNull();
  });
});

describe("projectRetirement — rate-driven spending (% of balance)", () => {
  // A 1,000,000 pot with no further contributions; return varies per test.
  const ratePlan = (overrides: Partial<RetirementInputs> = {}) =>
    makeInputs({
      currentAge: 64,
      retirementAge: 65,
      planToAge: 95,
      currentSavings: 1_000_000,
      monthlyContribution: 0,
      monthlyIncome: 0,
      pensionContributionPct: 0,
      spendingMode: "rate",
      targetWithdrawalRatePct: 4,
      otherAnnualIncome: 0,
      ...overrides,
    });

  it("first-year draw is the rate applied to the pot at retirement", () => {
    // Real return 0 keeps the pot at 1,000,000, so year one draws exactly 4%.
    const r = projectRetirement(
      ratePlan({ nominalReturnPct: 5, inflationPct: 5 }),
    );
    expect(r.netAnnualSpending).toBeCloseTo(40_000, 4);
    expect(r.effectiveDesiredAnnualSpending).toBeCloseTo(40_000, 4);
    expect(r.initialWithdrawalRatePct).toBeCloseTo(4, 6);
  });

  it("adds other income on top of the rate-derived draw for the gross spend", () => {
    const r = projectRetirement(
      ratePlan({
        nominalReturnPct: 5,
        inflationPct: 5,
        otherAnnualIncome: 12_000,
      }),
    );
    expect(r.netAnnualSpending).toBeCloseTo(40_000, 4);
    expect(r.effectiveDesiredAnnualSpending).toBeCloseTo(52_000, 4);
  });

  it("draws the same % of the balance every year and never depletes", () => {
    const r = projectRetirement(
      ratePlan({ nominalReturnPct: 7, inflationPct: 3 }),
    );
    expect(r.willLast).toBe(true);
    expect(r.depletionAge).toBeNull();
    for (const row of r.yearly.filter((y) => y.phase === "drawdown")) {
      expect(row.withdrawalRatePct).toBeCloseTo(4, 6);
    }
  });

  it("the amount drawn grows over time when the return outpaces the rate", () => {
    // Real return 9% > 4% rate -> the pot, and each year's 4%, grow in real terms.
    const r = projectRetirement(
      ratePlan({ nominalReturnPct: 9, inflationPct: 0 }),
    );
    const draws = r.yearly
      .filter((y) => y.phase === "drawdown")
      .map((y) => y.withdrawals);
    expect(draws[draws.length - 1]).toBeGreaterThan(draws[0]);
    expect(r.endingBalance).toBeGreaterThan(1_000_000);
  });

  it("a higher rate draws more up front but leaves a smaller pot", () => {
    const low = projectRetirement(
      ratePlan({
        nominalReturnPct: 8,
        inflationPct: 0,
        targetWithdrawalRatePct: 3,
      }),
    );
    const high = projectRetirement(
      ratePlan({
        nominalReturnPct: 8,
        inflationPct: 0,
        targetWithdrawalRatePct: 9,
      }),
    );
    expect(high.netAnnualSpending).toBeGreaterThan(low.netAnnualSpending);
    expect(high.endingBalance).toBeLessThan(low.endingBalance);
    expect(low.willLast).toBe(true);
    expect(high.willLast).toBe(true);
  });
});

describe("projectRetirement — fixed-amount contribution increase", () => {
  it("a fixed yearly amount raises the pot versus a flat contribution", () => {
    const flat = projectRetirement(
      makeInputs({
        contributionIncreaseMode: "amount",
        annualContributionIncreaseAmount: 0,
      }),
    );
    const rising = projectRetirement(
      makeInputs({
        contributionIncreaseMode: "amount",
        annualContributionIncreaseAmount: 200,
      }),
    );
    expect(rising.balanceAtRetirement).toBeGreaterThan(
      flat.balanceAtRetirement,
    );
  });

  it("a zero increase matches a flat percent increase (both stay flat)", () => {
    const amountFlat = projectRetirement(
      makeInputs({
        contributionIncreaseMode: "amount",
        annualContributionIncreaseAmount: 0,
      }),
    );
    const percentFlat = projectRetirement(
      makeInputs({
        contributionIncreaseMode: "percent",
        annualContributionIncreasePct: 0,
      }),
    );
    expect(amountFlat.balanceAtRetirement).toBeCloseTo(
      percentFlat.balanceAtRetirement,
      4,
    );
  });
});

describe("projectRetirement — contribution cap", () => {
  it("caps how high the growing monthly contribution climbs (percent mode)", () => {
    // Base monthly contribution is 1,000; a 5% raise over 30 years pushes it far
    // past 1,200, so a 1,200 cap throttles growth and yields a smaller pot.
    const uncapped = projectRetirement(
      makeInputs({
        annualContributionIncreasePct: 5,
        monthlyContributionCap: 0,
      }),
    );
    const capped = projectRetirement(
      makeInputs({
        annualContributionIncreasePct: 5,
        monthlyContributionCap: 1_200,
      }),
    );
    expect(capped.balanceAtRetirement).toBeLessThan(
      uncapped.balanceAtRetirement,
    );
  });

  it("caps the fixed-amount increase the same way", () => {
    const uncapped = projectRetirement(
      makeInputs({
        contributionIncreaseMode: "amount",
        annualContributionIncreaseAmount: 200,
        monthlyContributionCap: 0,
      }),
    );
    const capped = projectRetirement(
      makeInputs({
        contributionIncreaseMode: "amount",
        annualContributionIncreaseAmount: 200,
        monthlyContributionCap: 1_500,
      }),
    );
    expect(capped.balanceAtRetirement).toBeLessThan(
      uncapped.balanceAtRetirement,
    );
  });

  it("a cap above any level reached behaves like no cap", () => {
    const uncapped = projectRetirement(
      makeInputs({ annualContributionIncreasePct: 5 }),
    );
    const highCap = projectRetirement(
      makeInputs({
        annualContributionIncreasePct: 5,
        monthlyContributionCap: 1_000_000,
      }),
    );
    expect(highCap.balanceAtRetirement).toBeCloseTo(
      uncapped.balanceAtRetirement,
      4,
    );
  });
});

describe("retirementInputSchema — backward compatibility", () => {
  it("fills sensible defaults for plans saved before the new fields existed", () => {
    const legacy: Record<string, unknown> = { ...DEFAULT_INPUTS };
    delete legacy.spendingMode;
    delete legacy.targetWithdrawalRatePct;
    delete legacy.contributionIncreaseMode;
    delete legacy.annualContributionIncreaseAmount;
    delete legacy.monthlyContributionCap;

    const parsed = retirementInputSchema.safeParse(legacy);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.spendingMode).toBe("amount");
      expect(parsed.data.contributionIncreaseMode).toBe("percent");
      expect(parsed.data.targetWithdrawalRatePct).toBe(
        DEFAULT_INPUTS.targetWithdrawalRatePct,
      );
      expect(parsed.data.annualContributionIncreaseAmount).toBe(
        DEFAULT_INPUTS.annualContributionIncreaseAmount,
      );
      expect(parsed.data.monthlyContributionCap).toBe(
        DEFAULT_INPUTS.monthlyContributionCap,
      );
    }
  });
});
