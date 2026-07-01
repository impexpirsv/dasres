"use client";

import { useState } from "react";

const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
] as const;

export default function ProjectTaskStatusSelect({
  taskId,
  currentStatus,
}: {
  taskId: number;
  currentStatus: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function updateStatus(nextStatus: string) {
    try {
      setLoading(true);
      setStatus(nextStatus);

      const response = await fetch(`/api/project-tasks/${taskId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: nextStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        setStatus(currentStatus);
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <select
      value={status}
      disabled={loading}
      onChange={(event) => updateStatus(event.target.value)}
      className="mt-3 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white disabled:opacity-50"
    >
      {TASK_STATUSES.map((item) => (
        <option key={item} value={item}>
          {item.replace("_", " ")}
        </option>
      ))}
    </select>
  );
}