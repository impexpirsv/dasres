"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { Locale } from "../../lib/locale";

import HeroGlobe from "./homepage/HeroGlobe";

export default function Hero({ locale, localized }: { locale: Locale; localized: boolean }) {
  const t = useTranslations("hero");

  return (
    <section className="relative isolate overflow-hidden border-b border-slate-800/80">
      <div className="absolute inset-0 -z-20 bg-slate-950" />
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgba(37,99,235,0.25),transparent_34%),radial-gradient(circle_at_82%_55%,rgba(6,182,212,0.16),transparent_34%),linear-gradient(to_bottom,transparent,rgba(2,6,23,0.72))]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent_88%)]" />

      <div className="ui-container grid min-h-[calc(100svh-5rem)] items-center gap-10 py-14 sm:py-20 lg:grid-cols-[minmax(0,0.92fr)_minmax(26rem,1.08fr)] lg:gap-8 lg:py-24 xl:gap-16">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-6 inline-flex max-w-full items-center gap-3 rounded-full border border-blue-400/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold leading-5 text-blue-200 backdrop-blur sm:px-5">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" aria-hidden="true" />
            <span className="break-words">{t("eyebrow")}</span>
          </div>

          <h1 className="max-w-3xl text-balance text-[clamp(2.75rem,8vw,5.5rem)] font-extrabold leading-[1.02] tracking-[-0.035em] text-white">
            {t("titleLine1")}
            <span className="mt-2 block bg-gradient-to-r from-blue-300 via-cyan-300 to-emerald-300 bg-clip-text text-transparent">
              {t("titleLine2")}
            </span>
          </h1>

          <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-slate-300 sm:text-xl sm:leading-9">
            {t("description")}
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/register" className="ui-button ui-button-primary min-h-14 px-7 text-base sm:px-8">
              {t("join")}
            </Link>
            <Link href={localized ? `/${locale}/experts` : "/experts"} className="ui-button ui-button-ghost min-h-14 px-7 text-base text-slate-300 sm:px-8">
              {t("exploreExperts")} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[42rem] lg:max-w-none" data-future-globe-slot="implemented">
          <div className="absolute inset-x-[12%] bottom-[5%] h-[18%] rounded-full bg-cyan-400/15 blur-3xl" aria-hidden="true" />
          <HeroGlobe label={t("platformValue")} />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 hidden justify-center sm:flex" aria-hidden="true">
        <span className="homepage-scroll-cue flex h-10 w-6 justify-center rounded-full border border-slate-600/70 pt-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
        </span>
      </div>
    </section>
  );
}
