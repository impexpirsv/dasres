"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export default function SaveCompanyButton({
  companyId,
  initialSaved,
}: {
  companyId: number;
  initialSaved: boolean;
}) {
  const t = useTranslations("saveCompanyButton");

  const [saved, setSaved] = useState(initialSaved);

  async function toggleSave() {
    const response = await fetch(
      `/api/companies/${companyId}/save`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    setSaved(data.saved);
  }

  return (
    <button
      onClick={toggleSave}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition ${
        saved
          ? "bg-yellow-500 text-black"
          : "bg-slate-800 text-white"
      }`}
    >
      {saved ? t("saved") : t("save")}
    </button>
  );
}