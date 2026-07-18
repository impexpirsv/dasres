"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function VerificationCompanyActions({
  companyId,
}: {
  companyId: number;
}) {
  const router = useRouter();
  const t = useTranslations(
    "verificationCompanyActions",
  );

  const [loading, setLoading] =
    useState(false);

  async function updateCompany(
    action: "verify" | "reject",
  ) {
    setLoading(true);

    try {
      await fetch(
        `/api/companies/${companyId}/${action}`,
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
    <div className="flex gap-2">
      <button
        type="button"
        disabled={loading}
        onClick={() =>
          updateCompany("verify")
        }
        className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
      >
        {t("verify")}
      </button>

      <button
        type="button"
        disabled={loading}
        onClick={() =>
          updateCompany("reject")
        }
        className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
      >
        {t("reject")}
      </button>
    </div>
  );
}