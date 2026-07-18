"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ExpertReviewForm({
  expertId,
}: {
  expertId: number;
}) {
  const router = useRouter();
  const t = useTranslations("expertReviews.form");

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

      const response = await fetch(
        `/api/experts/${expertId}/reviews`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            rating: Number(rating),
            comment: comment.trim(),
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || t("errors.submitFailed"));
        return;
      }

      setComment("");
      setRating("5");
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
      className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6"
    >
      <h2 className="mb-4 text-2xl font-bold">
        {t("title")}
      </h2>

      {error && (
        <div className="mb-4 rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <select
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        disabled={loading}
        aria-label={t("ratingLabel")}
        className="mb-4 w-full rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
        placeholder={t("placeholder")}
        aria-label={t("commentLabel")}
        disabled={loading}
        className="mb-4 min-h-32 w-full resize-y rounded-xl border border-slate-700 bg-slate-950 p-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}