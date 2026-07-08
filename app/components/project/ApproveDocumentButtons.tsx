"use client";

import { useTransition } from "react";

export default function ApproveDocumentButtons({
  documentId,
  onStatusChange,
}: {
  documentId: number;
  onStatusChange: (documentId: number, status: "APPROVED" | "REJECTED") => void;
}) {
  const [loading, startTransition] = useTransition();

  function updateDocument(action: "approve" | "reject") {
    startTransition(async () => {
      const response = await fetch(
        `/api/project-documents/${documentId}/${action}`,
        {
          method: "PATCH",
        },
      );

      if (!response.ok) {
        alert("Failed to update document.");
        return;
      }

      onStatusChange(
        documentId,
        action === "approve" ? "APPROVED" : "REJECTED",
      );
    });
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => updateDocument("approve")}
        disabled={loading}
        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
      >
        ✓ Approve
      </button>

      <button
        type="button"
        onClick={() => updateDocument("reject")}
        disabled={loading}
        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        ✕ Reject
      </button>
    </div>
  );
}