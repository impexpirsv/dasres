"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditOpportunityPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [form, setForm] = useState({
    title: "",
    country: "",
    description: "",
  });

  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const response = await fetch(`/api/opportunities/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      router.push(`/opportunities/${id}`);
      router.refresh();
    } else {
      setMessage("Error updating opportunity.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          Edit Opportunity
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Title"
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
          />

          <input
            placeholder="Country"
            value={form.country}
            onChange={(e) =>
              setForm({ ...form, country: e.target.value })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
            rows={5}
          />

          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded">
            Update Opportunity
          </button>
        </form>

        {message && (
          <p className="mt-6 text-red-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}