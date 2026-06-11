"use client";

import { useRouter } from "next/navigation";

export default function VerificationCompanyActions({
  companyId,
}: {
  companyId: number;
}) {
  const router = useRouter();

  async function verifyCompany() {
    await fetch(`/api/companies/${companyId}/verify`, {
      method: "PATCH",
    });

    router.refresh();
  }

  async function rejectCompany() {
    await fetch(`/api/companies/${companyId}/reject`, {
      method: "PATCH",
    });

    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={verifyCompany}
        className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-sm font-semibold"
      >
        Verify
      </button>

      <button
        onClick={rejectCompany}
        className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-sm font-semibold"
      >
        Reject
      </button>
    </div>
  );
}