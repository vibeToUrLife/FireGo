"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "@/lib/utils";

/**
 * Radix Label — clicking it focuses the associated input (via htmlFor/id), which
 * is better for accessibility and touch than a bare <label>.
 */
export const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("text-foreground text-sm font-medium select-none", className)}
    {...props}
  />
));
Label.displayName = "Label";
