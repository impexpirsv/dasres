import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import EmptyState from "../../components/EmptyState";

function getVerificationClass(status: string) {
  switch (status) {
    case "VERIFIED":
      return "bg-emerald-600 text-white";

    case "REJECTED":
      return "bg-red-600 text-white";

    default:
      return "bg-yellow-600 text-black";
  }
}

function getPlanClass(planType: string) {
  switch (planType) {
    case "GOLD":
      return "bg-yellow-600 text-black";

    case "DIAMOND":
      return "bg-cyan-600 text-black";

    case "ENTERPRISE":
      return "bg-purple-600 text-white";

    default:
      return "bg-slate-700 text-slate-200";
  }
}

function getStatusClass(status: string) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-600/20 text-emerald-300";

    case "INACTIVE":
      return "bg-slate-700 text-slate-300";

    case "SUSPENDED":
      return "bg-red-600/20 text-red-300";

    default:
      return "bg-slate-800 text-slate-300";
  }
}

export default async function MyCompaniesPage() {
  const user = await requireUser();

  const t = await getTranslations(
    "dashboardMyCompanies",
  );

  const locale = await getLocale();

  const companies = await prisma.company.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      id: "desc",
    },
  });

  const verifiedCompanies = companies.filter(
    (company) =>
      company.verificationStatus === "VERIFIED",
  ).length;

  const pendingCompanies = companies.filter(
    (company) =>
      company.verificationStatus === "PENDING",
  ).length;

  const rejectedCompanies = companies.filter(
    (company) =>
      company.verificationStatus === "REJECTED",
  ).length;

  const premiumCompanies = companies.filter(
    (company) => company.planType !== "FREE",
  ).length;

  function getVerificationLabel(status: string) {
    switch (status) {
      case "VERIFIED":
        return t("verification.verified");

      case "REJECTED":
        return t("verification.rejected");

      default:
        return t("verification.pending");
    }
  }

  function getPlanLabel(planType: string) {
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

  function getStatusLabel(status: string) {
    switch (status) {
      case "ACTIVE":
        return t("statuses.active");

      case "INACTIVE":
        return t("statuses.inactive");

      case "SUSPENDED":
        return t("statuses.suspended");

      default:
        return status;
    }
  }
function getCategoryLabel(category: string) {
  switch (category) {
    case "General":
      return t("categories.general");

    case "Customs Clearance":
      return t("categories.customsClearance");

    case "Shipping":
      return t("categories.shipping");

    case "Inspection":
      return t("categories.inspection");

    case "Insurance":
      return t("categories.insurance");

    case "Sourcing":
      return t("categories.sourcing");

    case "Documentation":
      return t("categories.documentation");

    case "Payment":
      return t("categories.payment");

    default:
      return category;
  }
}
function getCountryLabel(country: string) {
  switch (country.toLowerCase()) {
    case "iran":
      return t("countries.iran");

    default:
      return country;
  }
}
  const stats = [
    {
      key: "total",
      label: t("stats.total"),
      value: companies.length,
      borderClass: "border-blue-500",
      textClass: "text-blue-400",
    },
    {
      key: "verified",
      label: t("stats.verified"),
      value: verifiedCompanies,
      borderClass: "border-emerald-500",
      textClass: "text-emerald-400",
    },
    {
      key: "pending",
      label: t("stats.pending"),
      value: pendingCompanies,
      borderClass: "border-yellow-500",
      textClass: "text-yellow-400",
    },
    {
      key: "rejected",
      label: t("stats.rejected"),
      value: rejectedCompanies,
      borderClass: "border-red-500",
      textClass: "text-red-400",
    },
    {
      key: "premium",
      label: t("stats.premium"),
      value: premiumCompanies,
      borderClass: "border-purple-500",
      textClass: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-5xl font-bold">
              {t("title")}
            </h1>

            <p className="mt-3 text-slate-400">
              {t("description")}
            </p>
          </div>

          <Link
            href="/dashboard/companies/new"
            className="rounded-xl bg-blue-600 px-5 py-3 text-center transition hover:bg-blue-700"
          >
            {t("addCompany")}
          </Link>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className={`rounded-2xl border bg-slate-900 p-6 ${stat.borderClass}`}
            >
              <p className="text-sm text-slate-400">
                {stat.label}
              </p>

              <p
                className={`mt-2 text-4xl font-bold ${stat.textClass}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {companies.length === 0 ? (
          <EmptyState
            icon="🏢"
            title={t("empty.title")}
            description={t("empty.description")}
            buttonText={t("empty.button")}
            buttonHref="/dashboard/companies/new"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/dashboard/companies/${company.id}`}
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
              >
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getVerificationClass(
                      company.verificationStatus,
                    )}`}
                  >
                    {getVerificationLabel(
                      company.verificationStatus,
                    )}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getPlanClass(
                      company.planType,
                    )}`}
                  >
                    {getPlanLabel(
                      company.planType,
                    )}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${getStatusClass(
                      company.status,
                    )}`}
                  >
                    {getStatusLabel(company.status)}
                  </span>
                </div>

                <h2 className="mb-2 text-2xl font-bold transition group-hover:text-blue-400">
                  {company.name}
                </h2>

                <p className="mb-2 text-blue-400">
               {getCategoryLabel(company.category)}
                </p>

                <p className="mb-5 text-slate-400">
                 {getCountryLabel(company.country)}
                </p>

                <p className="line-clamp-2 text-sm text-slate-500">
                  {company.description}
                </p>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
                  <span className="text-xs text-slate-500">
                    {t("created", {
                      date: company.createdAt.toLocaleDateString(
                        locale,
                      ),
                    })}
                  </span>

                  <span className="text-sm text-blue-400 group-hover:underline">
                    {t("viewCompany")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}