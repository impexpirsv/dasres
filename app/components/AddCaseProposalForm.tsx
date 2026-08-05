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

  async function submitProposal(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setError("");

    const normalizedMessage = message.trim();
    const normalizedPrice = price.trim();
    const parsedCompanyId = Number(companyId);
    const parsedExpertId = expertId ? Number(expertId) : null;

    if (!normalizedMessage) {
      setError(t("errors.messageRequired"));
      return;
    }

    if (
      !Number.isInteger(parsedCompanyId) ||
      parsedCompanyId <= 0
    ) {
      setError(t("errors.companyRequired"));
      return;
    }

    if (
      parsedExpertId !== null &&
      (!Number.isInteger(parsedExpertId) || parsedExpertId <= 0)
    ) {
      setError(t("errors.submitFailed"));
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
            message: normalizedMessage,
            price: normalizedPrice || null,
            companyId: parsedCompanyId,
            expertId: parsedExpertId,
          }),
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setError(
          data?.message || t("errors.submitFailed"),
        );
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
        <div
          role="alert"
          aria-live="polite"
          className="rounded-xl border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-300"
        >
          {error}
        </div>
      )}

      <select
        value={companyId}
        onChange={(event) =>
          setCompanyId(event.target.value)
        }
        disabled={loading}
        aria-label={t("companyLabel")}
        required
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {t("selectCompany")}
        </option>

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
        onChange={(event) =>
          setExpertId(event.target.value)
        }
        disabled={loading}
        aria-label={t("expertLabel")}
        className="w-full rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="">
          {t("noExpert")}
        </option>

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
        onChange={(event) =>
          setMessage(event.target.value)
        }
        rows={4}
        disabled={loading}
        required
        placeholder={t("messagePlaceholder")}
        aria-label={t("messageLabel")}
        className="w-full resize-y rounded-xl border border-slate-800 bg-slate-950 px-4 py-3 outline-none focus:border-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
      />

      <input
        value={price}
        onChange={(event) =>
          setPrice(event.target.value)
        }
        type="text"
        inputMode="decimal"
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