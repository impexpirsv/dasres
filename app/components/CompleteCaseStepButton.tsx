"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompleteCaseStepButton({
  stepId,
}: {
  stepId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function completeStep() {
    setLoading(true);

    await fetch(
      `/api/cases/steps/${stepId}/complete`,
      {
        method: "PATCH",
      }
    );

    router.refresh();
    setLoading(false);
  }

  return (
    <button
      onClick={completeStep}
      disabled={loading}
      className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl text-sm disabled:opacity-50"
    >
      Complete
    </button>
  );
}