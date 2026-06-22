"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SaveCaseButton({
  caseId,
  initialSaved,
}: {
  caseId: number;
  initialSaved: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function toggleSave() {
    setLoading(true);

    await fetch(`/api/cases/${caseId}/save`, {
      method: "POST",
    });

    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
        initialSaved
          ? "bg-yellow-600 text-black hover:bg-yellow-700"
          : "bg-slate-800 text-slate-200 hover:bg-slate-700"
      }`}
    >
      {loading
        ? "Saving..."
        : initialSaved
          ? "Unsave"
          
          : "☆ Save Case"}
    </button>
  );
}