"use client";

import { useState } from "react";

const PRIORITIES = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

export default function CreateProjectTaskForm({
  projectId,
}: {
  projectId: number;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [priority, setPriority] =
    useState("MEDIUM");
  const [loading, setLoading] =
    useState(false);

  async function createTask() {
    if (!title.trim()) {
      alert("Task title is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/projects/${projectId}/tasks`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            priority,
          }),
        },
      );

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

  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="mb-5 text-2xl font-bold">
        Add Task
      </h2>

      <div className="space-y-4">
        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Task title"
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
        />

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          placeholder="Description (optional)"
          rows={4}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
        />

        <select
          value={priority}
          onChange={(e) =>
            setPriority(e.target.value)
          }
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3"
        >
          {PRIORITIES.map((item) => (
            <option
              key={item}
              value={item}
            >
              {item}
            </option>
          ))}
        </select>

        <button
          onClick={createTask}
          disabled={loading}
          className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading
            ? "Creating..."
            : "Create Task"}
        </button>
      </div>
    </div>
  );
}