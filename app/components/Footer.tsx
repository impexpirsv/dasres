"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="relative overflow-hidden border-t border-slate-800 bg-slate-950">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_30%),radial-gradient(circle_at_bottom_right,rgba(16,185,129,0.12),transparent_35%)]" />


      <div className="relative mx-auto max-w-7xl px-6 py-20">


        <div className="mb-16 overflow-hidden rounded-[2.5rem] border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-950 p-8 shadow-2xl md:p-12">

          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">

            <div>

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {t("ctaEyebrow")}
              </div>


              <h2 className="max-w-3xl text-4xl font-black leading-tight md:text-6xl">
                {t("ctaTitle")}
              </h2>


              <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-400">
                {t("ctaDescription")}
              </p>

            </div>



            <div className="flex flex-col gap-3 sm:flex-row">

              <Link
                href="/dashboard/cases/new"
                className="
                  rounded-xl
                  bg-gradient-to-r
                  from-blue-600
                  to-cyan-600
                  px-7
                  py-3.5
                  text-center
                  font-bold
                  text-white
                  transition
                  hover:scale-105
                "
              >
                {t("createCase")}
              </Link>


              <Link
                href="/companies"
                className="
                  rounded-xl
                  border
                  border-slate-700
                  bg-slate-900
                  px-7
                  py-3.5
                  text-center
                  font-bold
                  text-slate-200
                  transition
                  hover:border-cyan-500
                  hover:text-white
                "
              >
                {t("exploreNetwork")}
              </Link>

            </div>

          </div>

        </div>




        <div className="grid gap-10 md:grid-cols-4">


          <div>

            <h2 className="mb-5 bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-4xl font-black text-transparent">
              DASRES
            </h2>


            <p className="leading-7 text-slate-400">
              {t("description")}
            </p>

          </div>




          <div>

            <h3 className="mb-5 text-lg font-bold">
              {t("platformTitle")}
            </h3>


            <div className="flex flex-col gap-3 text-slate-400">

              <Link
                href="/companies"
                className="transition hover:text-blue-300"
              >
                {t("companies")}
              </Link>

              <Link
                href="/experts"
                className="transition hover:text-blue-300"
              >
                {t("experts")}
              </Link>

              <Link
                href="/opportunities"
                className="transition hover:text-blue-300"
              >
                {t("opportunities")}
              </Link>

              <Link
                href="/dashboard"
                className="transition hover:text-blue-300"
              >
                {t("dashboard")}
              </Link>

            </div>

          </div>





          <div>

            <h3 className="mb-5 text-lg font-bold">
              {t("networkTitle")}
            </h3>


            <div className="flex flex-col gap-3 text-slate-400">

              <Link
                href="/dashboard/top-companies"
                className="transition hover:text-blue-300"
              >
                {t("topCompanies")}
              </Link>

              <Link
                href="/dashboard/top-experts"
                className="transition hover:text-blue-300"
              >
                {t("topExperts")}
              </Link>

              <Link
                href="/dashboard/open-cases"
                className="transition hover:text-blue-300"
              >
                {t("openCases")}
              </Link>

              <Link
                href="/dashboard/tickets"
                className="transition hover:text-blue-300"
              >
                {t("supportTickets")}
              </Link>

            </div>

          </div>





          <div>

            <h3 className="mb-5 text-lg font-bold">
              {t("trustSignalsTitle")}
            </h3>


            <div className="space-y-3">

              <p className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-300">
                ✓ {t("verifiedCompanies")}
              </p>

              <p className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-300">
                ✓ {t("trustedExperts")}
              </p>

              <p className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-300">
                ✓ {t("proposalWorkflow")}
              </p>

              <p className="rounded-xl border border-slate-800 bg-slate-900 px-4 py-3 text-slate-300">
                ✓ {t("reviewsReputation")}
              </p>

            </div>

          </div>


        </div>





        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 md:flex-row">

          <p className="text-sm text-slate-500">
            {t("copyright", {
              year: "2026",
            })}
          </p>


          <div className="rounded-full border border-slate-800 bg-slate-900 px-5 py-2 text-sm text-slate-400">
            {t("languagesAvailable")}
          </div>

        </div>


      </div>

    </footer>
  );
}