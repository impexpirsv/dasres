"use client";

import { useState } from "react";

export default function NewExpertPage() {
  const [form, setForm] = useState({
    name: "",
    country: "",
    specialty: "",
    experience: "",
    email: "",
  });

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [message, setMessage] =
    useState("");

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    try {
      const formData = new FormData();

      formData.append("name", form.name);
      formData.append("country", form.country);
      formData.append(
        "specialty",
        form.specialty
      );
      formData.append(
        "experience",
        form.experience
      );
      formData.append("email", form.email);

      if (imageFile) {
        formData.append(
          "image",
          imageFile
        );
      }

      const response = await fetch(
        "/api/experts",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        setMessage(
          "Expert created successfully."
        );

        setForm({
          name: "",
          country: "",
          specialty: "",
          experience: "",
          email: "",
        });

        setImageFile(null);
      } else {
        setMessage(
          "Error creating expert."
        );
      }
    } catch (error) {
      setMessage("Something went wrong.");
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-20">
        <h1 className="text-4xl font-bold mb-8">
          Add Expert
        </h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4"
        >
          <input
            required
            placeholder="Name"
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

          <input
            required
            placeholder="Specialty"
            value={form.specialty}
            onChange={(e) =>
              setForm({
                ...form,
                specialty:
                  e.target.value,
              })
            }
            className="w-full p-3 rounded bg-slate-900"
          />

          <input
            required
            placeholder="Experience"
            value={form.experience}
            onChange={(e) =>
              setForm({
                ...form,
                experience:
                  e.target.value,
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
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) =>
              setImageFile(
                e.target.files?.[0] ||
                  null
              )
            }
            className="w-full p-3 rounded bg-slate-900"
          />

          <button className="bg-blue-600 px-6 py-3 rounded hover:bg-blue-700">
            Create Expert
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