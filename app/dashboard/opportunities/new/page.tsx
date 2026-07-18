"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

type OpportunityForm = {
  title: string;
  country: string;
  description: string;
};

const INITIAL_FORM: OpportunityForm = {
  title: "",
  country: "",
  description: "",
};

export default function NewOpportunityPage() {
  const t = useTranslations("opportunities.new");

  const [form, setForm] =
    useState<OpportunityForm>(INITIAL_FORM);

  const [image, setImage] =
    useState<File | null>(null);

  const [message, setMessage] = useState("");
  const [isSuccess, setIsSuccess] =
    useState(false);
  const [loading, setLoading] =
    useState(false);

  function updateField(
    field: keyof OpportunityForm,
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
        "title",
        form.title.trim(),
      );
      formData.append(
        "country",
        form.country.trim(),
      );
      formData.append(
        "description",
        form.description.trim(),
      );

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(
        "/api/opportunities",
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
      setImage(null);

      const fileInput =
        document.getElementById(
          "opportunity-image",
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
              htmlFor="opportunity-title"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.title.label")}
            </label>

            <input
              id="opportunity-title"
              type="text"
              required
              disabled={loading}
              placeholder={t(
                "fields.title.placeholder",
              )}
              value={form.title}
              onChange={(e) =>
                updateField(
                  "title",
                  e.target.value,
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label
              htmlFor="opportunity-country"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.country.label")}
            </label>

            <input
              id="opportunity-country"
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
              htmlFor="opportunity-image"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.image.label")}
            </label>

            <input
              id="opportunity-image"
              type="file"
              disabled={loading}
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) =>
                setImage(
                  e.target.files?.[0] || null,
                )
              }
              className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <p className="mt-2 text-xs text-slate-500">
              {t("fields.image.help")}
            </p>
          </div>

          <div>
            <label
              htmlFor="opportunity-description"
              className="mb-2 block text-sm text-slate-400"
            >
              {t("fields.description.label")}
            </label>

            <textarea
              id="opportunity-description"
              required
              rows={5}
              disabled={loading}
              placeholder={t(
                "fields.description.placeholder",
              )}
              value={form.description}
              onChange={(e) =>
                updateField(
                  "description",
                  e.target.value,
                )
              }
              className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900 p-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            />
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