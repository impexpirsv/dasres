"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AddReviewForm({
  caseId,
  reviewedUserId,
  label,
}: {
  caseId: number;
  reviewedUserId: number;
  label: string;
}) {
  const router = useRouter();
  const t = useTranslations("tradeCases.addReview");

  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitReview(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          caseId,
          reviewedUserId,
          rating,
          comment: comment.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || t("errors.submitFailed"));
        return;
      }

      setRating("5");
      setComment("");

      router.refresh();
    } catch {
      setError(t("errors.submitFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submitReview}
      className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950 p-4"
    >
      <h3 className="font-bold">
        {label}
      </h3>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <select
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        disabled={loading}
        aria-label={t("ratingLabel")}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="5">{t("ratings.5")}</option>
        <option value="4">{t("ratings.4")}</option>
        <option value="3">{t("ratings.3")}</option>
        <option value="2">{t("ratings.2")}</option>
        <option value="1">{t("ratings.1")}</option>
      </select>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        disabled={loading}
        placeholder={t("placeholder")}
        aria-label={t("commentLabel")}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}