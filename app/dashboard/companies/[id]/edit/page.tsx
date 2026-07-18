"use client";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { TRADE_CATEGORIES } from "../../../../../lib/categories";

type CompanyForm = {
  name: string;
  country: string;
  category: string;
  description: string;
  email: string;
  website: string;
};

const INITIAL_FORM: CompanyForm = {
  name: "",
  country: "",
  category: "General",
  description: "",
  email: "",
  website: "",
};

export default function EditCompanyPage() {
  const router = useRouter();
  const params = useParams();
  const t = useTranslations("companies.edit");

  const id = params.id as string;

  const [form, setForm] = useState<CompanyForm>(INITIAL_FORM);

  const [logo, setLogo] = useState<File | null>(null);

  const [currentLogoUrl, setCurrentLogoUrl] = useState("");

  const [message, setMessage] = useState("");
  const [loadingCompany, setLoadingCompany] = useState(true);
  const [updating, setUpdating] = useState(false);

  function updateField(field: keyof CompanyForm, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  function getCategoryLabel(category: string) {
    switch (category) {
      case "General":
        return t("categories.general");

      case "Customs Clearance":
        return t("categories.customsClearance");

      case "Shipping":
        return t("categories.shipping");

      case "Inspection":
        return t("categories.inspection");

      case "Insurance":
        return t("categories.insurance");

      case "Sourcing":
        return t("categories.sourcing");

      case "Documentation":
        return t("categories.documentation");

      case "Payment":
        return t("categories.payment");

      default:
        return category;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function fetchCompany() {
      setMessage("");
      setLoadingCompany(true);

      try {
        const response = await fetch(`/api/companies/${id}`);

        const company = await response.json().catch(() => null);

        if (!response.ok || !company) {
          if (!cancelled) {
            setMessage(company?.message || t("errors.loadFailed"));
          }

          return;
        }

        if (cancelled) {
          return;
        }

        setForm({
          name: company.name || "",
          country: company.country || "",
          category: company.category || "General",
          description: company.description || "",
          email: company.email || "",
          website: company.website || "",
        });

        setCurrentLogoUrl(company.logoUrl || "");
      } catch {
        if (!cancelled) {
          setMessage(t("errors.loadFailed"));
        }
      } finally {
        if (!cancelled) {
          setLoadingCompany(false);
        }
      }
    }

    if (id) {
      fetchCompany();
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
      formData.append("category", form.category);
      formData.append("description", form.description.trim());
      formData.append("email", form.email.trim());
      formData.append("website", form.website.trim());

      if (logo) {
        formData.append("logo", logo);
      }

      const response = await fetch(`/api/companies/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(data?.message || t("errors.updateFailed"));
        return;
      }

      router.push(`/dashboard/companies/${id}`);
      router.refresh();
    } catch {
      setMessage(t("errors.networkError"));
    } finally {
      setUpdating(false);
    }
  }

  const disabled = loadingCompany || updating;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-2xl px-6 py-20">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">{t("title")}</h1>

          <p className="mt-3 text-slate-400">{t("description")}</p>
        </div>

        {loadingCompany ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 text-slate-400">
            {t("loading")}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {currentLogoUrl && (
              <div>
                <p className="mb-2 text-sm text-slate-400">
                  {t("currentLogo")}
                </p>

                <div className="rounded-xl border border-slate-800 bg-white p-6">
                  <Image
                    src={currentLogoUrl}
                    alt={t("currentLogoAlt")}
                    width={800}
                    height={400}
                    className="h-48 w-full object-contain"
                  />
                </div>
              </div>
            )}

            <div>
              <label
                htmlFor="company-name"
                className="mb-2 block text-sm text-slate-400"
              >
                {t("fields.name.label")}
              </label>

              <input
                id="company-name"
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
                htmlFor="company-country"
                className="mb-2 block text-sm text-slate-400"
              >
                {t("fields.country.label")}
              </label>

              <input
                id="company-country"
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
                htmlFor="company-category"
                className="mb-2 block text-sm text-slate-400"
              >
                {t("fields.category.label")}
              </label>

              <select
                id="company-category"
                required
                disabled={disabled}
                value={form.category}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {TRADE_CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {getCategoryLabel(category)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="company-description"
                className="mb-2 block text-sm text-slate-400"
              >
                {t("fields.description.label")}
              </label>

              <textarea
                id="company-description"
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
                htmlFor="company-email"
                className="mb-2 block text-sm text-slate-400"
              >
                {t("fields.email.label")}
              </label>

              <input
                id="company-email"
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
                htmlFor="company-website"
                className="mb-2 block text-sm text-slate-400"
              >
                {t("fields.website.label")}
              </label>

              <input
                id="company-website"
                type="url"
                disabled={disabled}
                placeholder={t("fields.website.placeholder")}
                value={form.website}
                onChange={(e) => updateField("website", e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="company-logo"
                className="mb-2 block text-sm text-slate-300"
              >
                {t("fields.logo.label")}
              </label>

              <input
                id="company-logo"
                type="file"
                disabled={disabled}
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 p-3 text-white disabled:cursor-not-allowed disabled:opacity-60"
              />

              <p className="mt-2 text-xs text-slate-500">
                {t("fields.logo.help")}
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
