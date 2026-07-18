"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function DeleteUserButton({
  id,
}: {
  id: number;
}) {
  const router = useRouter();
  const t = useTranslations("adminUsers.deleteUser");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
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
          method: "DELETE",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message || t("errors.deleteFailed"),
        );
        return;
      }

      router.refresh();
    } catch {
      setError(t("errors.deleteFailed"));
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
        onClick={handleDelete}
        disabled={loading}
        className="rounded bg-red-600 px-3 py-2 text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? t("deleting")
          : t("button")}
      </button>
    </div>
  );
}