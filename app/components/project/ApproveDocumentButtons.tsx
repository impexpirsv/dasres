"use client";

import { useTransition } from "react";

export default function ApproveDocumentButtons({
  documentId,
}: {
  documentId: number;
}) {
  const [loading, startTransition] = useTransition();

  async function approve() {
    startTransition(async () => {
      await fetch(`/api/project-documents/${documentId}/approve`, {
        method: "PATCH",
      });

      location.reload();
    });
  }

  async function reject() {
    startTransition(async () => {
      await fetch(`/api/project-documents/${documentId}/reject`, {
        method: "PATCH",
      });

      location.reload();
    });
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={approve}
        disabled={loading}
        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700"
      >
        ✓ Approve
      </button>

      <button
        onClick={reject}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
      >
        ✕ Reject
      </button>
    </div>
  );
}