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
    <section className="relative overflow-hidden border-y border-slate-800 bg-slate-900 py-28">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.14),_transparent_32%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.1),_transparent_34%)]" />

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="grid items-start gap-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="lg:sticky lg:top-28">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-sm text-blue-300">
              {t("eyebrow")}
            </div>

            <h2 className="mb-6 text-4xl font-black leading-tight md:text-6xl">
              {t("titleLine1")}

              <span className="block bg-gradient-to-r from-blue-400 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                {t("titleLine2")}
              </span>
            </h2>

            <p className="mb-8 text-lg leading-8 text-slate-400">
              {t("description")}
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <p dir="ltr" className="text-3xl font-bold text-blue-400">
                  1
                </p>

                <p className="mt-2 text-slate-400">
                  {t("unifiedWorkflow")}
                </p>
              </div>

              <div className="rounded-3xl border border-slate-800 bg-slate-950/70 p-5">
                <p dir="ltr" className="text-3xl font-bold text-emerald-400">
                  360°
                </p>

                <p className="mt-2 text-slate-400">
                  {t("caseVisibility")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="group rounded-3xl border border-slate-800 bg-slate-950/80 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/60 hover:shadow-2xl hover:shadow-blue-500/10"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="text-4xl">{item.icon}</div>

                  <span
                    dir="ltr"
                    className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-400 group-hover:border-blue-500/60 group-hover:text-blue-300"
                  >
                    {item.step}
                  </span>
                </div>

                <h3 className="mb-4 text-2xl font-bold">
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