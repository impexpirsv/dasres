"use client";

import { useEffect, useState } from "react";
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

  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchOpportunity() {
      const response = await fetch(`/api/opportunities/${id}`);

      if (!response.ok) {
        setMessage("Error loading opportunity.");
        return;
      }

      const opportunity = await response.json();

      setForm({
        title: opportunity.title || "",
        country: opportunity.country || "",
        description: opportunity.description || "",
      });

      setCurrentImageUrl(opportunity.imageUrl || "");
    }

    fetchOpportunity();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();

    formData.append("title", form.title);
    formData.append("country", form.country);
    formData.append("description", form.description);

    if (image) {
      formData.append("image", image);
    }

    const response = await fetch(`/api/opportunities/${id}`, {
      method: "PUT",
      body: formData,
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
          {currentImageUrl && (
            <img
              src={currentImageUrl}
              alt="Current opportunity"
              className="w-full h-64 object-cover rounded-xl border border-slate-800"
            />
          )}

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
              setForm({
                ...form,
                description: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
            rows={5}
          />

          <div>
            <label className="block mb-2 text-slate-300">
              Replace Image
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={(e) =>
                setImage(e.target.files?.[0] || null)
              }
              className="w-full p-3 rounded bg-slate-900 text-white"
            />
          </div>

          <button className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded">
            Update Opportunity
          </button>
        </form>

        {message && (
          <p className="mt-6 text-red-400">{message}</p>
        )}
      </div>
    </div>
  );
}