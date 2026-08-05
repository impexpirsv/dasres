"use client";

import { useLocale, useTranslations } from "next-intl";

type TimelineStep = {
  id: number;
  title: string;
  completed: boolean;
  completedAt: Date | string | null;
};

export default function ProjectTimeline({
  steps,
}: {
  steps: TimelineStep[];
}) {
  const t = useTranslations("projectTimeline");
  const locale = useLocale();

  function formatCompletedDate(
    value: Date | string | null,
  ) {
    if (!value) {
      return t("pending");
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("unknownDate");
    }

    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  return (
    <section className="workspace-panel">
      <h2 className="mb-5 text-2xl font-bold text-white">
        {t("title")}
      </h2>

      {steps.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-950 p-8 text-center text-sm text-slate-500">
          {t("emptyState")}
        </div>
      ) : (
        <ol className="space-y-4">
          {steps.map((step, index) => (
            <li
              key={step.id}
              className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3 sm:gap-4 sm:p-4"
            >
              <div
                aria-hidden="true"
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  step.completed
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-800 text-slate-400"
                }`}
              >
                {step.completed ? "✓" : index + 1}
              </div>

              <div className="min-w-0">
                <p className="break-words font-semibold text-white">
               {t.has(`steps.${step.title}`)
  ? t(`steps.${step.title}`)
  : step.title}
                </p>

                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                  <span>
                    {step.completed
                      ? t("completed")
                      : t("pending")}
                  </span>

                  <span aria-hidden="true">·</span>

                  {step.completedAt ? (
                    <time
                      dateTime={
                        Number.isNaN(
                          new Date(
                            step.completedAt,
                          ).getTime(),
                        )
                          ? undefined
                          : new Date(
                              step.completedAt,
                            ).toISOString()
                      }
                    >
                      {formatCompletedDate(
                        step.completedAt,
                      )}
                    </time>
                  ) : (
                    <span>{t("notCompletedYet")}</span>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
