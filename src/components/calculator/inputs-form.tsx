"use client";

import type {
  RetirementInputs,
  RetirementResult,
} from "@/lib/retirement.types";
import { LIMITS, CURRENCIES } from "@/lib/constants";
import { formatCurrency } from "@/lib/format";
import { useDict } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";
import { NumberField } from "./number-field";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface InputsFormProps {
  inputs: RetirementInputs;
  onChange: (patch: Partial<RetirementInputs>) => void;
  errors: Partial<Record<keyof RetirementInputs, string>>;
  /** The live projection — used to show the figure a "rate"-mode plan implies. */
  result: RetirementResult;
}

/** A titled group of related inputs (uses fieldset/legend for accessibility). */
function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-foreground mb-1 text-sm font-semibold">
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

/** A compact two-option segmented control, e.g. "% | amount". */
function ModeToggle({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="bg-muted inline-flex gap-0.5 rounded-md p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded px-2 py-1 text-xs font-medium transition-colors",
            value === o.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/**
 * The full input panel. Each field reports changes through `onChange`, which the
 * parent merges into state and recomputes from — there's no local form state to
 * keep in sync, which keeps the live-update behaviour simple and predictable.
 */
export function InputsForm({
  inputs,
  onChange,
  errors,
  result,
}: InputsFormProps) {
  const t = useDict();
  const money = inputs.currency;

  // The "% / amount" toggle for the yearly contribution increase. Shared by both
  // branches so it sits in the same spot whichever unit is active.
  const increaseToggle = (
    <ModeToggle
      ariaLabel={t.inputs.increaseModeAria}
      value={inputs.contributionIncreaseMode}
      onChange={(v) =>
        onChange({ contributionIncreaseMode: v as "percent" | "amount" })
      }
      options={[
        { value: "percent", label: t.inputs.modePercent },
        { value: "amount", label: t.inputs.modeAmount },
      ]}
    />
  );

  // Switching how spending is specified carries the current figure across, so the
  // toggle feels continuous rather than snapping to an unrelated number.
  const setSpendingMode = (mode: string) => {
    if (mode === inputs.spendingMode) return;
    if (mode === "amount") {
      onChange({
        spendingMode: "amount",
        desiredAnnualSpending: Math.round(
          result.effectiveDesiredAnnualSpending,
        ),
      });
    } else {
      const rate = result.initialWithdrawalRatePct;
      onChange({
        spendingMode: "rate",
        ...(rate !== null
          ? { targetWithdrawalRatePct: Math.round(rate * 10) / 10 }
          : {}),
      });
    }
  };

  const spendingToggle = (
    <ModeToggle
      ariaLabel={t.inputs.spendingModeAria}
      value={inputs.spendingMode}
      onChange={setSpendingMode}
      options={[
        { value: "amount", label: t.inputs.spendingModeAmount },
        { value: "rate", label: t.inputs.spendingModeRate },
      ]}
    />
  );

  return (
    <div className="space-y-7">
      <Section title={t.inputs.sectionTimeline}>
        <NumberField
          label={t.inputs.currentAge}
          value={inputs.currentAge}
          onChange={(v) => onChange({ currentAge: v })}
          min={LIMITS.age.min}
          max={LIMITS.age.max}
          slider
          suffix={t.inputs.yearsSuffix}
          error={errors.currentAge}
        />
        <NumberField
          label={t.inputs.retirementAge}
          value={inputs.retirementAge}
          onChange={(v) => onChange({ retirementAge: v })}
          min={LIMITS.age.min}
          max={LIMITS.age.max}
          slider
          suffix={t.inputs.yearsSuffix}
          error={errors.retirementAge}
        />
        <NumberField
          label={t.inputs.planToAge}
          value={inputs.planToAge}
          onChange={(v) => onChange({ planToAge: v })}
          min={LIMITS.planToAge.min}
          max={LIMITS.planToAge.max}
          slider
          suffix={t.inputs.yearsSuffix}
          helper={t.inputs.planToAgeHelper}
          error={errors.planToAge}
        />
      </Section>

      <Section title={t.inputs.sectionSaving}>
        <NumberField
          label={t.inputs.currentSavings}
          value={inputs.currentSavings}
          onChange={(v) => onChange({ currentSavings: v })}
          min={LIMITS.money.min}
          prefix={money}
          step={1000}
          helper={t.inputs.currentSavingsHelper}
          error={errors.currentSavings}
        />
        <NumberField
          label={t.inputs.monthlyContribution}
          value={inputs.monthlyContribution}
          onChange={(v) => onChange({ monthlyContribution: v })}
          min={LIMITS.monthlyMoney.min}
          prefix={money}
          step={100}
          helper={t.inputs.monthlyContributionHelper}
          error={errors.monthlyContribution}
        />
        <NumberField
          label={t.inputs.monthlyIncome}
          value={inputs.monthlyIncome}
          onChange={(v) => onChange({ monthlyIncome: v })}
          min={LIMITS.monthlyMoney.min}
          prefix={money}
          step={100}
          helper={t.inputs.monthlyIncomeHelper}
          error={errors.monthlyIncome}
        />
        <NumberField
          label={t.inputs.pension}
          value={inputs.pensionContributionPct}
          onChange={(v) => onChange({ pensionContributionPct: v })}
          min={LIMITS.pct.min}
          max={LIMITS.pct.max}
          slider
          suffix={t.inputs.pctSuffix}
          helper={t.inputs.pensionHelper}
          error={errors.pensionContributionPct}
        />

        {/* Yearly contribution increase — as a % raise or a fixed extra amount. */}
        {inputs.contributionIncreaseMode === "percent" ? (
          <NumberField
            label={t.inputs.yearlyIncrease}
            headerRight={increaseToggle}
            value={inputs.annualContributionIncreasePct}
            onChange={(v) => onChange({ annualContributionIncreasePct: v })}
            min={LIMITS.raisePct.min}
            max={LIMITS.raisePct.max}
            slider
            suffix={t.inputs.pctSuffix}
            helper={t.inputs.yearlyIncreaseHelper}
            error={errors.annualContributionIncreasePct}
          />
        ) : (
          <NumberField
            label={t.inputs.yearlyIncrease}
            headerRight={increaseToggle}
            value={inputs.annualContributionIncreaseAmount}
            onChange={(v) => onChange({ annualContributionIncreaseAmount: v })}
            min={LIMITS.raiseAmount.min}
            prefix={money}
            step={50}
            helper={t.inputs.yearlyIncreaseAmountHelper}
            error={errors.annualContributionIncreaseAmount}
          />
        )}

        {/* Optional ceiling the growing contribution won't climb past. */}
        <NumberField
          label={t.inputs.contributionCap}
          value={inputs.monthlyContributionCap}
          onChange={(v) => onChange({ monthlyContributionCap: v })}
          min={LIMITS.monthlyMoney.min}
          prefix={money}
          step={100}
          helper={t.inputs.contributionCapHelper}
          error={errors.monthlyContributionCap}
        />
      </Section>

      <Section title={t.inputs.sectionGrowth}>
        <NumberField
          label={t.inputs.expectedReturn}
          value={inputs.nominalReturnPct}
          onChange={(v) => onChange({ nominalReturnPct: v })}
          min={LIMITS.returnPct.min}
          max={LIMITS.returnPct.max}
          slider
          step={0.1}
          suffix={t.inputs.pctSuffix}
          helper={t.inputs.expectedReturnHelper}
          error={errors.nominalReturnPct}
        />
        <NumberField
          label={t.inputs.inflation}
          value={inputs.inflationPct}
          onChange={(v) => onChange({ inflationPct: v })}
          min={LIMITS.inflationPct.min}
          max={LIMITS.inflationPct.max}
          slider
          step={0.1}
          suffix={t.inputs.pctSuffix}
          helper={t.inputs.inflationHelper}
          error={errors.inflationPct}
        />
      </Section>

      <Section title={t.inputs.sectionRetirement}>
        {/* 点1: be explicit that the plan stops contributing once you retire. */}
        <p className="text-muted-foreground -mt-1 text-xs">
          {t.inputs.retirementNote}
        </p>

        {/* Spending — as a fixed yearly amount or a target withdrawal rate. */}
        {inputs.spendingMode === "amount" ? (
          <NumberField
            label={t.inputs.desiredSpending}
            headerRight={spendingToggle}
            value={inputs.desiredAnnualSpending}
            onChange={(v) => onChange({ desiredAnnualSpending: v })}
            min={LIMITS.money.min}
            prefix={money}
            step={1000}
            helper={t.inputs.desiredSpendingHelper}
            error={errors.desiredAnnualSpending}
          />
        ) : (
          <div className="space-y-2">
            <NumberField
              label={t.inputs.targetWithdrawalRate}
              headerRight={spendingToggle}
              value={inputs.targetWithdrawalRatePct}
              onChange={(v) => onChange({ targetWithdrawalRatePct: v })}
              min={LIMITS.withdrawalRatePct.min}
              max={LIMITS.withdrawalRatePct.max}
              slider
              step={0.1}
              suffix={t.inputs.pctSuffix}
              helper={t.inputs.targetWithdrawalRateHelper}
              error={errors.targetWithdrawalRatePct}
            />
            <p className="text-muted-foreground text-xs">
              {t.inputs.derivedSpending(
                formatCurrency(result.effectiveDesiredAnnualSpending, money),
                formatCurrency(
                  result.effectiveDesiredAnnualSpending / 12,
                  money,
                ),
              )}
            </p>
          </div>
        )}

        <NumberField
          label={t.inputs.otherIncome}
          value={inputs.otherAnnualIncome}
          onChange={(v) => onChange({ otherAnnualIncome: v })}
          min={LIMITS.money.min}
          prefix={money}
          step={1000}
          helper={t.inputs.otherIncomeHelper}
          error={errors.otherAnnualIncome}
        />

        <div className="space-y-2">
          <Label>{t.inputs.currency}</Label>
          <Select
            value={inputs.currency}
            onValueChange={(v) => onChange({ currency: v })}
          >
            <SelectTrigger aria-label={t.inputs.currency}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.symbol} value={c.symbol}>
                  {t.currencies[c.symbol as keyof typeof t.currencies] ??
                    c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>
    </div>
  );
}
