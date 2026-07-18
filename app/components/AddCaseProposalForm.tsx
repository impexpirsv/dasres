"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

type CompanyOption = {
  id: number;
  name: string;
};

type ExpertOption = {
  id: number;
  name: string;
};

export default function AddCaseProposalForm({
  caseId,
  companies,
  experts,
}: {
  caseId: number;
  companies: CompanyOption[];
  experts: ExpertOption[];
}) {
  const router = useRouter();
  const t = useTranslations("tradeCases.addProposal");

  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [expertId, setExpertId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submitProposal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setError("");

    if (!message.trim()) {
      setError(t("errors.messageRequired"));
      return;
    }

    if (!companyId) {
      setError(t("errors.companyRequired"));
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `/api/cases/${caseId}/proposals`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: message.trim(),
            price: price.trim(),
            companyId,
            expertId,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || t("errors.submitFailed"));
        return;
      }

      setMessage("");
      setPrice("");
      setCompanyId("");
      setExpertId("");

      router.refresh();
    } catch {
      setError(t("errors.submitFailed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={submitProposal}
      className="mb-6 space-y-3"
    >
      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}

      <select
        value={companyId}
        onChange={(e) => setCompanyId(e.target.value)}
        disabled={loading}
        aria-label={t("companyLabel")}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{t("selectCompany")}</option>

        {companies.map((company) => (
          <option
            key={company.id}
            value={company.id}
          >
            {company.name}
          </option>
        ))}
      </select>

      <select
        value={expertId}
        onChange={(e) => setExpertId(e.target.value)}
        disabled={loading}
        aria-label={t("expertLabel")}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">{t("noExpert")}</option>

        {experts.map((expert) => (
          <option
            key={expert.id}
            value={expert.id}
          >
            {expert.name}
          </option>
        ))}
      </select>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        disabled={loading}
        placeholder={t("messagePlaceholder")}
        aria-label={t("messageLabel")}
        className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        type="text"
        disabled={loading}
        placeholder={t("pricePlaceholder")}
        aria-label={t("priceLabel")}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-blue-600 px-4 py-3 font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}