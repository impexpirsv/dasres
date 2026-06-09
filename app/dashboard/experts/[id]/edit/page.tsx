"use client";

import { useEffect, useState } from "react";
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

  const [image, setImage] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function fetchExpert() {
      const response = await fetch(`/api/experts/${id}`);

      if (!response.ok) {
        setMessage("Error loading expert.");
        return;
      }

      const expert = await response.json();

      setForm({
        name: expert.name || "",
        country: expert.country || "",
        specialty: expert.specialty || "",
        experience: expert.experience || "",
        email: expert.email || "",
      });

      setCurrentImageUrl(expert.imageUrl || "");
    }

    fetchExpert();
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const formData = new FormData();

    formData.append("name", form.name);
    formData.append("country", form.country);
    formData.append("specialty", form.specialty);
    formData.append("experience", form.experience);
    formData.append("email", form.email);

    if (image) {
      formData.append("image", image);
    }

    const response = await fetch(`/api/experts/${id}`, {
      method: "PUT",
      body: formData,
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
          {currentImageUrl && (
            <img
              src={currentImageUrl}
              alt="Current expert"
              className="w-full h-64 object-cover rounded-xl border border-slate-800"
            />
          )}

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
              setForm({
                ...form,
                specialty: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
          />

          <input
            placeholder="Experience"
            value={form.experience}
            onChange={(e) =>
              setForm({
                ...form,
                experience: e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900 text-white"
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

          <div>
            <label className="block mb-2 text-slate-300">
              Replace Image
            </label>

            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setImage(e.target.files?.[0] || null)
              }
              className="w-full p-3 rounded bg-slate-900 text-white"
            />
          </div>

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