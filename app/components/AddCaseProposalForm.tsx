"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

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

  const [message, setMessage] = useState("");
  const [price, setPrice] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [expertId, setExpertId] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitProposal(e: React.FormEvent) {
    e.preventDefault();

    if (!message.trim()) return;

    setLoading(true);

    await fetch(`/api/cases/${caseId}/proposals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        price,
        companyId,
        expertId,
      }),
    });

    setMessage("");
    setPrice("");
    setCompanyId("");
    setExpertId("");

    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={submitProposal} className="space-y-3 mb-6">
      <select
        value={companyId}
        onChange={(e) => setCompanyId(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
      >
        <option value="">Select company</option>
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>

      <select
        value={expertId}
        onChange={(e) => setExpertId(e.target.value)}
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
      >
        <option value="">Select expert optional</option>
        {experts.map((expert) => (
          <option key={expert.id} value={expert.id}>
            {expert.name}
          </option>
        ))}
      </select>

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={4}
        placeholder="Write proposal message..."
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
      />

      <input
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        type="text"
        placeholder="Price e.g. 1200 USD"
        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-xl disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Add Proposal"}
      </button>
    </form>
  );
}