"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function DeleteOpportunityButton({
  id,
}: {
  id: number;
}) {
  const router = useRouter();
  const t = useTranslations("opportunities.deleteButton");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    const confirmed = window.confirm(t("confirm"));

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await fetch(
        `/api/opportunities/${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message || t("errors.deleteFailed"),
        );
        return;
      }

      router.push("/dashboard/opportunities");
      router.refresh();
    } catch {
      setError(t("errors.deleteFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleDelete}
        disabled={loading}
        className="rounded-lg bg-red-600 px-6 py-3 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? t("deleting")
          : t("button")}
      </button>
    </div>
  );
}