/**
 * Formatting helpers for displaying money, percentages and ages.
 *
 * Kept out of the engine on purpose: the engine deals in raw numbers, and only
 * the UI cares about locale, currency symbols and rounding. Financial figures
 * are rendered with `tabular-nums` in the components so columns line up.
 */

/** "RM1,234,567" — whole Ringgit, grouped with commas, no decimals. */
export function formatCurrency(value: number, currency = "RM"): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${currency}${Math.round(safe).toLocaleString("en-US")}`;
}

/**
 * Compact money for tight spots like chart axes: "RM1.2M", "RM850k".
 */
export function formatCurrencyShort(value: number, currency = "RM"): string {
  const safe = Number.isFinite(value) ? value : 0;
  const abs = Math.abs(safe);
  if (abs >= 1_000_000) return `${currency}${(safe / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${currency}${Math.round(safe / 1_000)}k`;
  return `${currency}${Math.round(safe)}`;
}

/** "3.9%" — one decimal place. */
export function formatPercent(value: number, decimals = 1): string {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe.toFixed(decimals)}%`;
}

/**
 * Ages can come back fractional from the engine (money runs out mid-year).
 * Show a clean whole age, e.g. 84.5 -> "84".
 */
export function formatAge(value: number): string {
  return `${Math.floor(value)}`;
}

/** "30 years", with correct singular/plural. */
export function formatYears(value: number): string {
  const rounded = Math.round(value);
  return `${rounded} ${rounded === 1 ? "year" : "years"}`;
}
