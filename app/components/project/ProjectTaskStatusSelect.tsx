"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const TASK_STATUSES = [
  "TODO",
  "IN_PROGRESS",
  "REVIEW",
  "COMPLETED",
] as const;

type TaskStatus = (typeof TASK_STATUSES)[number];

export default function ProjectTaskStatusSelect({
  taskId,
  currentStatus,
}: {
  taskId: number;
  currentStatus: string;
}) {
  const t = useTranslations("projectTaskStatusSelect");
  const router = useRouter();

  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);

  async function updateStatus(nextStatus: TaskStatus) {
    const previousStatus = status;

    try {
      setLoading(true);
      setStatus(nextStatus);

      const response = await fetch(
        `/api/project-tasks/${taskId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: nextStatus,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setStatus(previousStatus);
        alert(data.message || t("updateError"));
        return;
      }

      router.refresh();
    } catch {
      setStatus(previousStatus);
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label
        htmlFor={`task-status-${taskId}`}
        className="mb-1 block text-xs font-medium text-slate-500"
      >
        {t("label")}
      </label>

      <select
        id={`task-status-${taskId}`}
        value={status}
        disabled={loading}
        aria-busy={loading}
        onChange={(event) =>
          updateStatus(event.target.value as TaskStatus)
        }
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        {TASK_STATUSES.map((item) => (
          <option key={item} value={item}>
            {t(`statuses.${item.toLowerCase()}`)}
          </option>
        ))}
      </select>

      {loading && (
        <p className="mt-2 text-xs text-slate-500">
          {t("updating")}
        </p>
      )}
    </div>
  );
}