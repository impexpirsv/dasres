"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function VerificationExpertActions({
  expertId,
}: {
  expertId: number;
}) {
  const router = useRouter();
  const t = useTranslations(
    "verificationExpertActions",
  );

  const [loading, setLoading] =
    useState(false);

  async function updateExpert(
    action: "verify" | "reject",
  ) {
    setLoading(true);

    try {
      await fetch(
        `/api/admin/experts/${expertId}/${action}`,
        {
          method: "PATCH",
        },
      );

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex gap-3">
      <button
        type="button"
        disabled={loading}
        onClick={() =>
          updateExpert("verify")
        }
        className="rounded-xl bg-green-600 px-4 py-2 text-sm hover:bg-green-700 disabled:opacity-50"
      >
        {t("verify")}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() =>
          updateExpert("reject")
        }
        className="rounded-xl bg-red-600 px-4 py-2 text-sm hover:bg-red-700 disabled:opacity-50"
      >
        {t("reject")}
      </button>
    </div>
  );
}