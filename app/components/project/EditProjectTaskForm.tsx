"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
const PRIORITIES = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;

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
  assignableUsers: {
    id: number;
    name: string | null;
    email: string;
  }[];
  currentDependsOnId?: number | null;

  availableTasks: {
    id: number;
    title: string;
  }[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription || "");
  const [priority, setPriority] = useState(currentPriority);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dependsOnId, setDependsOnId] = useState(
    currentDependsOnId ? String(currentDependsOnId) : "",
  );
  const [startDate, setStartDate] = useState(
    currentStartDate
      ? new Date(currentStartDate).toISOString().slice(0, 10)
      : "",
  );

  const [dueDate, setDueDate] = useState(
    currentDueDate ? new Date(currentDueDate).toISOString().slice(0, 10) : "",
  );

  const [assignedToId, setAssignedToId] = useState(
    currentAssignedToId ? String(currentAssignedToId) : "",
  );
  const [estimatedHours, setEstimatedHours] = useState(
    String(currentEstimatedHours ?? 0),
  );

  const [loggedHours, setLoggedHours] = useState(
    String(currentLoggedHours ?? 0),
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          startDate,
          dueDate,
          assignedToId,
          estimatedHours,
          loggedHours,
          dependsOnId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setEditing(false);
      router.refresh();
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

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Due Date
          </label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
        </div>
      </div>
      <input
        type="number"
        min={0}
        value={estimatedHours}
        onChange={(e) => setEstimatedHours(e.target.value)}
        placeholder="Estimated Hours"
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      />

      <input
        type="number"
        min={0}
        value={loggedHours}
        onChange={(e) => setLoggedHours(e.target.value)}
        placeholder="Logged Hours"
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      />
      <select
        value={assignedToId}
        onChange={(e) => setAssignedToId(e.target.value)}
        className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
      >
        <option value="">Unassigned</option>

        {assignableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name || user.email}
          </option>
        ))}
      </select>
      <div>
        <label className="mb-1 block text-xs font-medium text-slate-500">
          Depends On
        </label>

        <select
          value={dependsOnId}
          onChange={(e) => setDependsOnId(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
        >
          <option value="">No Dependency</option>

          {availableTasks
  .filter((item) => Number(item.id) !== Number(taskId))
  .map((item) => (
    <option key={item.id} value={item.id}>
      {item.title}
    </option>
  ))}
        </select>
      </div>
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
