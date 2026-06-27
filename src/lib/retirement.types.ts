/**
 * Type definitions for the retirement projection engine.
 *
 * These interfaces are the "contract" between the pure calculation logic
 * (src/lib/retirement.ts) and everything else (the UI, the API, the database).
 * Because the engine only ever speaks in these plain types — no React, no
 * Next.js, no Prisma — it can be unit-tested in isolation and reused on both
 * the browser and the server.
 *
 * A note on money + rates:
 *   - Every amount is in TODAY'S money (real terms / today's purchasing power).
 *   - We convert the user's nominal return + inflation into a single "real
 *     return", so the whole simulation can stay in today's Ringgit. That keeps
 *     the numbers intuitive: "RM48,000/year" means RM48,000 of today's spending
 *     power, no matter how far in the future it is.
 */

/** Which half of life a given year belongs to. */
export type Phase = "accumulation" | "drawdown";

/** Overall verdict for a projection. */
export type RetirementStatus =
  | "on_track" // savings last all the way to planToAge (with money to spare or exactly enough)
  | "depletes_early"; // savings run out before planToAge

/**
 * Everything the user can tweak. All numbers are plain numbers (already parsed
 * and validated by the Zod schema in validation.ts before they reach here).
 */
export interface RetirementInputs {
  // --- Timeline ---
  /** How old the user is now. */
  currentAge: number;
  /** The age they plan to stop working / start drawing down. */
  retirementAge: number;
  /** The age they want the money to last until (a life-expectancy planning horizon). */
  planToAge: number;

  // --- Saving up (accumulation phase) ---
  /** Money already invested today. */
  currentSavings: number;
  /** Personal savings added every month, in today's money. */
  monthlyContribution: number;
  /** Gross monthly income, in today's money. Only used to derive the pension contribution. */
  monthlyIncome: number;
  /** Employer + employee retirement/pension contribution, as a % of monthly income. */
  pensionContributionPct: number;
  /** Real (above-inflation) annual raise applied to income + contributions. 0 = contributions stay flat in today's money. */
  annualContributionIncreasePct: number;

  // --- Returns + inflation ---
  /** Expected nominal annual investment return, before inflation. */
  nominalReturnPct: number;
  /** Expected annual inflation. */
  inflationPct: number;

  // --- Spending down (drawdown phase) ---
  /** Desired annual spending in retirement, in today's money. */
  desiredAnnualSpending: number;
  /** Other guaranceed annual retirement income (gov pension, annuity, rental…), today's money. Reduces what must come from savings. */
  otherAnnualIncome: number;

  // --- Display ---
  /** Currency symbol/prefix used purely for formatting, e.g. "RM". */
  currency: string;
}

/**
 * One row of the year-by-year trajectory. The chart and the breakdown table are
 * both built from an array of these. A year always belongs entirely to one
 * phase (ages are whole numbers, so the switch to drawdown lands on a boundary).
 *
 * The numbers reconcile like this:
 *   endBalance = startBalance + contributions + growth - withdrawals
 */
export interface YearRow {
  /** Age at the START of this year. */
  age: number;
  phase: Phase;
  /** Portfolio value at the start of the year. */
  startBalance: number;
  /** Total contributions added during the year (0 in drawdown). */
  contributions: number;
  /** Total withdrawals taken during the year (0 in accumulation). */
  withdrawals: number;
  /** Investment growth during the year, in real terms (can be negative). */
  growth: number;
  /** Portfolio value at the end of the year. */
  endBalance: number;
}

/** The full result the engine hands back to the UI/API. */
export interface RetirementResult {
  /** Echo of the inputs used (handy for rendering + saving). */
  inputs: RetirementInputs;
  /** The single real return % the simulation actually used. */
  realAnnualReturnPct: number;
  /** Portfolio value the moment they retire. */
  balanceAtRetirement: number;
  /** Net amount that must come from savings each year = desired - other income (never below 0). */
  netAnnualSpending: number;
  /** Does the money last all the way to planToAge? */
  willLast: boolean;
  /** The age the money runs out, or null if it lasts. May be fractional (e.g. 84.5). */
  depletionAge: number | null;
  /** Money left at planToAge (0 if it ran out earlier). */
  endingBalance: number;
  /** How many years short of planToAge the money fell (0 if it lasts). */
  yearsShort: number;
  /**
   * The highest desired-annual-spending level that would still last exactly to
   * planToAge, given everything else. Compare against desiredAnnualSpending to
   * see how much room (or shortfall) there is. In today's money.
   */
  sustainableAnnualSpending: number;
  /** The full accumulation + drawdown trajectory, one entry per year. */
  yearly: YearRow[];
  status: RetirementStatus;
  /** Plain-language notes about the projection (e.g. unusual inputs). */
  warnings: string[];
}
