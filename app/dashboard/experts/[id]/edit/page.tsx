"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditExpertPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("experts.edit");

  const id = params.id as string;

  const [form, setForm] = useState<ExpertForm>(INITIAL_FORM);

  const [image, setImage] = useState<File | null>(null);

  const [currentImageUrl, setCurrentImageUrl] = useState("");

  const [message, setMessage] = useState("");
  const [loadingExpert, setLoadingExpert] = useState(true);
  const [updating, setUpdating] = useState(false);

  function updateField(field: keyof ExpertForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchExpert() {
      setMessage("");
      setLoadingExpert(true);

      try {
        const response = await fetch(`/api/experts/${id}`);

        const expert = await response.json().catch(() => null);

        if (!response.ok || !expert) {
          if (!cancelled) {
            setMessage(expert?.message || t("errors.loadFailed"));
          }

          return;
        }

        if (cancelled) {
          return;
        }

        setForm({
          name: expert.name || "",
          country: expert.country || "",
          specialty: expert.specialty || "",
          experience: expert.experience || "",
          email: expert.email || "",
        });

        setCurrentImageUrl(expert.imageUrl || "");
      } catch {
        if (!cancelled) {
          setMessage(t("errors.loadFailed"));
        }
      } finally {
        if (!cancelled) {
          setLoadingExpert(false);
        }
      }
    }

    if (id) {
      fetchExpert();
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

      formData.append("name", form.name.trim());
      formData.append("country", form.country.trim());
      formData.append("specialty", form.specialty.trim());
      formData.append("experience", form.experience.trim());
      formData.append("email", form.email.trim());

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(`/api/experts/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(data?.message || t("errors.updateFailed"));
        return;
      }

      router.push(`/experts/${id}`);
      router.refresh();
    } catch {
      setMessage(t("errors.networkError"));
    } finally {
      setUpdating(false);
    }
  }

  const disabled = loadingExpert || updating;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{t("title")}</h1>

          <p className="mt-3 text-slate-400">{t("description")}</p>
        </div>

        {loadingExpert ? (
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
                htmlFor="expert-name"
                className="mb-2 block text-sm text-slate-400"
              >
                {t("fields.name.label")}
              </label>

              <input
                id="expert-name"
                type="text"
                required
                disabled={disabled}
                placeholder={t("fields.name.placeholder")}
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={disabled}
                placeholder={t("fields.country.placeholder")}
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={disabled}
                placeholder={t("fields.specialty.placeholder")}
                value={form.specialty}
                onChange={(e) => updateField("specialty", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={disabled}
                placeholder={t("fields.experience.placeholder")}
                value={form.experience}
                onChange={(e) => updateField("experience", e.target.value)}
                className="w-full resize-y rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
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
                disabled={disabled}
                placeholder={t("fields.email.placeholder")}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="expert-image"
                className="mb-2 block text-sm text-slate-300"
              >
                {t("fields.image.label")}
              </label>

              <input
                id="expert-image"
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
