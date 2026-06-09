"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function AddCaseMessageForm({
  caseId,
}: {
  caseId: number;
}) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitMessage(e: React.FormEvent) {
    e.preventDefault();

    if (!content.trim()) return;

    setLoading(true);

    const response = await fetch(`/api/cases/${caseId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content }),
    });

    console.log(await response.json());

    setContent("");
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={submitMessage} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        placeholder="Write a message..."
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl disabled:opacity-50"
      >
        {loading ? "Sending..." : "Add Message"}
      </button>
    </form>
  );
}