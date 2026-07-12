"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-slate-950">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.12),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.08),_transparent_32%)]" />

      <div className="relative mx-auto max-w-7xl px-6 py-16">
        <div className="mb-14 rounded-[2rem] border border-slate-800 bg-slate-900/70 p-8 md:p-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-3 font-semibold text-blue-400">
                {t("ctaEyebrow")}
              </p>

              <h2 className="text-3xl font-black md:text-5xl">
                {t("ctaTitle")}
              </h2>

              <p className="mt-4 max-w-2xl leading-7 text-slate-400">
                {t("ctaDescription")}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/cases/new"
                className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold hover:bg-blue-700"
              >
                {t("createCase")}
              </Link>

              <Link
                href="/companies"
                className="rounded-xl border border-slate-700 bg-slate-950 px-6 py-3 text-center font-semibold hover:border-cyan-500"
              >
                {t("exploreNetwork")}
              </Link>
            </div>
          </div>
        </div>

        <div className="grid gap-12 md:grid-cols-4">
          <div>
            <h2 className="mb-4 text-3xl font-black">
              DASRES
            </h2>

            <p className="leading-7 text-slate-400">
              {t("description")}
            </p>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-semibold">
              {t("platformTitle")}
            </h3>

            <div className="flex flex-col gap-3 text-slate-400">
              <Link href="/companies" className="hover:text-blue-300">
                {t("companies")}
              </Link>

              <Link href="/experts" className="hover:text-blue-300">
                {t("experts")}
              </Link>

              <Link href="/opportunities" className="hover:text-blue-300">
                {t("opportunities")}
              </Link>

              <Link href="/dashboard" className="hover:text-blue-300">
                {t("dashboard")}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-semibold">
              {t("networkTitle")}
            </h3>

            <div className="flex flex-col gap-3 text-slate-400">
              <Link
                href="/dashboard/top-companies"
                className="hover:text-blue-300"
              >
                {t("topCompanies")}
              </Link>

              <Link
                href="/dashboard/top-experts"
                className="hover:text-blue-300"
              >
                {t("topExperts")}
              </Link>

              <Link
                href="/dashboard/open-cases"
                className="hover:text-blue-300"
              >
                {t("openCases")}
              </Link>

              <Link
                href="/dashboard/tickets"
                className="hover:text-blue-300"
              >
                {t("supportTickets")}
              </Link>
            </div>
          </div>

          <div>
            <h3 className="mb-5 text-lg font-semibold">
              {t("trustSignalsTitle")}
            </h3>

            <div className="space-y-3 text-slate-400">
              <p>✓ {t("verifiedCompanies")}</p>
              <p>✓ {t("trustedExperts")}</p>
              <p>✓ {t("proposalWorkflow")}</p>
              <p>✓ {t("reviewsReputation")}</p>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">
          <p className="text-sm text-slate-500">
            {t("copyright", { year: "2026" })}
          </p>

          <div className="flex flex-wrap justify-center gap-5 text-sm text-slate-500">
            <span>{t("languagesAvailable")}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}