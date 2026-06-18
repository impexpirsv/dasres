"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddCaseDocumentForm({
  caseId,
}: {
  caseId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function uploadDocument(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");

    const form = e.currentTarget;
    const formData = new FormData(form);

    setLoading(true);

    const response = await fetch(
      `/api/cases/${caseId}/documents`,
      {
        method: "POST",
        body: formData,
      }
    );

    setLoading(false);

    if (!response.ok) {
      const data = await response.json();
      setError(data.message || "Failed to upload document");
      return;
    }

    form.reset();
    router.refresh();
  }

  return (
    <form onSubmit={uploadDocument} className="space-y-3">
      <input
        name="file"
        type="file"
        required
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
      />

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl disabled:opacity-50"
      >
        {loading ? "Uploading..." : "Upload Document"}
      </button>
    </form>
  );
}