import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import EmptyState from "../../components/EmptyState";

export default async function SavedCompaniesPage() {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardSavedCompanies",
  );

  const tc = await getTranslations("common.countries");
  const tcat = await getTranslations("common.categories");

  function translateCountry(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    return tc.has(normalized) ? tc(normalized) : tc.has(lower) ? tc(lower) : normalized;
  }

  function translateCategory(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    const underscored = lower.replaceAll(" ", "_");
    return tcat.has(normalized) ? tcat(normalized) : tcat.has(lower) ? tcat(lower) : tcat.has(underscored) ? tcat(underscored) : normalized;
  }

  const savedCompanies =
    await prisma.savedCompany.findMany({
      where: {
        userId: user.id,
      },
      include: {
        company: true,
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

        {savedCompanies.length === 0 ? (
          <EmptyState
            icon="🏢"
            title={t("empty.title")}
            description={t("empty.description")}
            buttonText={t("empty.button")}
            buttonHref="/dashboard/companies"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {savedCompanies.map((saved) => (
              <div
                key={saved.id}
                className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
              >
                <h2 className="mb-2 text-2xl font-semibold">
                  {saved.company.name}
                </h2>

                <p className="text-slate-400">
                  {translateCategory(saved.company.category)}
                </p>

                <p className="mt-2 text-slate-500">
                  {translateCountry(saved.company.country)}
                </p>

                <div className="mt-6">
                  <Link
                    href={`/dashboard/companies/${saved.company.id}`}
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