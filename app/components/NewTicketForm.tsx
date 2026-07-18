"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

export default function NewTicketForm() {
  const router = useRouter();
  const t = useTranslations("tickets.form");

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function createTicket(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setError("");

    try {
      setLoading(true);

      const response = await fetch("/api/tickets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          message: message.trim(),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(data?.message || t("errors.createFailed"));
        return;
      }

      router.push("/dashboard/tickets");
      router.refresh();
    } catch {
      setError(t("errors.createFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={createTicket}
      className="space-y-6"
    >
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <input
        type="text"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        placeholder={t("subjectPlaceholder")}
        aria-label={t("subject")}
        required
        disabled={loading}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        disabled={loading}
        aria-label={t("category")}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="GENERAL">
          {t("categories.general")}
        </option>

        <option value="TECHNICAL">
          {t("categories.technical")}
        </option>

        <option value="VERIFICATION">
          {t("categories.verification")}
        </option>

        <option value="BILLING">
          {t("categories.billing")}
        </option>

        <option value="DISPUTE">
          {t("categories.dispute")}
        </option>
      </select>

      <textarea
        rows={8}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("messagePlaceholder")}
        aria-label={t("message")}
        required
        disabled={loading}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? t("creating")
          : t("create")}
      </button>
    </form>
  );
}