"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewTicketForm() {
  const router = useRouter();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function createTicket(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);

    const response = await fetch(
      "/api/tickets",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subject,
          category,
          message,
        }),
      }
    );

    setLoading(false);

    if (!response.ok) {
      alert("Failed to create ticket");
      return;
    }

    router.push("/dashboard/tickets");
    router.refresh();
  }

  return (
    <form
      onSubmit={createTicket}
      className="space-y-6"
    >
      <input
        type="text"
        placeholder="Subject"
        value={subject}
        onChange={(e) =>
          setSubject(e.target.value)
        }
        required
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
      />

      <select
        value={category}
        onChange={(e) =>
          setCategory(e.target.value)
        }
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
      >
        <option value="GENERAL">
          General
        </option>

        <option value="TECHNICAL">
          Technical
        </option>

        <option value="VERIFICATION">
          Verification
        </option>

        <option value="BILLING">
          Billing
        </option>

        <option value="DISPUTE">
          Dispute
        </option>
      </select>

      <textarea
        placeholder="Describe your issue..."
        value={message}
        onChange={(e) =>
          setMessage(e.target.value)
        }
        required
        rows={8}
        className="w-full rounded-xl border border-slate-800 bg-slate-900 px-4 py-3"
      />

      <button
        type="submit"
        disabled={loading}
        className="rounded-xl bg-blue-600 px-6 py-3 hover:bg-blue-700 disabled:opacity-50"
      >
        {loading
          ? "Creating..."
          : "Create Ticket"}
      </button>
    </form>
  );
}