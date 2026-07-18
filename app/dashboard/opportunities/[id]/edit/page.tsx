"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditOpportunityPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("opportunities.edit");

  const id = params.id as string;

  const [form, setForm] = useState<OpportunityForm>(INITIAL_FORM);

  const [image, setImage] = useState<File | null>(null);

  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const [message, setMessage] = useState("");
  const [loadingOpportunity, setLoadingOpportunity] = useState(true);
  const [updating, setUpdating] = useState(false);

  function updateField(field: keyof OpportunityForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchOpportunity() {
      setMessage("");
      setLoadingOpportunity(true);

      try {
        const response = await fetch(`/api/opportunities/${id}`);

        const opportunity = await response.json().catch(() => null);

        if (!response.ok || !opportunity) {
          if (!cancelled) {
            setMessage(opportunity?.message || t("errors.loadFailed"));
          }

          return;
        }

        if (cancelled) {
          return;
        }

        setForm({
          title: opportunity.title || "",
          country: opportunity.country || "",
          description: opportunity.description || "",
        });

        setCurrentImageUrl(opportunity.imageUrl || "");
      } catch {
        if (!cancelled) {
          setMessage(t("errors.loadFailed"));
        }
      } finally {
        if (!cancelled) {
          setLoadingOpportunity(false);
        }
      }
    }

    if (id) {
      fetchOpportunity();
    }

    return () => {
      cancelled = true;
    };
  }, [id, t]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setUpdating(true);

    try {
      const formData = new FormData();

      formData.append("title", form.title.trim());
      formData.append("country", form.country.trim());
      formData.append("description", form.description.trim());

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(`/api/opportunities/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(data?.message || t("errors.updateFailed"));
        return;
      }

      router.push(`/opportunities/${id}`);
      router.refresh();
    } catch {
      setMessage(t("errors.networkError"));
    } finally {
      setUpdating(false);
    }
  }

  const disabled = loadingOpportunity || updating;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{t("title")}</h1>

          <p className="mt-3 text-slate-400">{t("description")}</p>
        </div>

        {loadingOpportunity ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            {t("loading")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {currentImageUrl && (
              <div>
                <p className="mb-2 text-sm text-slate-400">
                  {t("currentImage")}
                </p>

                <Image
                  src={currentImageUrl}
                  alt={t("currentImageAlt")}
                  width={800}
                  height={400}
                  className="h-64 w-full rounded-xl border border-slate-800 object-cover"
                />
              </div>
            )}

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
                disabled={disabled}
                placeholder={t("fields.title.placeholder")}
                value={form.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={disabled}
                placeholder={t("fields.country.placeholder")}
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
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
                disabled={disabled}
                placeholder={t("fields.description.placeholder")}
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="opportunity-image"
                className="mb-2 block text-sm text-slate-300"
              >
                {t("fields.image.label")}
              </label>

              <input
                id="opportunity-image"
                type="file"
                disabled={disabled}
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setImage(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-xs text-slate-500">
                {t("fields.image.help")}
              </p>
            </div>

            {message && (
              <div className="rounded-xl border border-red-700 bg-red-950/40 px-4 py-3 text-sm text-red-300">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={disabled}
              className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {updating ? t("updating") : t("update")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
