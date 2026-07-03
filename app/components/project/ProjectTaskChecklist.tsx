"use client";

import { useState } from "react";
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
  const [localItems, setLocalItems] = useState(items);
  const [loadingId, setLoadingId] = useState<number | null>(null);

  async function toggleItem(itemId: number) {
    try {
      setLoadingId(itemId);

      const response = await fetch(
        `/api/project-task-checklist/${itemId}/toggle`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

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
    } finally {
      setLoadingId(null);
    }
  }

  function handleCreated(item: ChecklistItem) {
    setLocalItems((currentItems) => [...currentItems, item]);
  }

 return (
  <>
    <TaskProgressBar items={localItems} />

    <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <h3 className="mb-3 text-sm font-semibold text-white">
        Checklist
      </h3>

      {localItems.length === 0 ? (
        <p className="mb-3 text-sm text-slate-500">
          No checklist items yet.
        </p>
      ) : (
        <div className="mb-4 space-y-2">
          {localItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => toggleItem(item.id)}
              disabled={loadingId === item.id}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-800 px-3 py-2 text-left hover:border-blue-500 disabled:opacity-50"
            >
              <input
                type="checkbox"
                checked={item.completed}
                readOnly
                className="h-4 w-4"
              />

              <span
                className={
                  item.completed
                    ? "line-through text-slate-500"
                    : "text-slate-200"
                }
              >
                {item.title}
              </span>
            </button>
          ))}
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