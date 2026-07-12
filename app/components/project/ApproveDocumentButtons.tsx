"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type DocumentStatus = "APPROVED" | "REJECTED";
type DocumentAction = "approve" | "reject";

export default function ApproveDocumentButtons({
  documentId,
  onStatusChange,
}: {
  documentId: number;
  onStatusChange: (
    documentId: number,
    status: DocumentStatus,
  ) => void;
}) {
  const t = useTranslations("approveDocumentButtons");

  const [loadingAction, setLoadingAction] =
    useState<DocumentAction | null>(null);

  async function updateDocument(
    action: DocumentAction,
  ) {
    try {
      setLoadingAction(action);

      const response = await fetch(
        `/api/project-documents/${documentId}/${action}`,
        {
          method: "PATCH",
        },
      );

      let data: {
        message?: string;
      } = {};

      try {
        data = await response.json();
      } catch {
        // API may return an empty or non-JSON response.
      }

      if (!response.ok) {
        alert(data.message || t("updateError"));
        return;
      }

      onStatusChange(
        documentId,
        action === "approve"
          ? "APPROVED"
          : "REJECTED",
      );
    } catch {
      alert(t("networkError"));
    } finally {
      setLoadingAction(null);
    }
  }

  const loading = loadingAction !== null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          void updateDocument("approve")
        }
        disabled={loading}
        aria-busy={loadingAction === "approve"}
        className="rounded-lg bg-green-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingAction === "approve"
          ? t("approving")
          : t("approve")}
      </button>

      <button
        type="button"
        onClick={() =>
          void updateDocument("reject")
        }
        disabled={loading}
        aria-busy={loadingAction === "reject"}
        className="rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loadingAction === "reject"
          ? t("rejecting")
          : t("reject")}
      </button>
    </div>
  );
}