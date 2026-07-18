"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";

type CreateCaseState = {
  error?: string;
};

const CASE_CATEGORIES = [
  "General",
  "Customs Clearance",
  "Shipping",
  "Inspection",
  "Insurance",
  "Sourcing",
  "Documentation",
  "Payment",
] as const;

export default function CreateCaseForm({
  action,
}: {
  action: (
    previousState: CreateCaseState,
    formData: FormData,
  ) => Promise<CreateCaseState>;
}) {
  const t = useTranslations("createCaseForm");

  const [state, formAction, isPending] =
    useActionState(action, {});

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

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-xl border border-red-700 bg-red-950/50 p-4 text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="case-title"
          className="mb-2 block text-sm text-slate-400"
        >
          {t("titleLabel")}
        </label>

        <input
          id="case-title"
          name="title"
          type="text"
          required
          disabled={isPending}
          placeholder={t("titlePlaceholder")}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <div>
        <label
          htmlFor="case-category"
          className="mb-2 block text-sm text-slate-400"
        >
          {t("categoryLabel")}
        </label>

        <select
          id="case-category"
          name="category"
          defaultValue="General"
          disabled={isPending}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {CASE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {getCategoryLabel(category)}
            </option>
          ))}
        </select>

        <p className="mt-2 text-xs text-slate-500">
          {t("categoryHelp")}
        </p>
      </div>

      <div>
        <label
          htmlFor="case-description"
          className="mb-2 block text-sm text-slate-400"
        >
          {t("descriptionLabel")}
        </label>

        <textarea
          id="case-description"
          name="description"
          required
          rows={7}
          disabled={isPending}
          placeholder={t("descriptionPlaceholder")}
          className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-blue-600 px-6 py-3 font-semibold hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? t("creating")
          : t("create")}
      </button>
    </form>
  );
}