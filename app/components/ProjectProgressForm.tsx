"use client";

import { useState } from "react";

export default function ProjectProgressForm({
  projectId,
  currentProgress,
}: {
  projectId: number;
  currentProgress: number;
}) {
  const [progress, setProgress] = useState(currentProgress);
  const [loading, setLoading] = useState(false);

  async function saveProgress() {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/projects/${projectId}/progress`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            progress,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      alert("Project progress updated.");
      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
      <h2 className="text-2xl font-bold mb-5">
        Update Progress
      </h2>

      <input
        type="range"
        min={0}
        max={100}
        value={progress}
        onChange={(e) =>
          setProgress(Number(e.target.value))
        }
        className="w-full"
      />

      <div className="flex items-center justify-between mt-4">
        <span className="text-slate-400">
          {progress}%
        </span>

        <button
          onClick={saveProgress}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 px-5 py-2 rounded-xl font-semibold"
        >
          {loading ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}