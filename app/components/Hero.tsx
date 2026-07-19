"use client";

import Link from "next/link";
import {
  useFormatter,
  useTranslations,
} from "next-intl";

export default function Hero() {
  const t = useTranslations("hero");
  const format = useFormatter();

  const proposalsCount = format.number(6);

  const trustPercentage = format.number(0.83, {
    style: "percent",
    maximumFractionDigits: 0,
  });

  const ratingValue = format.number(5, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(37,99,235,0.35),transparent_35%),radial-gradient(circle_at_85%_80%,rgba(6,182,212,0.2),transparent_35%)]" />

      <div className="absolute inset-0 bg-slate-950/85" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:py-32">

        <div>
          <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-medium text-blue-300 backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            {t("eyebrow")}
          </div>


          <h1 className="mb-6 text-5xl font-black leading-[1.15] tracking-tight md:text-7xl">
            {t("titleLine1")}

            <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              {t("titleLine2")}
            </span>
          </h1>


          <p className="mb-10 max-w-xl text-lg leading-8 text-slate-300 md:text-xl">
            {t("description")}
          </p>


          <div className="flex flex-col gap-4 sm:flex-row">

            <Link
              href="/register"
              className="rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 px-8 py-4 text-center font-bold text-white shadow-xl shadow-blue-600/25 transition hover:scale-[1.03] hover:shadow-blue-500/40"
            >
              {t("join")}
            </Link>


            <Link
              href="/experts"
              className="rounded-xl border border-slate-700 bg-slate-900/70 px-8 py-4 text-center font-semibold text-slate-200 transition hover:border-blue-500 hover:bg-slate-800"
            >
              {t("exploreExperts")}
            </Link>


            <Link
              href="/companies"
              className="rounded-xl border border-slate-700 bg-slate-900/70 px-8 py-4 text-center font-semibold text-slate-200 transition hover:border-cyan-500 hover:bg-slate-800"
            >
              {t("browseCompanies")}
            </Link>

          </div>
        </div>



        <div className="relative">

          <div className="absolute -inset-8 rounded-[3rem] bg-blue-500/20 blur-3xl" />


          <div className="relative rounded-[2.5rem] border border-slate-800 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl transition hover:-translate-y-1">

            <div className="rounded-3xl border border-slate-800 bg-slate-950 p-6">

              <div className="mb-6 flex items-start justify-between gap-4">

                <div>
                  <p className="text-sm text-slate-500">
                    {t("liveCaseLabel")}
                  </p>

                  <h2 className="mt-2 text-2xl font-bold">
                    {t("liveCaseTitle")}
                  </h2>
                </div>


                <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                  {t("verified")}
                </span>

              </div>


              <div className="grid grid-cols-3 gap-3">

                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-blue-500">
                  <p className="text-xs text-slate-500">
                    {t("proposals")}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-blue-400">
                    {proposalsCount}
                  </p>
                </div>


                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-emerald-500">
                  <p className="text-xs text-slate-500">
                    {t("trust")}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-emerald-400">
                    {trustPercentage}
                  </p>
                </div>


                <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 transition hover:border-yellow-500">
                  <p className="text-xs text-slate-500">
                    {t("status")}
                  </p>

                  <p className="mt-2 text-sm font-bold text-yellow-400">
                    {t("inProgress")}
                  </p>
                </div>

              </div>

            </div>



            <div className="mt-5 grid gap-5 sm:grid-cols-2">

              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-blue-500">

                <p className="text-sm text-slate-500">
                  {t("topCompany")}
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  Sina Customs
                </h3>

                <p className="mt-1 text-blue-400">
                  {t("customsClearance")}
                </p>

                <p className="mt-4 text-yellow-400">
                  ⭐ {t("rating", {
                    value: ratingValue,
                  })}
                </p>

              </div>


              <div className="rounded-3xl border border-slate-800 bg-slate-950 p-5 transition hover:-translate-y-1 hover:border-cyan-500">

                <p className="text-sm text-slate-500">
                  {t("topExpert")}
                </p>

                <h3 className="mt-2 text-xl font-bold">
                  Ahad Customs
                </h3>

                <p className="mt-1 text-cyan-400">
                  {t("tradeConsultant")}
                </p>

                <p className="mt-4 text-emerald-400">
                  ✓ {t("verified")}
                </p>

              </div>

            </div>

          </div>

        </div>

      </div>
    </section>
  );
}