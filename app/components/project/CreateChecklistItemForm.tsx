"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type CreatedChecklistItem = {
  id: number;
  title: string;
  completed: boolean;
};

export default function CreateChecklistItemForm({
  taskId,
  onCreated,
}: {
  taskId: number;
  onCreated: (item: CreatedChecklistItem) => void;
}) {
  const t = useTranslations("createChecklistItemForm");

  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);

  async function createItem() {
    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      alert(t("titleRequired"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/project-tasks/${taskId}/checklist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title: trimmedTitle,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || t("createError"));
        return;
      }

      if (!data.checklistItem) {
        alert(t("invalidResponse"));
        return;
      }

      onCreated(data.checklistItem);
      setTitle("");
    } catch {
      alert(t("networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-3 flex flex-col gap-2 sm:flex-row">
      <label
        htmlFor={`checklist-item-title-${taskId}`}
        className="sr-only"
      >
        {t("label")}
      </label>

      <input
        id={`checklist-item-title-${taskId}`}
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.nativeEvent.isComposing
          ) {
            event.preventDefault();
            void createItem();
          }
        }}
        placeholder={t("placeholder")}
        disabled={loading}
        className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-blue-500 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
      />

      <button
        type="button"
        onClick={() => void createItem()}
        disabled={loading || !title.trim()}
        className="shrink-0 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("adding") : t("add")}
      </button>
    </div>
  );
}