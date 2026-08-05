"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type SaveCaseResponse = {
  saved?: unknown;
  message?: unknown;
};

export default function SaveCaseButton({
  caseId,
  initialSaved,
}: {
  caseId: number;
  initialSaved: boolean;
}) {
  const t = useTranslations("saveCaseButton");
  const router = useRouter();

  const [saved, setSaved] = useState(initialSaved);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSaved(initialSaved);
  }, [initialSaved]);

  async function toggleSave() {
    if (loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `/api/cases/${caseId}/save`,
        {
          method: "POST",
        },
      );

      let data: SaveCaseResponse = {};

      try {
        data = (await response.json()) as SaveCaseResponse;
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Unable to update saved case.",
        );
        return;
      }

      if (typeof data.saved !== "boolean") {
        setError("Invalid response from server.");
        return;
      }

      setSaved(data.saved);
      router.refresh();
    } catch {
      setError("Unable to update saved case.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void toggleSave()}
        disabled={loading}
        aria-busy={loading}
        className={`rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
          saved
            ? "bg-yellow-600 text-black hover:bg-yellow-700"
            : "bg-slate-800 text-slate-200 hover:bg-slate-700"
        }`}
      >
        {loading
          ? t("saving")
          : saved
            ? t("unsave")
            : t("save")}
      </button>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
