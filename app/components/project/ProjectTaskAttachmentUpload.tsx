"use client";

import { useState } from "react";

export default function ProjectTaskAttachmentUpload({
  taskId,
}: {
  taskId: number;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  async function uploadFile() {
    if (!file) {
      alert("Please select a file.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(
        `/api/project-tasks/${taskId}/attachments`,
        {
          method: "POST",
          body: formData,
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
    <div className="mt-4 rounded-2xl border border-slate-800 bg-slate-900 p-4">
      <p className="mb-3 text-sm font-semibold text-slate-300">
        Attach file
      </p>

      <input
        type="file"
        onChange={(event) => setFile(event.target.files?.[0] || null)}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
      />

      <button
        onClick={uploadFile}
        disabled={loading}
        className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload"}
      </button>
    </div>
  );
}