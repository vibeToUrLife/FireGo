"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { RetirementInputs } from "@/lib/retirement.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Check, Link2, Save, Loader2 } from "lucide-react";
import { useDict } from "@/lib/i18n/provider";

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
  const t = useDict();
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
      setError(t.savePlan.copyError);
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
          name: name.trim() || t.savePlan.defaultName,
          inputs,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? t.savePlan.saveError);
        return;
      }
      setSaved(true);
      if (!planId && data?.plan?.id) {
        router.push(`/dashboard/plans/${data.plan.id}`);
      } else {
        router.refresh();
      }
    } catch {
      setError(t.savePlan.networkError);
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
            {planId ? t.savePlan.headingUpdate : t.savePlan.headingSave}
          </p>
          <p className="text-muted-foreground">
            {isAuthed ? t.savePlan.subAuthed : t.savePlan.subUnauthed}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="secondary" size="sm" onClick={copyLink}>
            {copied ? <Check /> : <Link2 />}
            {copied ? t.savePlan.copied : t.savePlan.copyLink}
          </Button>

          {isAuthed ? (
            <>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.savePlan.planNamePlaceholder}
                aria-label={t.savePlan.planNamePlaceholder}
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
                {planId ? t.savePlan.update : t.savePlan.savePlanBtn}
              </Button>
            </>
          ) : (
            <Button size="sm" onClick={goSignIn}>
              {t.savePlan.signInToSave}
            </Button>
          )}
        </div>
      </div>

      {error && <p className="text-negative mt-2 text-xs">{error}</p>}
      {saved && !error && (
        <p className="text-positive mt-2 text-xs">{t.savePlan.saved}</p>
      )}
    </Card>
  );
}
