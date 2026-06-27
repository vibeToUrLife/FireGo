"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** Shown inside the input on the left, e.g. "RM". */
  prefix?: string;
  /** Shown inside the input on the right, e.g. "%". */
  suffix?: string;
  helper?: string;
  error?: string;
  /** Show a drag slider under the input (needs min + max). */
  slider?: boolean;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * One labelled numeric input — optionally with a currency/percent affix and a
 * companion slider. Controlled: it always reflects `value` and reports changes
 * via `onChange`, so results recompute live as the user types or drags.
 */
export function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix,
  suffix,
  helper,
  error,
  slider = false,
}: NumberFieldProps) {
  const id = useId();
  const describedBy = error
    ? `${id}-error`
    : helper
      ? `${id}-helper`
      : undefined;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.valueAsNumber;
    onChange(Number.isNaN(next) ? 0 : next);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>

      <div className="relative">
        {prefix && (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="number"
          inputMode="decimal"
          value={Number.isFinite(value) ? value : ""}
          onChange={handleInputChange}
          min={min}
          max={max}
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={cn("tabular-nums", prefix && "pl-11", suffix && "pr-9")}
        />
        {suffix && (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm">
            {suffix}
          </span>
        )}
      </div>

      {slider && min !== undefined && max !== undefined && (
        <Slider
          value={[clamp(Number.isFinite(value) ? value : min, min, max)]}
          min={min}
          max={max}
          step={step ?? 1}
          onValueChange={(v) => onChange(v[0])}
          aria-label={label}
        />
      )}

      {error ? (
        <p id={`${id}-error`} className="text-negative text-xs">
          {error}
        </p>
      ) : helper ? (
        <p id={`${id}-helper`} className="text-muted-foreground text-xs">
          {helper}
        </p>
      ) : null}
    </div>
  );
}
