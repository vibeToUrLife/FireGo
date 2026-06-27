/**
 * `cn` — the standard shadcn/ui helper for composing Tailwind class names.
 *
 * `clsx` lets you pass conditional classes (strings, arrays, objects) and
 * `tailwind-merge` then resolves conflicts so the LAST utility wins
 * (e.g. cn("px-2", "px-4") -> "px-4" rather than both). Used throughout the UI.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
