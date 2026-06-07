"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditExpertPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [form, setForm] = useState({
    name: "",
    country: "",
    specialty: "",
    experience: "",
    email: "",
  });

  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const response = await fetch(`/api/experts/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(form),
    });

    if (response.ok) {
      router.push(`/experts/${id}`);
      router.refresh();
    } else {
      setMessage("Error updating expert.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          Edit Expert
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            placeholder="Name"
            value={form.name}
            onChange={(e) =>
              setForm({ ...form, name: e.target.value })
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

          <input
            placeholder="Specialty"
            value={form.specialty}
            onChange={(e) =>
              setForm({ ...form, specialty: e.target.value })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
          />

          <input
            placeholder="Experience"
            value={form.experience}
            onChange={(e) =>
              setForm({ ...form, experience: e.target.value })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
          />

          <input
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
          />

          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded">
            Update Expert
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