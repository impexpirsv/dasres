"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useRouter } from "next/navigation";

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
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [loading, setLoading] = useState(false);

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
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            priority,
            startDate: startDate || null,
            dueDate: dueDate || null,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      setOpen(false);
      setTitle("");
      setDescription("");
      setPriority("MEDIUM");
      setStartDate("");
      setDueDate("");

      router.refresh();
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
        + New Task
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create Task"
      >
        <div className="space-y-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title"
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
          />

          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={4}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
          />

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
          >
            {PRIORITIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-white"
              />
            </div>
          </div>

          <button
            onClick={createTask}
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Task"}
          </button>
        </div>
      </Modal>
    </>
  );
}