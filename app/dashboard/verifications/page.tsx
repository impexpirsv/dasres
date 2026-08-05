import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";
import VerificationCompanyActions from "../../components/VerificationCompanyActions";
import VerificationExpertActions from "../../components/VerificationExpertActions";

function getPlanLabel(
  planType: string,
  t: Awaited<
    ReturnType<typeof getTranslations>
  >,
) {
  switch (planType) {
    case "GOLD":
      return t("plans.gold");

    case "DIAMOND":
      return t("plans.diamond");

    case "ENTERPRISE":
      return t("plans.enterprise");

    default:
      return t("plans.free");
  }
}

export default async function VerificationsPage() {
  await requireAdmin();

  const t = await getTranslations(
    "dashboardVerifications",
  );

  const [locale, tc, tcat, ts] = await Promise.all([
    getLocale(),
    getTranslations("common.countries"),
    getTranslations("common.categories"),
    getTranslations("common.specialties"),
  ]);


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

  function translateSpecialty(value: string) {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    const underscored = lower.replaceAll(" ", "_");
    return ts.has(normalized) ? ts(normalized) : ts.has(lower) ? ts(lower) : ts.has(underscored) ? ts(underscored) : normalized;
  }

  const [
    pendingCompanies,
    pendingExperts,
    verifiedCompaniesCount,
    verifiedExpertsCount,
    rejectedCompaniesCount,
    rejectedExpertsCount,
  ] = await Promise.all([
    prisma.company.findMany({
      where: {
        verificationStatus: "PENDING",
      },
      orderBy: {
        id: "desc",
      },
    }),

    prisma.expert.findMany({
      where: {
        verificationStatus: "PENDING",
      },
      orderBy: {
        id: "desc",
      },
    }),

    prisma.company.count({
      where: {
        verificationStatus: "VERIFIED",
      },
    }),

    prisma.expert.count({
      where: {
        verificationStatus: "VERIFIED",
      },
    }),

    prisma.company.count({
      where: {
        verificationStatus: "REJECTED",
      },
    }),

    prisma.expert.count({
      where: {
        verificationStatus: "REJECTED",
      },
    }),
  ]);

  const pendingCount =
    pendingCompanies.length +
    pendingExperts.length;

  const verifiedCount =
    verifiedCompaniesCount +
    verifiedExpertsCount;

  const rejectedCount =
    rejectedCompaniesCount +
    rejectedExpertsCount;

  const stats = [
    {
      key: "pending",
      label: t("stats.pending.title"),
      value: pendingCount,
      description: t(
        "stats.pending.description",
      ),
      borderClass: "border-yellow-500",
      textClass: "text-yellow-400",
    },
    {
      key: "verified",
      label: t("stats.verified.title"),
      value: verifiedCount,
      description: t(
        "stats.verified.description",
      ),
      borderClass: "border-green-500",
      textClass: "text-green-400",
    },
    {
      key: "rejected",
      label: t("stats.rejected.title"),
      value: rejectedCount,
      description: t(
        "stats.rejected.description",
      ),
      borderClass: "border-red-500",
      textClass: "text-red-400",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <div className="mb-10">
        <h1 className="mb-4 text-5xl font-bold">
          {t("title")}
        </h1>

        <p className="text-slate-400">
          {t("description")}
        </p>
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.key}
            className={`rounded-2xl border bg-slate-900 p-6 ${stat.borderClass}`}
          >
            <div className="text-sm text-slate-400">
              {stat.label}
            </div>

            <div
              className={`mt-2 text-4xl font-bold ${stat.textClass}`}
            >
              {stat.value}
            </div>

            <p className="mt-2 text-xs text-slate-500">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-2xl font-bold">
              {t("companies.title")}
            </h2>

            <p className="mt-2 text-slate-400">
              {t("companies.description")}
            </p>
          </div>

          {pendingCompanies.length === 0 ? (
            <div className="p-6 text-slate-400">
              {t("companies.empty")}
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {pendingCompanies.map(
                (company) => (
                  <div
                    key={company.id}
                    className="flex flex-col gap-4 p-6"
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <Link
                          href={`/companies/${company.id}`}
                          className="font-bold hover:text-blue-400"
                        >
                          {company.name}
                        </Link>

                        {company.planType !==
                          "FREE" && (
                          <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                            {getPlanLabel(
                              company.planType,
                              t,
                            )}
                          </span>
                        )}
                      </div>

                      <p className="mt-1 text-sm text-slate-400">
                        {translateCountry(company.country)} •{" "}
                        {translateCategory(company.category)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {t("created", {
                          date: company.createdAt.toLocaleDateString(
                            locale,
                          ),
                        })}
                      </p>
                    </div>

                    <VerificationCompanyActions
                      companyId={company.id}
                    />
                  </div>
                ),
              )}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-2xl font-bold">
              {t("experts.title")}
            </h2>

            <p className="mt-2 text-slate-400">
              {t("experts.description")}
            </p>
          </div>

          {pendingExperts.length === 0 ? (
            <div className="p-6 text-slate-400">
              {t("experts.empty")}
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {pendingExperts.map((expert) => (
                <div
                  key={expert.id}
                  className="flex flex-col gap-4 p-6"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/experts/${expert.id}`}
                        className="font-bold hover:text-blue-400"
                      >
                        {expert.name}
                      </Link>

                      {expert.planType !==
                        "FREE" && (
                        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                          {getPlanLabel(
                            expert.planType,
                            t,
                          )}
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-sm text-slate-400">
                      {translateCountry(expert.country)} •{" "}
                      {translateSpecialty(expert.specialty)}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {t("created", {
                        date: expert.createdAt.toLocaleDateString(
                          locale,
                        ),
                      })}
                    </p>
                  </div>

                  <VerificationExpertActions
                    expertId={expert.id}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}