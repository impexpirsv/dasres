"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProposalActionButtons({
  proposalId,
}: {
  proposalId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateProposal(action: "accept" | "reject") {
    setLoading(true);

    await fetch(`/api/cases/proposals/${proposalId}/${action}`, {
      method: "PATCH",
    });

    router.refresh();
    setLoading(false);
  }

  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={() => updateProposal("accept")}
        disabled={loading}
        className="flex-1 bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-xl text-sm disabled:opacity-50"
      >
        Accept
      </button>

      <button
        onClick={() => updateProposal("reject")}
        disabled={loading}
        className="flex-1 bg-red-600 hover:bg-red-700 px-3 py-2 rounded-xl text-sm disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}