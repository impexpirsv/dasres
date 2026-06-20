"use client";

import { useRouter } from "next/navigation";

export default function VerificationExpertActions({
  expertId,
}: {
  expertId: number;
}) {
  const router = useRouter();

  async function verifyExpert() {
    await fetch(`/api/admin/experts/${expertId}/verify`, {
      method: "PATCH",
    });

    router.refresh();
  }

  async function rejectExpert() {
    await fetch(`/api/admin/experts/${expertId}/reject`, {
      method: "PATCH",
    });

    router.refresh();
  }

  return (
    <div className="flex gap-3">
      <button
        onClick={verifyExpert}
        className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-xl text-sm"
      >
        Verify
      </button>

      <button
        onClick={rejectExpert}
        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-xl text-sm"
      >
        Reject
      </button>
    </div>
  );
}