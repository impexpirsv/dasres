"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AddCaseDocumentForm({
  caseId,
}: {
  caseId: number;
}) {
  const router = useRouter();
  const t = useTranslations("tradeCases.addDocument");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function uploadDocument(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);
    const file = formData.get("file");

    if (!(file instanceof File) || file.size === 0) {
      setError(t("errors.fileRequired"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/cases/${caseId}/documents`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || t("errors.uploadFailed"));
        return;
      }

      form.reset();
      router.refresh();
    } catch {
      setError(t("errors.uploadFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={uploadDocument} className="space-y-3">
      <input
        name="file"
        type="file"
        required
        disabled={loading}
        aria-label={t("fileLabel")}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-60"
      />

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("uploading") : t("submit")}
      </button>
    </form>
  );
}