"use client";

import { useTranslations } from "next-intl";

export default function Services() {
  const t = useTranslations("services");

  const workflow = [
    {
      step: "01",
      title: t("steps.createCase.title"),
      icon: "📋",
      description: t("steps.createCase.description"),
    },
    {
      step: "02",
      title: t("steps.matchProviders.title"),
      icon: "🏢",
      description: t("steps.matchProviders.description"),
    },
    {
      step: "03",
      title: t("steps.receiveProposals.title"),
      icon: "🤝",
      description: t("steps.receiveProposals.description"),
    },
    {
      step: "04",
      title: t("steps.assignWinner.title"),
      icon: "✅",
      description: t("steps.assignWinner.description"),
    },
    {
      step: "05",
      title: t("steps.manageDelivery.title"),
      icon: "📁",
      description: t("steps.manageDelivery.description"),
    },
    {
      step: "06",
      title: t("steps.completeReview.title"),
      icon: "⭐",
      description: t("steps.completeReview.description"),
    },
  ];

  return (
    <section className="relative overflow-hidden border-y border-slate-800 bg-slate-950 py-28">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_20%,rgba(37,99,235,0.18),transparent_35%),radial-gradient(circle_at_90%_80%,rgba(16,185,129,0.12),transparent_35%)]" />


      <div className="relative mx-auto max-w-7xl px-6">

        <div className="grid items-start gap-16 lg:grid-cols-[0.85fr_1.15fr]">


          <div className="lg:sticky lg:top-28">

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-5 py-2 text-sm font-semibold text-blue-300 backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-blue-400" />
              {t("eyebrow")}
            </div>


            <h2 className="mb-6 text-4xl font-black leading-tight md:text-6xl">

              {t("titleLine1")}

              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                {t("titleLine2")}
              </span>

            </h2>


            <p className="mb-10 text-lg leading-8 text-slate-400">
              {t("description")}
            </p>



            <div className="grid gap-4 sm:grid-cols-2">

              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 transition hover:-translate-y-1 hover:border-blue-500/60">

                <p
                  dir="ltr"
                  className="text-4xl font-black text-blue-400"
                >
                  1
                </p>

                <p className="mt-3 text-sm text-slate-400">
                  {t("unifiedWorkflow")}
                </p>

              </div>



              <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 transition hover:-translate-y-1 hover:border-emerald-500/60">

                <p
                  dir="ltr"
                  className="text-4xl font-black text-emerald-400"
                >
                  360°
                </p>

                <p className="mt-3 text-sm text-slate-400">
                  {t("caseVisibility")}
                </p>

              </div>

            </div>

          </div>




          <div className="grid gap-5 md:grid-cols-2">

            {workflow.map((item) => (

              <div
                key={item.step}
                className="
                  group
                  relative
                  overflow-hidden
                  rounded-[2rem]
                  border
                  border-slate-800
                  bg-slate-900/70
                  p-7
                  transition-all
                  duration-300
                  hover:-translate-y-2
                  hover:border-blue-500/60
                  hover:shadow-2xl
                  hover:shadow-blue-500/10
                "
              >

                <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl transition group-hover:bg-blue-500/20" />



                <div className="relative mb-7 flex items-center justify-between">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-700 bg-slate-950 text-3xl">
                    {item.icon}
                  </div>


                  <span
                    dir="ltr"
                    className="
                      rounded-full
                      border
                      border-slate-700
                      bg-slate-950
                      px-4
                      py-1.5
                      text-sm
                      font-bold
                      text-slate-400
                      transition
                      group-hover:border-blue-500/60
                      group-hover:text-blue-300
                    "
                  >
                    {item.step}
                  </span>

                </div>



                <h3 className="mb-4 text-2xl font-black">
                  {item.title}
                </h3>


                <p className="leading-7 text-slate-400">
                  {item.description}
                </p>


              </div>

            ))}

          </div>


        </div>

      </div>

    </section>
  );
}