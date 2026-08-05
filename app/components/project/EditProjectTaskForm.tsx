"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

const PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

type Priority = (typeof PRIORITIES)[number];

type UserOption = {
  id: number;
  name: string | null;
  email: string;
};

type AvailableTask = {
  id: number;
  title: string;
};

function formatDateForInput(
  value?: Date | string | null,
) {
  if (!value) {
    return "";
  }

  if (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return value;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function EditProjectTaskForm({
  taskId,
  currentTitle,
  currentDescription,
  currentPriority,
  currentStartDate,
  currentDueDate,
  currentAssignedToId,
  currentEstimatedHours,
  currentLoggedHours,
  assignableUsers,
  currentDependsOnId,
  availableTasks,
}: {
  taskId: number;
  currentTitle: string;
  currentDescription?: string | null;
  currentPriority: string;
  currentStartDate?: Date | string | null;
  currentDueDate?: Date | string | null;
  currentAssignedToId?: number | null;
  currentEstimatedHours?: number;
  currentLoggedHours?: number;
  assignableUsers: UserOption[];
  currentDependsOnId?: number | null;
  availableTasks: AvailableTask[];
}) {
  const t = useTranslations("editProjectTaskForm");
  const router = useRouter();

  const initialDescription = currentDescription ?? "";
  const initialPriority = PRIORITIES.includes(
    currentPriority as Priority,
  )
    ? (currentPriority as Priority)
    : "LOW";

  const initialStartDate =
    formatDateForInput(currentStartDate);

  const initialDueDate =
    formatDateForInput(currentDueDate);

  const initialAssignedToId = currentAssignedToId
    ? String(currentAssignedToId)
    : "";

  const initialEstimatedHours = String(
    currentEstimatedHours ?? 0,
  );

  const initialLoggedHours = String(
    currentLoggedHours ?? 0,
  );

  const initialDependsOnId = currentDependsOnId
    ? String(currentDependsOnId)
    : "";

  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(
    initialDescription,
  );
  const [priority, setPriority] =
    useState<Priority>(initialPriority);
  const [startDate, setStartDate] = useState(
    initialStartDate,
  );
  const [dueDate, setDueDate] = useState(initialDueDate);
  const [assignedToId, setAssignedToId] = useState(
    initialAssignedToId,
  );
  const [estimatedHours, setEstimatedHours] = useState(
    initialEstimatedHours,
  );
  const [loggedHours, setLoggedHours] = useState(
    initialLoggedHours,
  );
  const [dependsOnId, setDependsOnId] = useState(
    initialDependsOnId,
  );
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setTitle(currentTitle);
    setDescription(initialDescription);
    setPriority(initialPriority);
    setStartDate(initialStartDate);
    setDueDate(initialDueDate);
    setAssignedToId(initialAssignedToId);
    setEstimatedHours(initialEstimatedHours);
    setLoggedHours(initialLoggedHours);
    setDependsOnId(initialDependsOnId);
  }


  useEffect(() => {
    setTitle(currentTitle);
    setDescription(initialDescription);
    setPriority(initialPriority);
    setStartDate(initialStartDate);
    setDueDate(initialDueDate);
    setAssignedToId(initialAssignedToId);
    setEstimatedHours(initialEstimatedHours);
    setLoggedHours(initialLoggedHours);
    setDependsOnId(initialDependsOnId);
    setEditing(false);
  }, [
    taskId,
    currentTitle,
    initialDescription,
    initialPriority,
    initialStartDate,
    initialDueDate,
    initialAssignedToId,
    initialEstimatedHours,
    initialLoggedHours,
    initialDependsOnId,
  ]);

  function cancelEditing() {
    resetForm();
    setEditing(false);
  }

  async function updateTask() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      alert(t("titleRequired"));
      return;
    }

    const parsedEstimatedHours =
      estimatedHours.trim() === ""
        ? null
        : Number(estimatedHours);

    const parsedLoggedHours =
      loggedHours.trim() === ""
        ? 0
        : Number(loggedHours);

    if (
      parsedEstimatedHours !== null &&
      (!Number.isFinite(parsedEstimatedHours) ||
        parsedEstimatedHours < 0)
    ) {
      alert(t("invalidEstimatedHours"));
      return;
    }

    if (
      !Number.isFinite(parsedLoggedHours) ||
      parsedLoggedHours < 0
    ) {
      alert(t("invalidLoggedHours"));
      return;
    }

    if (
      startDate &&
      dueDate &&
      new Date(dueDate).getTime() <
        new Date(startDate).getTime()
    ) {
      alert(t.has("invalidDateRange") ? t("invalidDateRange") : t("updateError"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/project-tasks/${taskId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            description: description.trim() || null,
            priority,
            startDate: startDate || null,
            dueDate: dueDate || null,
            assignedToId: assignedToId
              ? Number(assignedToId)
              : null,
            estimatedHours: parsedEstimatedHours,
            loggedHours: parsedLoggedHours,
            dependsOnId: dependsOnId
              ? Number(dependsOnId)
              : null,
          }),
        },
      );

      let data: { message?: string } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        alert(data.message || t("updateError"));
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700"
      >
        {t("edit")}
      </button>
    );
  }

  return (
    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <h3 className="mb-4 text-sm font-semibold text-white">
        {t("title")}
      </h3>

      <div className="space-y-4">
        <div>
          <label
            htmlFor={`task-title-${taskId}`}
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            {t("taskTitle")}
          </label>

          <input
            id={`task-title-${taskId}`}
            type="text"
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor={`task-description-${taskId}`}
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            {t("description")}
          </label>

          <textarea
            id={`task-description-${taskId}`}
            value={description}
            onChange={(event) =>
              setDescription(event.target.value)
            }
            disabled={loading}
            rows={3}
            placeholder={t("descriptionPlaceholder")}
            className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label
            htmlFor={`task-priority-${taskId}`}
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            {t("priority")}
          </label>

          <select
            id={`task-priority-${taskId}`}
            value={priority}
            onChange={(event) =>
              setPriority(
                event.target.value as Priority,
              )
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            {PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {t(
                  `priorities.${item.toLowerCase()}`,
                )}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label
              htmlFor={`task-start-date-${taskId}`}
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              {t("startDate")}
            </label>

            <input
              id={`task-start-date-${taskId}`}
              type="date"
              value={startDate}
              onChange={(event) =>
                setStartDate(event.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor={`task-due-date-${taskId}`}
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              {t("dueDate")}
            </label>

            <input
              id={`task-due-date-${taskId}`}
              type="date"
              value={dueDate}
              min={startDate || undefined}
              onChange={(event) =>
                setDueDate(event.target.value)
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label
              htmlFor={`task-estimated-hours-${taskId}`}
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              {t("estimatedHours")}
            </label>

            <input
              id={`task-estimated-hours-${taskId}`}
              type="number"
              min={0}
              step="0.5"
              value={estimatedHours}
              onChange={(event) =>
                setEstimatedHours(event.target.value)
              }
              disabled={loading}
              placeholder={t(
                "estimatedHoursPlaceholder",
              )}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor={`task-logged-hours-${taskId}`}
              className="mb-1 block text-xs font-medium text-slate-500"
            >
              {t("loggedHours")}
            </label>

            <input
              id={`task-logged-hours-${taskId}`}
              type="number"
              min={0}
              step="0.5"
              value={loggedHours}
              onChange={(event) =>
                setLoggedHours(event.target.value)
              }
              disabled={loading}
              placeholder={t(
                "loggedHoursPlaceholder",
              )}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none disabled:opacity-50"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor={`task-assignee-edit-${taskId}`}
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            {t("assignedTo")}
          </label>

          <select
            id={`task-assignee-edit-${taskId}`}
            value={assignedToId}
            onChange={(event) =>
              setAssignedToId(event.target.value)
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">
              {t("unassigned")}
            </option>

            {assignableUsers.map((user) => (
              <option
                key={user.id}
                value={String(user.id)}
              >
                {user.name || user.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor={`task-dependency-${taskId}`}
            className="mb-1 block text-xs font-medium text-slate-500"
          >
            {t("dependsOn")}
          </label>

          <select
            id={`task-dependency-${taskId}`}
            value={dependsOnId}
            onChange={(event) =>
              setDependsOnId(event.target.value)
            }
            disabled={loading}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-blue-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">
              {t("noDependency")}
            </option>

            {availableTasks
              .filter(
                (item) =>
                  Number(item.id) !== Number(taskId),
              )
              .map((item) => (
                <option
                  key={item.id}
                  value={String(item.id)}
                >
                  {item.title}
                </option>
              ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={updateTask}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t("saving") : t("save")}
          </button>

          <button
            type="button"
            onClick={cancelEditing}
            disabled={loading}
            className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t("cancel")}
          </button>
        </div>
      </div>
    </div>
  );
}