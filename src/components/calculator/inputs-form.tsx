"use client";

import type { RetirementInputs } from "@/lib/retirement.types";
import { LIMITS, CURRENCIES } from "@/lib/constants";
import { useDict } from "@/lib/i18n/provider";
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

/**
 * The full input panel. Each field reports changes through `onChange`, which the
 * parent merges into state and recomputes from — there's no local form state to
 * keep in sync, which keeps the live-update behaviour simple and predictable.
 */
export function InputsForm({ inputs, onChange, errors }: InputsFormProps) {
  const t = useDict();
  const money = inputs.currency;

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
        <NumberField
          label={t.inputs.yearlyIncrease}
          value={inputs.annualContributionIncreasePct}
          onChange={(v) => onChange({ annualContributionIncreasePct: v })}
          min={LIMITS.raisePct.min}
          max={LIMITS.raisePct.max}
          slider
          suffix={t.inputs.pctSuffix}
          helper={t.inputs.yearlyIncreaseHelper}
          error={errors.annualContributionIncreasePct}
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
        <NumberField
          label={t.inputs.desiredSpending}
          value={inputs.desiredAnnualSpending}
          onChange={(v) => onChange({ desiredAnnualSpending: v })}
          min={LIMITS.money.min}
          prefix={money}
          step={1000}
          helper={t.inputs.desiredSpendingHelper}
          error={errors.desiredAnnualSpending}
        />
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
