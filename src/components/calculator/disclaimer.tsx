"use client";

import { Card } from "@/components/ui/card";
import { Info } from "lucide-react";
import { useDict } from "@/lib/i18n/provider";

/** Calm, honest caveats — visible but not alarming. */
export function Disclaimer() {
  const t = useDict();
  return (
    <Card className="bg-muted/40 p-5">
      <div className="flex gap-3">
        <Info className="text-muted-foreground mt-0.5 size-4 shrink-0" />
        <div className="text-muted-foreground space-y-2 text-sm">
          <p className="text-foreground font-medium">{t.disclaimer.heading}</p>
          <p>{t.disclaimer.p1}</p>
          <p>{t.disclaimer.p2}</p>
        </div>
      </div>
    </Card>
  );
}
