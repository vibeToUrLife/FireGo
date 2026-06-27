import { cn } from "@/lib/utils";

/**
 * The FireGo wordmark + mark. The mark is a small upward "growth" line inside a
 * rounded square — calm and finance-y, no flames or gold. Pure SVG, no emoji.
 */
export function Brand({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <span
        aria-hidden="true"
        className="bg-primary text-primary-foreground grid size-7 place-items-center rounded-lg"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M2 11.5 6 7l3 3 5-6" />
          <path d="M14 4v3.5M14 4h-3.5" />
        </svg>
      </span>
      {showWordmark && (
        <span className="text-foreground text-lg font-semibold tracking-tight">
          Fire<span className="text-primary">Go</span>
        </span>
      )}
    </span>
  );
}
