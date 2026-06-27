"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Delete with a two-step inline confirm (no blocking native dialog). First click
 * reveals Delete / Cancel; confirming calls the API and refreshes the list.
 */
export function DeletePlanButton({ planId }: { planId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function remove() {
    setDeleting(true);
    const res = await fetch(`/api/plans/${planId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      router.refresh();
    } else {
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setConfirming(true)}
        aria-label="Delete plan"
      >
        <Trash2 />
      </Button>
    );
  }

  return (
    <span className="flex items-center gap-1">
      <Button
        variant="destructive"
        size="sm"
        onClick={remove}
        disabled={deleting}
      >
        {deleting && <Loader2 className="animate-spin" />}
        Delete
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
    </span>
  );
}
