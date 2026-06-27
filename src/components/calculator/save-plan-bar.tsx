"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RetirementInputs } from "@/lib/retirement.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, Link2, Save, Loader2 } from "lucide-react";

export interface SavePlanBarProps {
  inputs: RetirementInputs;
  isAuthed: boolean;
  /** Present when editing an already-saved plan (switches Save -> Update). */
  planId?: string;
  initialName?: string;
}

/**
 * The "do something with this scenario" bar:
 *   - Anyone can copy a share link (the scenario lives in the URL).
 *   - Signed-in users can name and save/update the plan to their dashboard.
 *   - Signed-out users get a sign-in prompt that returns them here afterwards.
 */
export function SavePlanBar({
  inputs,
  isAuthed,
  planId,
  initialName,
}: SavePlanBarProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(
        "Couldn't copy the link — copy it from the address bar instead.",
      );
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(planId ? `/api/plans/${planId}` : "/api/plans", {
        method: planId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim() || "My retirement plan",
          inputs,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Couldn't save. Please try again.");
        return;
      }
      setSaved(true);
      if (!planId && data?.plan?.id) {
        router.push(`/dashboard/plans/${data.plan.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError("Network problem — please try again.");
    } finally {
      setSaving(false);
    }
  }

  function goSignIn() {
    const next = `${window.location.pathname}${window.location.search}`;
    router.push(`/login?next=${encodeURIComponent(next)}`);
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <p className="text-foreground font-medium">
            {planId ? "Update this plan" : "Save this scenario"}
          </p>
          <p className="text-muted-foreground">
            {isAuthed
              ? "Keep it in your dashboard to revisit later."
              : "Sign in to keep your scenarios — your numbers come with you."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={copyLink}>
            {copied ? <Check /> : <Link2 />}
            {copied ? "Copied" : "Copy link"}
          </Button>

          {isAuthed ? (
            <>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Plan name"
                aria-label="Plan name"
                className="h-9 w-40"
              />
              <Button size="sm" onClick={save} disabled={saving}>
                {saving ? (
                  <Loader2 className="animate-spin" />
                ) : saved ? (
                  <Check />
                ) : (
                  <Save />
                )}
                {planId ? "Update" : "Save plan"}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={goSignIn}>
              Sign in to save
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-negative mt-2 text-xs">{error}</p>}
      {saved && !error && (
        <p className="text-positive mt-2 text-xs">Saved to your dashboard.</p>
      )}
    </Card>
  );
}
