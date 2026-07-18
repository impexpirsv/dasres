"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CompanyVerificationButtons({
  companyId,
}: {
  companyId: number;
}) {
  const router = useRouter();
  const t = useTranslations(
    "companyVerificationButtons",
  );

  const [loading, setLoading] =
    useState(false);

  async function updateVerification(
    action: "verify" | "reject",
  ) {
    setLoading(true);

    try {
      await fetch(
        `/api/admin/companies/${companyId}/${action}`,
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
        onClick={() =>
          updateVerification("verify")
        }
        disabled={loading}
        className="rounded-xl bg-emerald-600 px-4 py-2 hover:bg-emerald-500 disabled:opacity-50"
      >
        {t("verify")}
      </button>

      <button
        type="button"
        onClick={() =>
          updateVerification("reject")
        }
        disabled={loading}
        className="rounded-xl bg-red-600 px-4 py-2 hover:bg-red-500 disabled:opacity-50"
      >
        {t("reject")}
      </button>
    </div>
  );
}