"use client";

import { useState, useTransition } from "react";
import type { ProjectMessageItem } from "./ProjectMessaging";

export default function AddProjectMessageForm({
  projectId,
  conversationId,
  onMessageSent,
}: {
  projectId: number;
  conversationId?: number;
  onMessageSent: (
    conversationId: number,
    message: ProjectMessageItem,
  ) => void;
}) {
  const [message, setMessage] = useState("");
  const [loading, startTransition] = useTransition();

  function submit() {
    if (!message.trim()) return;

    startTransition(async () => {
      const response = await fetch("/api/project-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          conversationId,
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to send message.");
        return;
      }

      onMessageSent(data.conversationId, data.message);
      setMessage("");
    });
  }

  return (
    <div className="space-y-3">
      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Write a project message..."
        className="min-h-28 w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
      />

      <div className="flex justify-end">
        <button
          type="button"
          onClick={submit}
          disabled={loading || !message.trim()}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send Message
        </button>
      </div>
    </div>
  );
}