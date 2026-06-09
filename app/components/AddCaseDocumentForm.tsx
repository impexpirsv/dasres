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

  async function uploadDocument(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const form = e.currentTarget;
    const formData = new FormData(form);

    setLoading(true);

    await fetch(`/api/cases/${caseId}/documents`, {
      method: "POST",
      body: formData,
    });

    form.reset();
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={uploadDocument} className="space-y-3">
      <input
        name="file"
        type="file"
        required
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm"
      />

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