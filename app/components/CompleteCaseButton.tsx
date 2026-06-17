"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompleteCaseButton({
  caseId,
}: {
  caseId: number;
}) {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function completeCase() {
    const confirmed = confirm(
      "Are you sure you want to mark this case as completed?"
    );

    if (!confirmed) return;

    setLoading(true);
    setError("");

    const response = await fetch(
      `/api/cases/${caseId}/complete`,
      {
        method: "PATCH",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      setError(data.message || "Failed to complete case.");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        onClick={completeCase}
        disabled={loading}
        className="w-full bg-emerald-600 hover:bg-emerald-700 px-4 py-3 rounded-xl font-semibold disabled:opacity-50"
      >
        {loading ? "Completing..." : "Mark As Completed"}
      </button>
    </div>
  );
}