"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Modal from "../ui/Modal";

const PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

type Priority = (typeof PRIORITIES)[number];

export default function CreateProjectTaskForm({
  projectId,
}: {
  projectId: number;
}) {
  const t = useTranslations("createProjectTaskForm");
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] =
    useState<Priority>("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  function resetForm() {
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setStartDate("");
    setDueDate("");
  }

  function closeModal() {
    if (loading) {
      return;
    }

    setOpen(false);
    resetForm();
  }

  async function createTask() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      alert(t("titleRequired"));
      return;
    }

    if (
      startDate &&
      dueDate &&
      new Date(dueDate).getTime() <
        new Date(startDate).getTime()
    ) {
      alert(t("invalidDateRange"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
            description: description.trim() || null,
            priority,
            startDate: startDate || null,
            dueDate: dueDate || null,
          }),
        },
      );

      let data: Record<string, unknown> & { message?: string } = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      if (!response.ok) {
        alert(data.message || t("createError"));
        return;
      }

      setOpen(false);
      resetForm();
      router.refresh();
    } catch {
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
      >
        {t("newTask")}
      </button>

      <Modal
        open={open}
        onClose={closeModal}
        title={t("modalTitle")}
      >
        <div className="space-y-4">
          <div>
            <label
              htmlFor={`new-task-title-${projectId}`}
              className="mb-1 block text-sm font-medium text-slate-300"
            >
              {t("taskTitle")}
            </label>

            <input
              id={`new-task-title-${projectId}`}
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(event.target.value)
              }
              disabled={loading}
              placeholder={t("taskTitlePlaceholder")}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor={`new-task-description-${projectId}`}
              className="mb-1 block text-sm font-medium text-slate-300"
            >
              {t("description")}
            </label>

            <textarea
              id={`new-task-description-${projectId}`}
              value={description}
              onChange={(event) =>
                setDescription(event.target.value)
              }
              disabled={loading}
              placeholder={t("descriptionPlaceholder")}
              rows={4}
              className="w-full resize-y rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <div>
            <label
              htmlFor={`new-task-priority-${projectId}`}
              className="mb-1 block text-sm font-medium text-slate-300"
            >
              {t("priority")}
            </label>

            <select
              id={`new-task-priority-${projectId}`}
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value as Priority,
                )
              }
              disabled={loading}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor={`new-task-start-date-${projectId}`}
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                {t("startDate")}
              </label>

              <input
                id={`new-task-start-date-${projectId}`}
                type="date"
                value={startDate}
                onChange={(event) =>
                  setStartDate(event.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div>
              <label
                htmlFor={`new-task-due-date-${projectId}`}
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                {t("dueDate")}
              </label>

              <input
                id={`new-task-due-date-${projectId}`}
                type="date"
                value={dueDate}
                min={startDate || undefined}
                onChange={(event) =>
                  setDueDate(event.target.value)
                }
                disabled={loading}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={closeModal}
              disabled={loading}
              className="rounded-xl bg-slate-800 px-5 py-3 font-semibold text-slate-300 transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t("cancel")}
            </button>

            <button
              type="button"
              onClick={() => void createTask()}
              disabled={loading || !title.trim()}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading
                ? t("creating")
                : t("createTask")}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}