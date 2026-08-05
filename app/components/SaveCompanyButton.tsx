"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

type SaveResponse = {
  saved?: unknown;
  message?: unknown;
};

export default function SaveCompanyButton({
  companyId,
  initialSaved,
}: {
  companyId: number;
  initialSaved: boolean;
}) {
  const t = useTranslations("saveCompanyButton");

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
        `/api/companies/${companyId}/save`,
        {
          method: "POST",
        },
      );

      let data: SaveResponse = {};

      try {
        data = (await response.json()) as SaveResponse;
      } catch {
        data = {};
      }

      if (!response.ok) {
        setError(
          typeof data.message === "string"
            ? data.message
            : "Unable to update saved company.",
        );
        return;
      }

      if (typeof data.saved !== "boolean") {
        setError("Invalid response from server.");
        return;
      }

      setSaved(data.saved);
    } catch {
      setError("Unable to update saved company.");
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
        className={`rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${
          saved
            ? "bg-yellow-500 text-black"
            : "bg-slate-800 text-white"
        }`}
      >
        {saved ? t("saved") : t("save")}
      </button>

      {error && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
