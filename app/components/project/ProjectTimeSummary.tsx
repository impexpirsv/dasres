import { getTranslations } from "next-intl/server";

export default async function ProjectTimeSummary({
  estimated,
  logged,
  remaining,
}: {
  estimated: number;
  logged: number;
  remaining: number;
}) {
  const t = await getTranslations("projectTimeSummary");

  const percent =
    estimated === 0
      ? 0
      : Math.min(100, Math.round((logged / estimated) * 100));

  return (
    <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">
            {t("title")}
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            {t("description")}
          </p>
        </div>

        <span className="rounded-full bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-300">
          {percent}% {t("logged")}
        </span>
      </div>

      <div className="mt-6 h-3 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{
            width: `${percent}%`,
          }}
        />
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-xs text-slate-500">
            {t("estimated")}
          </p>

          <p className="mt-2 text-3xl font-bold text-white">
            {estimated}h
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-xs text-slate-500">
            {t("logged")}
          </p>

          <p className="mt-2 text-3xl font-bold text-green-400">
            {logged}h
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
          <p className="text-xs text-slate-500">
            {t("remaining")}
          </p>

          <p className="mt-2 text-3xl font-bold text-yellow-400">
            {remaining}h
          </p>
        </div>

        <div className="mt-8">
          <p className="mb-3 text-sm font-semibold text-slate-300">
            {t("distribution")}
          </p>

          <div className="space-y-4">
            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{t("logged")}</span>

                <span>{logged}h</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-green-500"
                  style={{
                    width: `${
                      estimated === 0
                        ? 0
                        : Math.min(100, (logged / estimated) * 100)
                    }%`,
                  }}
                />
              </div>
            </div>

            <div>
              <div className="mb-1 flex justify-between text-xs text-slate-500">
                <span>{t("remaining")}</span>

                <span>{remaining}h</span>
              </div>

              <div className="h-3 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full rounded-full bg-yellow-500"
                  style={{
                    width: `${
                      estimated === 0
                        ? 0
                        : Math.min(100, (remaining / estimated) * 100)
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}