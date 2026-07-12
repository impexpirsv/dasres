"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

export default function AssignTaskSelect({
  taskId,
  assignedToId,
  users,
}: {
  taskId: number;
  assignedToId: number | null;
  users: UserOption[];
}) {
  const t = useTranslations("assignTaskSelect");
  const router = useRouter();

  const initialValue = assignedToId ? String(assignedToId) : "";

  const [value, setValue] = useState(initialValue);
  const [loading, setLoading] = useState(false);

  async function updateAssignee(nextValue: string) {
    const previousValue = value;

    try {
      setValue(nextValue);
      setLoading(true);

      const response = await fetch(
        `/api/project-tasks/${taskId}/assign`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            assignedToId: nextValue ? Number(nextValue) : null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setValue(previousValue);
        alert(data.message || t("updateError"));
        return;
      }

      router.refresh();
    } catch {
      setValue(previousValue);
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <label
        htmlFor={`task-assignee-${taskId}`}
        className="sr-only"
      >
        {t("label")}
      </label>

      <select
        id={`task-assignee-${taskId}`}
        value={value}
        onChange={(event) =>
          updateAssignee(event.target.value)
        }
        disabled={loading}
        aria-busy={loading}
        className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">
          {loading ? t("updating") : t("unassigned")}
        </option>

        {users.map((user) => (
          <option key={user.id} value={String(user.id)}>
            {user.name || user.email}
          </option>
        ))}
      </select>
    </div>
  );
}