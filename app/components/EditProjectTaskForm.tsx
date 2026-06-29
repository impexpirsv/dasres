"use client";

import { useState } from "react";

const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

export default function EditProjectTaskForm({
  taskId,
  currentTitle,
  currentDescription,
  currentPriority,
  currentDueDate,
}: {
  taskId: number;
  currentTitle: string;
  currentDescription?: string | null;
  currentPriority: string;
  currentDueDate?: Date | string | null;
}) {
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription || "");
  const [priority, setPriority] = useState(currentPriority);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dueDate, setDueDate] = useState(
    currentDueDate ? new Date(currentDueDate).toISOString().slice(0, 10) : "",
  );
  async function updateTask() {
    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/project-tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority, dueDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="mt-3 rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700"
      >
        Edit
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      />

      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={3}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      />

      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      >
        {PRIORITIES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      />
      <div className="flex gap-2">
        <button
          onClick={updateTask}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save"}
        </button>

        <button
          onClick={() => setEditing(false)}
          className="rounded-xl bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
