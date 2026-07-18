"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type ExpertForm = {
  name: string;
  country: string;
  specialty: string;
  experience: string;
  email: string;
};

const INITIAL_FORM: ExpertForm = {
  name: "",
  country: "",
  specialty: "",
  experience: "",
  email: "",
};

export default function NewExpertPage() {
  const t = useTranslations("experts.new");

  const [form, setForm] =
    useState<ExpertForm>(INITIAL_FORM);

  const [imageFile, setImageFile] =
    useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] =
    useState(false);
  const [loading, setLoading] =
    useState(false);

  function updateField(
    field: keyof ExpertForm,
    value: string,
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();

    setMessage("");
    setIsSuccess(false);
    setLoading(true);

    try {
      const formData = new FormData();

      formData.append(
        "name",
        form.name.trim(),
      );
      formData.append(
        "country",
        form.country.trim(),
      );
      formData.append(
        "specialty",
        form.specialty.trim(),
      );
      formData.append(
        "experience",
        form.experience.trim(),
      );
      formData.append(
        "email",
        form.email.trim(),
      );

      if (imageFile) {
        formData.append("image", imageFile);
      }

      const response = await fetch(
        "/api/experts",
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        setMessage(
          data?.message ||
            t("errors.createFailed"),
        );
        return;
      }

      setMessage(t("success"));
      setIsSuccess(true);
      setForm(INITIAL_FORM);
      setImageFile(null);

      const fileInput =
        document.getElementById(
          "expert-image",
        ) as HTMLInputElement | null;

      if (fileInput) {
        fileInput.value = "";
      }
    } catch {
      setMessage(t("errors.networkError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            {t("title")}
          </h1>

          <p className="mt-3 text-slate-400">
            {t("description")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="expert-name"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.name.label")}
            </label>

            <input
              id="expert-name"
              type="text"
              required
              disabled={loading}
              placeholder={t(
                "fields.name.placeholder",
              )}
              value={form.name}
              onChange={(e) =>
                updateField(
                  "name",
                  e.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="expert-country"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.country.label")}
            </label>

            <input
              id="expert-country"
              type="text"
              required
              disabled={loading}
              placeholder={t(
                "fields.country.placeholder",
              )}
              value={form.country}
              onChange={(e) =>
                updateField(
                  "country",
                  e.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="expert-specialty"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.specialty.label")}
            </label>

            <input
              id="expert-specialty"
              type="text"
              required
              disabled={loading}
              placeholder={t(
                "fields.specialty.placeholder",
              )}
              value={form.specialty}
              onChange={(e) =>
                updateField(
                  "specialty",
                  e.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="expert-experience"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.experience.label")}
            </label>

            <textarea
              id="expert-experience"
              required
              rows={5}
              disabled={loading}
              placeholder={t(
                "fields.experience.placeholder",
              )}
              value={form.experience}
              onChange={(e) =>
                updateField(
                  "experience",
                  e.target.value,
                )
              }
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900 p-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="expert-email"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.email.label")}
            </label>

            <input
              id="expert-email"
              type="email"
              required
              disabled={loading}
              placeholder={t(
                "fields.email.placeholder",
              )}
              value={form.email}
              onChange={(e) =>
                updateField(
                  "email",
                  e.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="expert-image"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.image.label")}
            </label>

            <input
              id="expert-image"
              type="file"
              disabled={loading}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setImageFile(
                  e.target.files?.[0] || null,
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-2 text-xs text-slate-500">
              {t("fields.image.help")}
            </p>
          </div>

          {message && (
            <div
              className={`rounded-xl border px-4 py-3 text-sm ${
                isSuccess
                  ? "border-emerald-700 bg-emerald-950/40 text-emerald-300"
                  : "border-red-700 bg-red-950/40 text-red-300"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? t("creating")
              : t("create")}
          </button>
        </form>
      </div>
    </div>
  );
}