"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CompleteCaseButton({
  caseId,
}: {
  caseId: number;
}) {
  const router = useRouter();
  const t = useTranslations("tradeCases.completeCase");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function completeCase() {
    const confirmed = window.confirm(t("confirm"));

    if (!confirmed) return;

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/cases/${caseId}/complete`,
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
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={completeCase}
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("completing") : t("complete")}
      </button>
    </div>
  );
}