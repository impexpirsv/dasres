"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CloseTicketButton({
  ticketId,
}: {
  ticketId: number;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function closeTicket() {
    if (
      !confirm(
        "Are you sure you want to close this ticket?"
      )
    ) {
      return;
    }

    setLoading(true);

    const response = await fetch(
      `/api/tickets/${ticketId}/close`,
      {
        method: "PATCH",
      }
    );

    setLoading(false);

    if (!response.ok) {
      alert("Failed to close ticket");
      return;
    }

    router.refresh();
  }

  return (
    <button
      onClick={closeTicket}
      disabled={loading}
      className="rounded-xl bg-red-600 px-5 py-3 text-white hover:bg-red-700 disabled:opacity-50"
    >
      {loading
        ? "Closing..."
        : "Close Ticket"}
    </button>
  );
}