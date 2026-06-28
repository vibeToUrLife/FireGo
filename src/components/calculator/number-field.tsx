"use client";

import { useId, useState } from "react";
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
  /** Optional control rendered at the right end of the label row, e.g. a unit toggle. */
  headerRight?: React.ReactNode;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** A number as the text we'd show for it (non-finite → empty). */
function toText(n: number): string {
  return Number.isFinite(n) ? String(n) : "";
}

/**
 * Tidy what the user types: keep digits and at most one decimal point, an
 * optional leading minus (only where negatives make sense), and no leading
 * zeros — so clearing the field and typing "23" gives "23", never "023".
 */
function sanitize(raw: string, allowNegative: boolean): string {
  let s = raw.replace(/[^\d.-]/g, "");
  s = (allowNegative && s.startsWith("-") ? "-" : "") + s.replace(/-/g, "");
  const dot = s.indexOf(".");
  if (dot !== -1) {
    s = s.slice(0, dot + 1) + s.slice(dot + 1).replace(/\./g, "");
  }
  // Drop leading zeros, but keep a lone "0" and decimals like "0.5".
  s = s.replace(/^(-?)0+(?=\d)/, "$1");
  return s;
}

/** Parse the editable text into the number we report upward. */
function toNumber(text: string): number {
  if (text === "" || text === "-" || text === "." || text === "-.") return 0;
  const n = Number(text);
  return Number.isFinite(n) ? n : 0;
}

/**
 * One labelled numeric input — optionally with a currency/percent affix and a
 * companion slider.
 *
 * The text the user sees is held in local state, so the field can sit empty or
 * mid-edit (e.g. "0.") instead of being snapped back to a number on every
 * keystroke. We only ever push a parsed number up to the parent, and we adopt
 * changes that come from *outside* the field (a slider drag, a loaded plan).
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
  headerRight,
}: NumberFieldProps) {
  const id = useId();
  const allowNegative = min === undefined ? true : min < 0;

  const [text, setText] = useState<string>(() => toText(value));
  const [prevValue, setPrevValue] = useState<number>(value);

  // When `value` changes for a reason other than our own typing (slider reset,
  // a saved plan loading), adopt it. We compare against `prevValue` so the echo
  // of our own onChange doesn't clobber what the user is in the middle of.
  if (value !== prevValue) {
    setPrevValue(value);
    if (toNumber(text) !== value) setText(toText(value));
  }

  const describedBy = error
    ? `${id}-error`
    : helper
      ? `${id}-helper`
      : undefined;

  const emit = (n: number) => {
    setPrevValue(n);
    onChange(n);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = sanitize(e.target.value, allowNegative);
    setText(cleaned);
    emit(toNumber(cleaned));
  };

  const handleSlider = (v: number[]) => {
    setText(toText(v[0]));
    emit(v[0]);
  };

  return (
    <div className="space-y-2">
      {headerRight ? (
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor={id}>{label}</Label>
          {headerRight}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}

      <div className="relative">
        {prefix && (
          <span className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm">
            {prefix}
          </span>
        )}
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          value={text}
          onChange={handleInputChange}
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
          onValueChange={handleSlider}
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
