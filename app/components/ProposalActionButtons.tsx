"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function ProposalActionButtons({
  proposalId,
}: {
  proposalId: number;
}) {
  const router = useRouter();
  const t = useTranslations("tradeCases.proposalActions");

  const [loadingAction, setLoadingAction] = useState<
    "accept" | "reject" | null
  >(null);
  const [error, setError] = useState("");

  async function updateProposal(action: "accept" | "reject") {
    try {
      setError("");
      setLoadingAction(action);

      const response = await fetch(
        `/api/cases/proposals/${proposalId}/${action}`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message ||
            (action === "accept"
              ? t("errors.acceptFailed")
              : t("errors.rejectFailed")),
        );
        return;
      }

      router.refresh();
    } catch {
      setError(
        action === "accept"
          ? t("errors.acceptFailed")
          : t("errors.rejectFailed"),
      );
    } finally {
      setLoadingAction(null);
    }
  }

  const loading = loadingAction !== null;

  return (
    <div className="mt-4 space-y-3">
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => updateProposal("accept")}
          disabled={loading}
          className="flex-1 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAction === "accept"
            ? t("accepting")
            : t("accept")}
        </button>

        <button
          type="button"
          onClick={() => updateProposal("reject")}
          disabled={loading}
          className="flex-1 rounded-xl bg-red-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loadingAction === "reject"
            ? t("rejecting")
            : t("reject")}
        </button>
      </div>
    </div>
  );
}