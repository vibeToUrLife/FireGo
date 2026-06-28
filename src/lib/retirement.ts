/**
 * The retirement projection engine.
 *
 * This file is intentionally PURE: every function takes plain numbers/objects in
 * and returns plain numbers/objects out, with no side effects, no React, no
 * network, no database. That is what makes it:
 *   - easy to unit-test (see retirement.test.ts),
 *   - safe to run on every keystroke in the browser (instant results), and
 *   - safe to re-run on the server as the authoritative calculation when a plan
 *     is saved.
 *
 * The model in one breath:
 *   1. Convert nominal return + inflation into a single REAL return.
 *   2. ACCUMULATION: simulate month by month from currentAge to retirementAge —
 *      each month grow the portfolio, then add that month's contribution.
 *   3. DRAWDOWN: simulate month by month from retirementAge to planToAge — each
 *      month take out living costs, then grow what's left.
 *   4. Report whether the money lasts, when it runs out (if it does), and the
 *      "sustainable" spending level for comparison.
 *
 * Everything is in today's money (real terms), so RM48,000 means RM48,000 of
 * today's purchasing power at every age.
 */

import type {
  RetirementInputs,
  RetirementResult,
  YearRow,
  Phase,
  WarningCode,
} from "./retirement.types";

const MONTHS_PER_YEAR = 12;

/**
 * Convert a nominal annual return and inflation into a single real annual
 * return. Example: 7% nominal with 3% inflation ≈ 3.88% real.
 *
 * Fisher equation: (1 + real) = (1 + nominal) / (1 + inflation)
 */
export function computeRealReturn(
  nominalReturnPct: number,
  inflationPct: number,
): number {
  const nominal = nominalReturnPct / 100;
  const inflation = inflationPct / 100;
  return (1 + nominal) / (1 + inflation) - 1;
}

/**
 * Convert an annual rate into the equivalent monthly compounding rate.
 * (1 + monthly)^12 = (1 + annual)  ->  monthly = (1 + annual)^(1/12) - 1
 */
export function monthlyRate(annualRate: number): number {
  return Math.pow(1 + annualRate, 1 / MONTHS_PER_YEAR) - 1;
}

/**
 * Internal helper: simulate ONLY the drawdown phase from a starting balance and
 * report whether the money survives the whole horizon. Used both by the main
 * projection and by the binary search for "sustainable spending".
 *
 * Convention: each month we withdraw first (you need cash to live on), then the
 * remaining balance grows. If a withdrawal can't be covered, the money has run
 * out — we return the month index it happened.
 */
function simulateDrawdown(
  startBalance: number,
  netAnnualSpending: number,
  monthlyRealRate: number,
  drawdownMonths: number,
): { depletedAtMonth: number | null; endingBalance: number } {
  const monthlyNet = netAnnualSpending / MONTHS_PER_YEAR;
  let balance = startBalance;

  for (let m = 0; m < drawdownMonths; m++) {
    balance -= monthlyNet;
    if (balance <= 0) {
      return { depletedAtMonth: m, endingBalance: 0 };
    }
    balance *= 1 + monthlyRealRate;
  }
  return { depletedAtMonth: null, endingBalance: balance };
}

/**
 * Find the highest GROSS desired annual spending that still lasts exactly to the
 * end of the horizon, given a fixed retirement balance and other income. This is
 * the number that answers "so how much can I actually afford to spend?".
 *
 * We binary-search the spending level: anything the portfolio can sustain pushes
 * the lower bound up; anything it can't pulls the upper bound down.
 */
function findSustainableSpending(
  balanceAtRetirement: number,
  otherAnnualIncome: number,
  monthlyRealRate: number,
  drawdownMonths: number,
): number {
  // Spending up to (balance + other income) per year is guaranteed to drain the
  // pool in the first year, so it's a safe upper bound to search within.
  let lo = 0;
  let hi = balanceAtRetirement + otherAnnualIncome + 1;

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const net = Math.max(0, mid - otherAnnualIncome);
    const { depletedAtMonth } = simulateDrawdown(
      balanceAtRetirement,
      net,
      monthlyRealRate,
      drawdownMonths,
    );
    if (depletedAtMonth === null) {
      lo = mid; // it lasted — we can afford at least this much
    } else {
      hi = mid; // it ran out — must spend less
    }
  }
  return lo;
}

