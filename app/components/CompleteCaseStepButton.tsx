"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CompleteCaseStepButton({
  stepId,
}: {
  stepId: number;
}) {
  const router = useRouter();
  const t = useTranslations("tradeCases.completeStep");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function completeStep() {
    try {
      setError("");
      setLoading(true);

      const response = await fetch(
        `/api/cases/steps/${stepId}/complete`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || t("errors.completeFailed"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("errors.completeFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={completeStep}
        disabled={loading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("completing") : t("complete")}
      </button>
    </div>
  );
}