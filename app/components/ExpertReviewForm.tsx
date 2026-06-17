"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ExpertReviewForm({
  expertId,
}: {
  expertId: number;
}) {
  const router = useRouter();
  const [rating, setRating] = useState("5");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/experts/${expertId}/reviews`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        rating: Number(rating),
        comment,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      alert(data.message || "Something went wrong");
      return;
    }

    setComment("");
    setRating("5");
    router.refresh();
  }

  return (
    <form
      onSubmit={submitReview}
      className="bg-slate-900 border border-slate-800 rounded-3xl p-6 mt-8"
    >
      <h2 className="text-2xl font-bold mb-4">Rate this expert</h2>

      <select
        value={rating}
        onChange={(e) => setRating(e.target.value)}
        className="w-full mb-4 p-3 rounded-xl bg-slate-950 border border-slate-700"
      >
        <option value="5">5 - Excellent</option>
        <option value="4">4 - Very Good</option>
        <option value="3">3 - Good</option>
        <option value="2">2 - Weak</option>
        <option value="1">1 - Poor</option>
      </select>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Write your review..."
        className="w-full mb-4 p-3 rounded-xl bg-slate-950 border border-slate-700 min-h-32"
      />

      <button
        disabled={loading}
        className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Review"}
      </button>
    </form>
  );
}