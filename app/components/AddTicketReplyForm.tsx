"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddTicketReplyForm({
  ticketId,
}: {
  ticketId: number;
}) {
  const router = useRouter();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitReply(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!message.trim()) {
      return;
    }

    setLoading(true);

    const response = await fetch(
      `/api/tickets/${ticketId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
        }),
      }
    );

    setLoading(false);

    if (!response.ok) {
      alert("Failed to send reply");
      return;
    }

    setMessage("");
    router.refresh();
  }

  return (
    <form
      onSubmit={submitReply}
      className="mt-6 space-y-3"
    >
      <textarea
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
        placeholder="Write a reply..."
        rows={4}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-blue-600 px-6 py-3 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Sending..." : "Send Reply"}
      </button>
    </form>
  );
}