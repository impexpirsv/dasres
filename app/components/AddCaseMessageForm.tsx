"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AddCaseMessageForm({
  caseId,
}: {
  caseId: number;
}) {
  const router = useRouter();
  const t = useTranslations("tradeCases.addMessage");

  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitMessage(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    const trimmedContent = content.trim();

    setError("");

    if (!trimmedContent) {
      setError(t("errors.contentRequired"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/cases/${caseId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: trimmedContent,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || t("errors.submitFailed"));
        return;
      }

      setContent("");
      router.refresh();
    } catch {
      setError(t("errors.submitFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submitMessage} className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        disabled={loading}
        placeholder={t("placeholder")}
        aria-label={t("contentLabel")}
        className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("sending") : t("submit")}
      </button>
    </form>
  );
}