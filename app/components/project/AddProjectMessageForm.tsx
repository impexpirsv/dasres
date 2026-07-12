"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("addProjectMessageForm");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || loading) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch("/api/project-messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId,
          conversationId: conversationId ?? null,
          message: trimmedMessage,
        }),
      });

      let data: {
        message?: string;
        conversationId?: number;
        messageItem?: ProjectMessageItem;
      } & Record<string, unknown> = {};

      try {
        data = await response.json();
      } catch {
        // API may return an empty or non-JSON response.
      }

      if (!response.ok) {
        alert(
          typeof data.message === "string"
            ? data.message
            : t("sendError"),
        );
        return;
      }

      const returnedConversationId =
        typeof data.conversationId === "number"
          ? data.conversationId
          : null;

      const returnedMessage =
        (data.messageItem as ProjectMessageItem | undefined) ??
        (typeof data.message === "object"
          ? (data.message as ProjectMessageItem)
          : undefined);

      if (!returnedConversationId || !returnedMessage) {
        alert(t("invalidResponse"));
        return;
      }

      onMessageSent(
        returnedConversationId,
        returnedMessage,
      );

      setMessage("");
    } catch {
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <label
        htmlFor={`project-message-${projectId}`}
        className="sr-only"
      >
        {t("label")}
      </label>

      <textarea
        id={`project-message-${projectId}`}
        value={message}
        onChange={(event) =>
          setMessage(event.target.value)
        }
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            (event.ctrlKey || event.metaKey) &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            void submit();
          }
        }}
        disabled={loading}
        placeholder={t("placeholder")}
        className="min-h-28 w-full resize-y rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {t("shortcutHint")}
        </p>

        <button
          type="button"
          onClick={() => void submit()}
          disabled={loading || !message.trim()}
          aria-busy={loading}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? t("sending") : t("send")}
        </button>
      </div>
    </div>
  );
}