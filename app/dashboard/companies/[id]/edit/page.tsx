"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();

  const id = params.id as string;

  const [form, setForm] = useState({
    name: "",
    country: "",
    category: "",
    description: "",
    email: "",
    website: "",
  });

  const [logo, setLogo] = useState<File | null>(null);
  const [currentLogoUrl, setCurrentLogoUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchCompany() {
      const response = await fetch(`/api/companies/${id}`);

      if (!response.ok) {
        setMessage("Error loading company.");
        return;
      }

      const company = await response.json();

      setForm({
        name: company.name || "",
        country: company.country || "",
        category: company.category || "",
        description: company.description || "",
        email: company.email || "",
        website: company.website || "",
      });

      setCurrentLogoUrl(company.logoUrl || "");
    }

    fetchCompany();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();

    formData.append("name", form.name);
    formData.append("country", form.country);
    formData.append("category", form.category);
    formData.append("description", form.description);
    formData.append("email", form.email);
    formData.append("website", form.website);

    if (logo) {
      formData.append("logo", logo);
    }

    const response = await fetch(`/api/companies/${id}`, {
      method: "PUT",
      body: formData,
    });

    if (response.ok) {
      router.push(`/dashboard/companies/${id}`);
      router.refresh();
    } else {
      setMessage("Error updating company.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          Edit Company
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {currentLogoUrl && (
            <div className="bg-white rounded-xl border border-slate-800 p-6">
              <img
                src={currentLogoUrl}
                alt="Current company logo"
                className="w-full h-48 object-contain"
              />
            </div>
          )}

          <input
            placeholder="Company Name"
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
            placeholder="Category"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
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
            className="w-full p-3 rounded bg-slate-900 text-white"
            rows={5}
          />

          <input
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) =>
              setForm({ ...form, email: e.target.value })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
          />

          <input
            placeholder="Website"
            value={form.website}
            onChange={(e) =>
              setForm({ ...form, website: e.target.value })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
          />

          <div>
            <label className="block mb-2 text-slate-300">
              Replace Logo
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setLogo(e.target.files?.[0] || null)
              }
              className="w-full p-3 rounded bg-slate-900 text-white"
            />
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded">
            Update Company
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