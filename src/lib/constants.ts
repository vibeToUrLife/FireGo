/**
 * Shared constants: sensible defaults for the calculator and the list of
 * currencies. Kept separate so both the UI and tests can import them without
 * pulling in any framework code.
 */

import type { RetirementInputs } from "./retirement.types";

/**
 * The values the calculator starts with. Chosen to be realistic for an ordinary
 * working person (Malaysian default in RM) rather than to flatter the result.
 */
export const DEFAULT_INPUTS: RetirementInputs = {
  currentAge: 30,
  retirementAge: 60,
  planToAge: 90,
  currentSavings: 50_000,
  monthlyContribution: 1_000,
  monthlyIncome: 5_000,
  pensionContributionPct: 12,
  contributionIncreaseMode: "percent",
  annualContributionIncreasePct: 2,
  annualContributionIncreaseAmount: 100,
  monthlyContributionCap: 0,
  nominalReturnPct: 7,
  inflationPct: 3,
  spendingMode: "amount",
  desiredAnnualSpending: 48_000,
  targetWithdrawalRatePct: 4,
  otherAnnualIncome: 0,
  currency: "RM",
};

/** Currency options. `symbol` is used as a prefix when formatting amounts. */
export const CURRENCIES: ReadonlyArray<{ symbol: string; label: string }> = [
  { symbol: "RM", label: "Malaysian Ringgit (RM)" },
  { symbol: "$", label: "US Dollar ($)" },
  { symbol: "S$", label: "Singapore Dollar (S$)" },
  { symbol: "£", label: "British Pound (£)" },
  { symbol: "€", label: "Euro (€)" },
  { symbol: "¥", label: "Yen / Renminbi (¥)" },
  { symbol: "₹", label: "Indian Rupee (₹)" },
  { symbol: "A$", label: "Australian Dollar (A$)" },
];

/**
 * Hard limits used by both the Zod schema (validation.ts) and the input sliders.
 * Centralised here so the form, the validator, and the docs never drift apart.
 */
export const LIMITS = {
  age: { min: 16, max: 100 },
  planToAge: { min: 17, max: 120 },
  money: { min: 0, max: 1_000_000_000 },
  monthlyMoney: { min: 0, max: 10_000_000 },
  pct: { min: 0, max: 100 },
  raisePct: { min: 0, max: 50 },
  // A fixed extra monthly contribution added each year (today's money).
  raiseAmount: { min: 0, max: 1_000_000 },
  inflationPct: { min: 0, max: 50 },
  // Initial drawdown rate, e.g. the 4% rule. Bounded well above any sane plan.
  withdrawalRatePct: { min: 0, max: 20 },
  // Returns can be negative (a pessimistic scenario) but are bounded for sanity.
  returnPct: { min: -20, max: 50 },
} as const;
