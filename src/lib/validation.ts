/**
 * Zod schemas — the single source of truth for "what is a valid input?".
 *
 * The SAME schema runs in two places:
 *   - in the browser, to give instant inline feedback as the user types, and
 *   - on the server, to reject anything bad before it touches the database.
 *
 * Zod also gives us TypeScript types for free via z.infer, so the form data and
 * the engine inputs can never silently drift apart.
 *
 * (This project uses Zod 4, where format helpers like `z.email()` are top-level
 * functions rather than chained methods.)
 */

import { z } from "zod";
import { LIMITS, DEFAULT_INPUTS } from "./constants";

/**
 * The full set of calculator inputs. `z.coerce.number()` means a value arriving
 * as the string "60" (e.g. from an <input>) is turned into the number 60 before
 * the min/max checks run.
 */
export const retirementInputSchema = z
  .object({
    currentAge: z.coerce.number().int().min(LIMITS.age.min).max(LIMITS.age.max),
    retirementAge: z.coerce
      .number()
      .int()
      .min(LIMITS.age.min)
      .max(LIMITS.age.max),
    planToAge: z.coerce
      .number()
      .int()
      .min(LIMITS.planToAge.min)
      .max(LIMITS.planToAge.max),
    currentSavings: z.coerce
      .number()
      .min(LIMITS.money.min)
      .max(LIMITS.money.max),
    monthlyContribution: z.coerce
      .number()
      .min(LIMITS.monthlyMoney.min)
      .max(LIMITS.monthlyMoney.max),
    monthlyIncome: z.coerce
      .number()
      .min(LIMITS.monthlyMoney.min)
      .max(LIMITS.monthlyMoney.max),
    pensionContributionPct: z.coerce
      .number()
      .min(LIMITS.pct.min)
      .max(LIMITS.pct.max),
    // New fields default so older saved plans / share links (which lack them)
    // still parse cleanly into the current shape.
    contributionIncreaseMode: z
      .enum(["percent", "amount"])
      .default(DEFAULT_INPUTS.contributionIncreaseMode),
    annualContributionIncreasePct: z.coerce
      .number()
      .min(LIMITS.raisePct.min)
      .max(LIMITS.raisePct.max),
    annualContributionIncreaseAmount: z.coerce
      .number()
      .min(LIMITS.raiseAmount.min)
      .max(LIMITS.raiseAmount.max)
      .default(DEFAULT_INPUTS.annualContributionIncreaseAmount),
    // 0 = no cap. Bounded by the same ceiling as any monthly money figure.
    monthlyContributionCap: z.coerce
      .number()
      .min(LIMITS.monthlyMoney.min)
      .max(LIMITS.monthlyMoney.max)
      .default(DEFAULT_INPUTS.monthlyContributionCap),
    nominalReturnPct: z.coerce
      .number()
      .min(LIMITS.returnPct.min)
      .max(LIMITS.returnPct.max),
    inflationPct: z.coerce
      .number()
      .min(LIMITS.inflationPct.min)
      .max(LIMITS.inflationPct.max),
    spendingMode: z
      .enum(["amount", "rate"])
      .default(DEFAULT_INPUTS.spendingMode),
    desiredAnnualSpending: z.coerce
      .number()
      .min(LIMITS.money.min)
      .max(LIMITS.money.max),
    targetWithdrawalRatePct: z.coerce
      .number()
      .min(LIMITS.withdrawalRatePct.min)
      .max(LIMITS.withdrawalRatePct.max)
      .default(DEFAULT_INPUTS.targetWithdrawalRatePct),
    otherAnnualIncome: z.coerce
      .number()
      .min(LIMITS.money.min)
      .max(LIMITS.money.max),
    currency: z.string().min(1).max(8),
  })
  // Cross-field rules: the timeline has to make sense.
  .refine((d) => d.retirementAge >= d.currentAge, {
    message: "Retirement age can't be before your current age.",
    path: ["retirementAge"],
  })
  .refine((d) => d.planToAge > d.retirementAge, {
    message: "Plan-until age has to be after your retirement age.",
    path: ["planToAge"],
  });

/** The validated, fully-typed inputs (what the engine consumes). */
export type RetirementInputParsed = z.infer<typeof retirementInputSchema>;

/** Payload for creating/updating a saved plan. */
export const planPayloadSchema = z.object({
  name: z.string().trim().min(1, "Give your plan a name.").max(80),
  inputs: retirementInputSchema,
});
export type PlanPayload = z.infer<typeof planPayloadSchema>;

/** Sign-up payload for the email/password (credentials) flow. */
export const registerSchema = z.object({
  name: z.string().trim().min(1, "Tell us your name.").max(80),
  email: z.email("Enter a valid email address.").max(200),
  password: z
    .string()
    .min(8, "Use at least 8 characters.")
    .max(200, "That password is too long."),
});
export type RegisterPayload = z.infer<typeof registerSchema>;
