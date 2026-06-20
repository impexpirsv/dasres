"use client";

import { useActionState } from "react";

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
];

export default function CreateCaseForm({
  action,
}: {
  action: (
    previousState: CreateCaseState,
    formData: FormData
  ) => Promise<CreateCaseState>;
}) {
  const [state, formAction, isPending] = useActionState(
    action,
    {}
  );

  return (
    <form action={formAction} className="space-y-6">
      {state.error && (
        <div className="rounded-xl border border-red-700 bg-red-950/50 p-4 text-red-300">
          {state.error}
        </div>
      )}

      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Case Title
        </label>
        <input
          name="title"
          type="text"
          required
          placeholder="Need customs clearance in Dubai"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Case Category
        </label>

        <select
          name="category"
          defaultValue="General"
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        >
          {CASE_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <p className="text-xs text-slate-500 mt-2">
          This helps Dasres match the case with relevant companies and experts.
        </p>
      </div>

      <div>
        <label className="block text-sm text-slate-400 mb-2">
          Description
        </label>
        <textarea
          name="description"
          required
          rows={7}
          placeholder="Describe the shipment, service needed, country, documents, timeline, and any special requirements..."
          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 outline-none focus:border-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 px-6 py-3 rounded-xl font-semibold"
      >
        {isPending ? "Creating..." : "Create Case"}
      </button>
    </form>
  );
}