"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const response = await fetch("/api/reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        caseId,
        reviewedUserId,
        rating,
        comment,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to submit review.");
      setLoading(false);
      return;
    }

    setComment("");
    setRating("5");

    router.refresh();
    setLoading(false);
  }

  return (
    <form
      onSubmit={submitReview}
      className="space-y-3 border border-slate-800 rounded-2xl p-4 bg-slate-950"
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
        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
      >
        <option value="5">5 - Excellent</option>
        <option value="4">4 - Good</option>
        <option value="3">3 - Average</option>
        <option value="2">2 - Poor</option>
        <option value="1">1 - Bad</option>
      </select>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder="Write your review..."
        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}