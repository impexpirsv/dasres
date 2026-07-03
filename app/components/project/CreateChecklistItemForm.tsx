"use client";

import { useState } from "react";

type CreatedChecklistItem = {
  id: number;
  title: string;
  completed: boolean;
};

export default function CreateChecklistItemForm({
  taskId,
  onCreated,
}: {
  taskId: number;
  onCreated: (item: CreatedChecklistItem) => void;
}) {
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function createItem() {
    if (!title.trim()) {
      alert("Checklist item title is required.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/project-tasks/${taskId}/checklist`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message);
        return;
      }

      onCreated(data.checklistItem);
      setTitle("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex gap-2">
      <input
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            createItem();
          }
        }}
        placeholder="Add checklist item..."
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
      />

      <button
        onClick={createItem}
        disabled={loading}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "..." : "Add"}
      </button>
    </div>
  );
}