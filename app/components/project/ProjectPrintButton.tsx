"use client";

import { useTranslations } from "next-intl";

export default function ProjectPrintButton() {
  const t = useTranslations(
    "projectPrintButton",
  );

  function handlePrint() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      aria-label={t("ariaLabel")}
      title={t("tooltip")}
      className="rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-bold text-blue-300 transition hover:bg-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      🖨️ {t("button")}
    </button>
  );
}