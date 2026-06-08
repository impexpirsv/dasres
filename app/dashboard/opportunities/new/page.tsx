"use client";

import { useState } from "react";

export default function NewOpportunityPage() {
  const [form, setForm] = useState({
    title: "",
    country: "",
    description: "",
  });

  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const response = await fetch("/api/opportunities", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage("Opportunity created successfully.");

      setForm({
        title: "",
        country: "",
        description: "",
      });
    } else {
      setMessage(
        data.message || "Error creating opportunity."
      );
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          Add Opportunity
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
          required
            placeholder="Title"
            value={form.title}
            onChange={(e) =>
              setForm({
                ...form,
                title: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900"
          />

          <input
          required
            placeholder="Country"
            value={form.country}
            onChange={(e) =>
              setForm({
                ...form,
                country: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900"
          />

          <textarea
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900"
            rows={5}
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded"
          >
            Create Opportunity
          </button>
        </form>

        {message && (
          <p className="mt-6 text-green-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}