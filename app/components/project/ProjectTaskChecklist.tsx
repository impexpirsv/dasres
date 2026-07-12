"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import CreateChecklistItemForm from "./CreateChecklistItemForm";
import TaskProgressBar from "./TaskProgressBar";

type ChecklistItem = {
  id: number;
  title: string;
  completed: boolean;
};

export default function ProjectTaskChecklist({
  taskId,
  items,
}: {
  taskId: number;
  items: ChecklistItem[];
}) {
  const t = useTranslations("projectTaskChecklist");

  const [localItems, setLocalItems] =
    useState<ChecklistItem[]>(items);

  const [loadingId, setLoadingId] =
    useState<number | null>(null);

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  async function toggleItem(itemId: number) {
    const currentItem = localItems.find(
      (item) => item.id === itemId,
    );

    if (!currentItem) {
      return;
    }

    const previousCompleted = currentItem.completed;

    setLoadingId(itemId);

    setLocalItems((currentItems) =>
      currentItems.map((item) =>
        item.id === itemId
          ? {
              ...item,
              completed: !item.completed,
            }
          : item,
      ),
    );

    try {
      const response = await fetch(
        `/api/project-task-checklist/${itemId}/toggle`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setLocalItems((currentItems) =>
          currentItems.map((item) =>
            item.id === itemId
              ? {
                  ...item,
                  completed: previousCompleted,
                }
              : item,
          ),
        );

        alert(data.message || t("toggleError"));
      }
    } catch {
      setLocalItems((currentItems) =>
        currentItems.map((item) =>
          item.id === itemId
            ? {
                ...item,
                completed: previousCompleted,
              }
            : item,
        ),
      );

      alert(t("networkError"));
    } finally {
      setLoadingId(null);
    }
  }

  function handleCreated(item: ChecklistItem) {
    setLocalItems((currentItems) => {
      const alreadyExists = currentItems.some(
        (currentItem) => currentItem.id === item.id,
      );

      return alreadyExists
        ? currentItems
        : [...currentItems, item];
    });
  }

  return (
    <>
      <TaskProgressBar items={localItems} />

      <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
        <h3 className="mb-3 text-sm font-semibold text-white">
          {t("title")}
        </h3>

        {localItems.length === 0 ? (
          <p className="mb-3 text-sm text-slate-500">
            {t("empty")}
          </p>
        ) : (
          <div className="mb-4 space-y-2">
            {localItems.map((item) => {
              const isLoading = loadingId === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleItem(item.id)}
                  disabled={isLoading}
                  aria-pressed={item.completed}
                  aria-label={
                    item.completed
                      ? t("markIncomplete", {
                          title: item.title,
                        })
                      : t("markComplete", {
                          title: item.title,
                        })
                  }
                  className="flex w-full items-center gap-3 rounded-lg border border-slate-800 px-3 py-2 text-start transition hover:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <input
                    type="checkbox"
                    checked={item.completed}
                    readOnly
                    tabIndex={-1}
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0"
                  />

                  <span
                    className={`min-w-0 break-words text-sm ${
                      item.completed
                        ? "line-through text-slate-500"
                        : "text-slate-200"
                    }`}
                  >
                    {item.title}
                  </span>

                  {isLoading && (
                    <span className="ms-auto shrink-0 text-xs text-slate-500">
                      {t("updating")}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <CreateChecklistItemForm
          taskId={taskId}
          onCreated={handleCreated}
        />
      </div>
    </>
  );
}