/**
 * The main entry point. Takes the user's inputs and returns the full result:
 * the retirement balance, whether it lasts, the year-by-year trajectory, and so
 * on. This never throws on numerically valid input and never loops forever — the
 * horizon is bounded by planToAge (≤ 120).
 */
export function projectRetirement(inputs: RetirementInputs): RetirementResult {
  const {
    currentAge,
    retirementAge,
    planToAge,
    currentSavings,
    monthlyContribution,
    monthlyIncome,
    pensionContributionPct,
    contributionIncreaseMode,
    annualContributionIncreasePct,
    annualContributionIncreaseAmount,
    monthlyContributionCap,
    nominalReturnPct,
    inflationPct,
    spendingMode,
    desiredAnnualSpending,
    targetWithdrawalRatePct,
    otherAnnualIncome,
  } = inputs;

  const warnings: WarningCode[] = [];

  // 1. Rates.
  const realReturn = computeRealReturn(nominalReturnPct, inflationPct);
  const rm = monthlyRate(realReturn);
  if (realReturn < 0) {
    warnings.push("inflationOutpacesReturn");
  }

  // 2. Horizon, measured in whole months. Ages are integers, so these are exact.
  const totalMonths = Math.round((planToAge - currentAge) * MONTHS_PER_YEAR);
  const accumMonths = Math.max(
    0,
    Math.round((retirementAge - currentAge) * MONTHS_PER_YEAR),
  );
  const drawdownMonths = totalMonths - accumMonths;

  if (retirementAge <= currentAge) {
    warnings.push("retiredAlready");
  }

  // 3. What we must pull from savings each year. In "amount" mode this is fixed
  //    up front (desired − other income). In "rate" mode it depends on the pot at
  //    retirement, which we only know once accumulation has run — so we resolve it
  //    lazily on the first drawdown month (see the loop below).
  const amountModeNet = Math.max(0, desiredAnnualSpending - otherAnnualIncome);
  let netAnnualSpending = spendingMode === "rate" ? 0 : amountModeNet;
  let monthlyNet = netAnnualSpending / MONTHS_PER_YEAR;
  let spendingResolved = spendingMode !== "rate";

  // 4. Walk month by month, recording a row at each year boundary.
  const pensionRate = pensionContributionPct / 100;
  const raisePerYear = annualContributionIncreasePct / 100;
  // An optional ceiling on the (growing) personal contribution. 0 means no cap.
  const hasCap = monthlyContributionCap > 0;

  let balance = currentSavings;
  let balanceAtRetirement = currentSavings; // correct already if accumMonths === 0
  let depletedAtMonth: number | null = null;

  const yearly: YearRow[] = [];
  let yearStartBalance = balance;
  let yearContributions = 0;
  let yearWithdrawals = 0;

  for (let m = 0; m < totalMonths; m++) {
    const yearIndex = Math.floor(m / MONTHS_PER_YEAR);
    const inAccumulation = m < accumMonths;

    // Reset the per-year accumulators at the first month of each year.
    if (m % MONTHS_PER_YEAR === 0) {
      yearStartBalance = balance;
      yearContributions = 0;
      yearWithdrawals = 0;
    }

    if (inAccumulation) {
      // This month's contribution. In "percent" mode a real raise compounds onto
      // both your savings and the income the pension tracks. In "amount" mode a
      // fixed extra is added to your personal savings each year (linear), and the
      // pension stays income-linked and flat. An optional cap holds the personal
      // part once it's grown past the ceiling (the pension is never capped here).
      let monthlyContrib: number;
      if (contributionIncreaseMode === "amount") {
        let personal =
          monthlyContribution + annualContributionIncreaseAmount * yearIndex;
        if (hasCap) personal = Math.min(personal, monthlyContributionCap);
        monthlyContrib = personal + monthlyIncome * pensionRate;
      } else {
        const raiseFactor = Math.pow(1 + raisePerYear, yearIndex);
        if (hasCap) {
          const personal = Math.min(
            monthlyContribution * raiseFactor,
            monthlyContributionCap,
          );
          monthlyContrib = personal + monthlyIncome * pensionRate * raiseFactor;
        } else {
          // No cap: keep the original combined form so results are bit-for-bit
          // identical to before this option existed.
          monthlyContrib =
            (monthlyContribution + monthlyIncome * pensionRate) * raiseFactor;
        }
      }

      // Grow first, then add this month's contribution.
      balance = balance * (1 + rm) + monthlyContrib;
      yearContributions += monthlyContrib;
    } else if (depletedAtMonth === null) {
      // First drawdown month in "rate" mode: the pot at retirement is now known,
      // so lock in the yearly spend that the target withdrawal rate implies.
      if (!spendingResolved) {
        netAnnualSpending = Math.max(
          0,
          (targetWithdrawalRatePct / 100) * balanceAtRetirement,
        );
        monthlyNet = netAnnualSpending / MONTHS_PER_YEAR;
        spendingResolved = true;
      }
      // Withdraw this month's living costs first…
      balance -= monthlyNet;
      yearWithdrawals += monthlyNet;
      if (balance <= 0) {
        depletedAtMonth = m;
        balance = 0;
      } else {
        // …then grow whatever is left.
        balance *= 1 + rm;
      }
    } else {
      // Already ran out: stays at zero for the rest of the trajectory.
      balance = 0;
    }

    // Capture the balance the instant accumulation ends (= the retirement pot).
    if (m + 1 === accumMonths) {
      balanceAtRetirement = balance;
    }

    // Close out a year row at each year boundary (and on the very last month).
    const isYearEnd =
      m % MONTHS_PER_YEAR === MONTHS_PER_YEAR - 1 || m === totalMonths - 1;
    if (isYearEnd) {
      const endBalance = balance;
      const phase: Phase = inAccumulation ? "accumulation" : "drawdown";
      // Growth is the residual once contributions/withdrawals are accounted for.
      const growth =
        endBalance - yearStartBalance - yearContributions + yearWithdrawals;
      // This year's draw as a share of the pot it started with (drawdown only).
      const withdrawalRatePct =
        yearWithdrawals > 0 && yearStartBalance > 0
          ? (yearWithdrawals / yearStartBalance) * 100
          : null;
      yearly.push({
        age: currentAge + yearIndex,
        phase,
        startBalance: yearStartBalance,
        contributions: yearContributions,
        withdrawals: yearWithdrawals,
        growth,
        endBalance,
        withdrawalRatePct,
      });
    }
  }

  if (accumMonths === 0) {
    balanceAtRetirement = currentSavings;
  }

  // 5. Summarise.
  const willLast = depletedAtMonth === null;
  const depletionAge =
    depletedAtMonth === null
      ? null
      : currentAge + depletedAtMonth / MONTHS_PER_YEAR;
  const endingBalance = willLast ? balance : 0;
  const yearsShort = depletionAge === null ? 0 : planToAge - depletionAge;

  const sustainableAnnualSpending = findSustainableSpending(
    balanceAtRetirement,
    otherAnnualIncome,
    rm,
    drawdownMonths,
  );

  // The gross spend the plan actually used: in "rate" mode it's what we derived
  // from the rate (net drawn from savings) plus any other income; in "amount"
  // mode it's simply the user's desired figure.
  const effectiveDesiredAnnualSpending =
    spendingMode === "rate"
      ? netAnnualSpending + otherAnnualIncome
      : desiredAnnualSpending;

  // Initial withdrawal rate: the first year's net draw as a % of the retirement
  // pot — the figure to sanity-check against the ~4% guideline. null if there's
  // no pot to draw from.
  const initialWithdrawalRatePct =
    balanceAtRetirement > 0
      ? (netAnnualSpending / balanceAtRetirement) * 100
      : null;

  if (
    otherAnnualIncome >= effectiveDesiredAnnualSpending &&
    effectiveDesiredAnnualSpending > 0
  ) {
    warnings.push("incomeCoversSpending");
  }

  return {
    inputs,
    realAnnualReturnPct: realReturn * 100,
    balanceAtRetirement,
    netAnnualSpending,
    effectiveDesiredAnnualSpending,
    initialWithdrawalRatePct,
    willLast,
    depletionAge,
    endingBalance,
    yearsShort,
    sustainableAnnualSpending,
    yearly,
    status: willLast ? "on_track" : "depletes_early",
    warnings,
  };
}
