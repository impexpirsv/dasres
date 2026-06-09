"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CompanyVerificationButtons({
  companyId,
}: {
  companyId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function updateVerification(action: "verify" | "reject") {
    setLoading(true);

    await fetch(`/api/admin/companies/${companyId}/${action}`, {
      method: "PATCH",
    });

    setLoading(false);
    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={() => updateVerification("verify")}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50"
      >
        Verify
      </button>

      <button
        onClick={() => updateVerification("reject")}
        disabled={loading}
        className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50"
      >
        Reject
      </button>
    </div>
  );
}