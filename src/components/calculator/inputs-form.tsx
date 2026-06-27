"use client";

import type { RetirementInputs } from "@/lib/retirement.types";
import { LIMITS, CURRENCIES } from "@/lib/constants";
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
  const money = inputs.currency;

  return (
    <div className="space-y-7">
      <Section title="Your timeline">
        <NumberField
          label="Current age"
          value={inputs.currentAge}
          onChange={(v) => onChange({ currentAge: v })}
          min={LIMITS.age.min}
          max={LIMITS.age.max}
          slider
          suffix="yrs"
          error={errors.currentAge}
        />
        <NumberField
          label="Retirement age"
          value={inputs.retirementAge}
          onChange={(v) => onChange({ retirementAge: v })}
          min={LIMITS.age.min}
          max={LIMITS.age.max}
          slider
          suffix="yrs"
          error={errors.retirementAge}
        />
        <NumberField
          label="Plan until age"
          value={inputs.planToAge}
          onChange={(v) => onChange({ planToAge: v })}
          min={LIMITS.planToAge.min}
          max={LIMITS.planToAge.max}
          slider
          suffix="yrs"
          helper="A planning horizon — how long the money may need to last."
          error={errors.planToAge}
        />
      </Section>

      <Section title="Saving up">
        <NumberField
          label="Current savings"
          value={inputs.currentSavings}
          onChange={(v) => onChange({ currentSavings: v })}
          min={LIMITS.money.min}
          prefix={money}
          step={1000}
          error={errors.currentSavings}
        />
        <NumberField
          label="Monthly contribution"
          value={inputs.monthlyContribution}
          onChange={(v) => onChange({ monthlyContribution: v })}
          min={LIMITS.monthlyMoney.min}
          prefix={money}
          step={100}
          helper="What you put away each month, in today's money."
          error={errors.monthlyContribution}
        />
        <NumberField
          label="Monthly income (optional)"
          value={inputs.monthlyIncome}
          onChange={(v) => onChange({ monthlyIncome: v })}
          min={LIMITS.monthlyMoney.min}
          prefix={money}
          step={100}
          helper="Only used to work out your pension contribution below."
          error={errors.monthlyIncome}
        />
        <NumberField
          label="Pension / employer contribution"
          value={inputs.pensionContributionPct}
          onChange={(v) => onChange({ pensionContributionPct: v })}
          min={LIMITS.pct.min}
          max={LIMITS.pct.max}
          slider
          suffix="%"
          helper="Of your monthly income (employer + employee)."
          error={errors.pensionContributionPct}
        />
        <NumberField
          label="Yearly contribution increase"
          value={inputs.annualContributionIncreasePct}
          onChange={(v) => onChange({ annualContributionIncreasePct: v })}
          min={LIMITS.raisePct.min}
          max={LIMITS.raisePct.max}
          slider
          suffix="%"
          helper="Real raises above inflation. Leave at 0 if unsure."
          error={errors.annualContributionIncreasePct}
        />
      </Section>

      <Section title="Growth & inflation">
        <NumberField
          label="Expected return (before inflation)"
          value={inputs.nominalReturnPct}
          onChange={(v) => onChange({ nominalReturnPct: v })}
          min={LIMITS.returnPct.min}
          max={LIMITS.returnPct.max}
          slider
          step={0.1}
          suffix="%"
          helper="A broad market average is often 5–8% a year."
          error={errors.nominalReturnPct}
        />
        <NumberField
          label="Inflation"
          value={inputs.inflationPct}
          onChange={(v) => onChange({ inflationPct: v })}
          min={LIMITS.inflationPct.min}
          max={LIMITS.inflationPct.max}
          slider
          step={0.1}
          suffix="%"
          helper="How fast prices rise. Often around 2–3% a year."
          error={errors.inflationPct}
        />
      </Section>

      <Section title="In retirement">
        <NumberField
          label="Desired yearly spending"
          value={inputs.desiredAnnualSpending}
          onChange={(v) => onChange({ desiredAnnualSpending: v })}
          min={LIMITS.money.min}
          prefix={money}
          step={1000}
          helper="In today's money — what a year of retirement costs you now."
          error={errors.desiredAnnualSpending}
        />
        <NumberField
          label="Other yearly income (optional)"
          value={inputs.otherAnnualIncome}
          onChange={(v) => onChange({ otherAnnualIncome: v })}
          min={LIMITS.money.min}
          prefix={money}
          step={1000}
          helper="Government pension, annuity, rent… reduces what savings must cover."
          error={errors.otherAnnualIncome}
        />

        <div className="space-y-2">
          <Label>Currency</Label>
          <Select
            value={inputs.currency}
            onValueChange={(v) => onChange({ currency: v })}
          >
            <SelectTrigger aria-label="Currency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CURRENCIES.map((c) => (
                <SelectItem key={c.symbol} value={c.symbol}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Section>
    </div>
  );
}
