import * as React from "react";
import { cn } from "@/lib/utils";

/** A plain styled text/number input. Forwards its ref so labels/forms work. */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "border-input bg-surface text-foreground flex h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors",
        "placeholder:text-muted-foreground",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "aria-[invalid=true]:border-negative aria-[invalid=true]:bg-negative-soft",
        className,
      )}
      {...props}
    />
  );
});
Input.displayName = "Input";
