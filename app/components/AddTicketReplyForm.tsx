"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function AddTicketReplyForm({
  ticketId,
}: {
  ticketId: number;
}) {
  const router = useRouter();
  const t = useTranslations("tickets.replyForm");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitReply(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    const trimmedMessage = message.trim();

    setError("");

    if (!trimmedMessage) {
      setError(t("errors.messageRequired"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/tickets/${ticketId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: trimmedMessage,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || t("errors.sendFailed"));
        return;
      }

      setMessage("");
      router.refresh();
    } catch {
      setError(t("errors.sendFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submitReply}
      className="mt-6 space-y-3"
    >
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("messageLabel")}
        rows={4}
        disabled={loading}
        className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("sending") : t("send")}
      </button>
    </form>
  );
}