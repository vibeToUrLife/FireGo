"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

/** Styled Radix Slider — keyboard-operable (arrow keys) and touch-friendly. */
export const Slider = React.forwardRef<
  React.ComponentRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none items-center py-2 select-none",
      className,
    )}
    {...props}
  >
    <SliderPrimitive.Track className="bg-muted relative h-1.5 w-full grow overflow-hidden rounded-full">
      <SliderPrimitive.Range className="bg-primary absolute h-full" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      aria-label="Adjust value"
      className="border-primary bg-surface block size-5 cursor-grab rounded-full border-2 shadow-sm transition-transform hover:scale-110 active:cursor-grabbing"
    />
  </SliderPrimitive.Root>
));
Slider.displayName = "Slider";
