"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ReopenTicketButton({
  ticketId,
}: {
  ticketId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function reopenTicket() {
    setLoading(true);

    const response = await fetch(
      `/api/tickets/${ticketId}/reopen`,
      {
        method: "PATCH",
      }
    );

    setLoading(false);

    if (!response.ok) {
      alert("Failed to reopen ticket");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={reopenTicket}
      disabled={loading}
      className="rounded-xl bg-emerald-600 px-5 py-3 text-white hover:bg-emerald-700 disabled:opacity-50"
    >
      {loading ? "Reopening..." : "Reopen Ticket"}
    </button>
  );
}