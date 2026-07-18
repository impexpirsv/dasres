"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function CloseTicketButton({
  ticketId,
}: {
  ticketId: number;
}) {
  const router = useRouter();
  const t = useTranslations("tickets.closeButton");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function closeTicket() {
    const confirmed = window.confirm(t("confirm"));

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setLoading(true);

      const response = await fetch(
        `/api/tickets/${ticketId}/close`,
        {
          method: "PATCH",
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || t("errors.closeFailed"));
        return;
      }

      router.refresh();
    } catch {
      setError(t("errors.closeFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={closeTicket}
        disabled={loading}
        className="rounded-xl bg-red-600 px-5 py-3 font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("closing") : t("close")}
      </button>
    </div>
  );
}