"use client";

import { useState } from "react";
import { TRADE_CATEGORIES } from "../../../../lib/categories";

export default function NewCompanyPage() {
  const [form, setForm] = useState({
    name: "",
    country: "",
    category: "General",
    description: "",
    email: "",
    website: "",
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("country", form.country);
      formData.append("category", form.category);
      formData.append("description", form.description);
      formData.append("email", form.email);
      formData.append("website", form.website);

      if (logoFile) {
        formData.append("logo", logoFile);
      }

      const response = await fetch("/api/companies", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        setMessage("Company created successfully.");

        setForm({
          name: "",
          country: "",
          category: "General",
          description: "",
          email: "",
          website: "",
        });

        setLogoFile(null);
      } else {
        const data = await response.json();
        setMessage(data.message || "Error creating company.");
      }
    } catch {
      setMessage("Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          Add Company
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            required
            placeholder="Company Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
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

          <select
            required
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900"
          >
            {TRADE_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          <textarea
            required
            placeholder="Description"
            value={form.description}
            onChange={(e) =>
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900"
          />

          <input
            required
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({
                ...form,
                email: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900"
          />

          <input
            placeholder="Website"
            value={form.website}
            onChange={(e) =>
              setForm({
                ...form,
                website: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900"
          />

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) =>
              setLogoFile(e.target.files?.[0] || null)
            }
            className="w-full p-3 rounded bg-slate-900"
          />

          <button className="bg-blue-600 px-6 py-3 rounded hover:bg-blue-700">
            Create Company
          </button>
        </form>

        {message && (
          <p className="mt-6 text-green-400">{message}</p>
        )}
      </div>
    </div>
  );
}