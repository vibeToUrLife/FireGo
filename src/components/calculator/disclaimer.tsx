import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";

/** Calm, honest caveats — visible but not alarming. */
export function Disclaimer() {
  return (
    <Card className="bg-muted/40 p-5">
      <div className="flex gap-3">
        <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div className="text-muted-foreground space-y-2 text-sm">
          <p className="text-foreground font-medium">A few honest caveats</p>
          <p>
            These are projections, not predictions. Real returns swing from year
            to year, and a run of bad years early in retirement
            (sequence-of-returns risk) can hurt more than the long-run average
            suggests.
          </p>
          <p>
            Everything is shown in today&apos;s money so the figures stay
            intuitive. Inflation, taxes, and life rarely move in a straight line
            — treat this as a starting point and revisit it as things change.
          </p>
        </div>
      </div>
    </Card>
  );
}
