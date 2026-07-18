"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function MakeAdminButton({
  id,
}: {
  id: number;
}) {
  const router = useRouter();
  const t = useTranslations("adminUsers.makeAdmin");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function makeAdmin() {
    const confirmed = window.confirm(t("confirm"));

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await fetch(
        `/api/users/${id}`,
        {
          method: "PUT",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message || t("errors.makeAdminFailed"),
        );
        return;
      }

      router.refresh();
    } catch {
      setError(t("errors.makeAdminFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-xs text-red-400">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={makeAdmin}
        disabled={loading}
        className="rounded bg-green-600 px-3 py-2 text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? t("making")
          : t("button")}
      </button>
    </div>
  );
}