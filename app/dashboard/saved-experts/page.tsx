import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import EmptyState from "../../components/EmptyState";

export default async function SavedExpertsPage() {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardSavedExperts",
  );

  const savedExperts =
    await prisma.savedExpert.findMany({
      where: {
        userId: user.id,
      },
      include: {
        expert: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <h1 className="text-4xl font-bold">
            {t("title")}
          </h1>

          <p className="mt-3 text-slate-400">
            {t("description")}
          </p>
        </div>

        {savedExperts.length === 0 ? (
          <EmptyState
            icon="👨‍💼"
            title={t("empty.title")}
            description={t("empty.description")}
            buttonText={t("empty.button")}
            buttonHref="/dashboard/experts"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {savedExperts.map((saved) => (
              <div
                key={saved.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <h2 className="mb-2 text-2xl font-semibold">
                  {saved.expert.name}
                </h2>

                <p className="text-slate-400">
                  {saved.expert.specialty}
                </p>

                <p className="mt-2 text-slate-500">
                  {saved.expert.country}
                </p>

                <div className="mt-6">
                  <Link
                    href={`/dashboard/experts/${saved.expert.id}`}
                    className="inline-block rounded-xl bg-blue-600 px-4 py-2 transition hover:bg-blue-700"
                  >
                    {t("viewProfile")}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}