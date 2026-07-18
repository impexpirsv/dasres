import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";
import EmptyState from "../../components/EmptyState";
import Image from "next/image";
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

export default async function MyExpertsPage() {
  const user = await requireUser();

  const t = await getTranslations("dashboardMyExperts");

  const locale = await getLocale();

  const experts = await prisma.expert.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      id: "desc",
    },
  });

  const verifiedExperts = experts.filter(
    (expert) => expert.verificationStatus === "VERIFIED",
  ).length;

  const pendingExperts = experts.filter(
    (expert) => expert.verificationStatus === "PENDING",
  ).length;

  const rejectedExperts = experts.filter(
    (expert) => expert.verificationStatus === "REJECTED",
  ).length;

  const premiumExperts = experts.filter(
    (expert) => expert.planType !== "FREE",
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

  const stats = [
    {
      key: "total",
      label: t("stats.total"),
      value: experts.length,
      borderClass: "border-blue-500",
      textClass: "text-blue-400",
    },
    {
      key: "verified",
      label: t("stats.verified"),
      value: verifiedExperts,
      borderClass: "border-emerald-500",
      textClass: "text-emerald-400",
    },
    {
      key: "pending",
      label: t("stats.pending"),
      value: pendingExperts,
      borderClass: "border-yellow-500",
      textClass: "text-yellow-400",
    },
    {
      key: "rejected",
      label: t("stats.rejected"),
      value: rejectedExperts,
      borderClass: "border-red-500",
      textClass: "text-red-400",
    },
    {
      key: "premium",
      label: t("stats.premium"),
      value: premiumExperts,
      borderClass: "border-purple-500",
      textClass: "text-purple-400",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">{t("title")}</h1>

            <p className="mt-3 text-slate-400">{t("description")}</p>
          </div>

          <Link
            href="/dashboard/experts/new"
            className="rounded-xl bg-blue-600 px-5 py-3 text-center transition hover:bg-blue-700"
          >
            {t("addExpert")}
          </Link>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-5">
          {stats.map((stat) => (
            <div
              key={stat.key}
              className={`rounded-2xl border bg-slate-900 p-6 ${stat.borderClass}`}
            >
              <p className="text-sm text-slate-400">{stat.label}</p>

              <p className={`mt-2 text-4xl font-bold ${stat.textClass}`}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>

        {experts.length === 0 ? (
          <EmptyState
            icon="👨‍💼"
            title={t("empty.title")}
            description={t("empty.description")}
            buttonText={t("empty.button")}
            buttonHref="/dashboard/experts/new"
          />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {experts.map((expert) => (
              <Link
                key={expert.id}
                href={`/dashboard/experts/${expert.id}`}
                className="group rounded-3xl border border-slate-800 bg-slate-900 p-6 transition hover:border-blue-500"
              >
                <div className="flex items-start gap-4">
                  {expert.imageUrl ? (
                    <Image
                      src={expert.imageUrl}
                      alt={expert.name}
                      width={80}
                      height={80}
                      className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                    />
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-3xl">
                      👤
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h2 className="break-words text-2xl font-bold transition group-hover:text-blue-400">
                      {expert.name}
                    </h2>

                    <p className="mt-1 text-blue-400">{expert.specialty}</p>

                    <p className="mt-1 text-slate-400">{expert.country}</p>
                  </div>
                </div>

                {expert.experience && (
                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-500">
                    {expert.experience}
                  </p>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getVerificationClass(
                      expert.verificationStatus,
                    )}`}
                  >
                    {getVerificationLabel(expert.verificationStatus)}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${getPlanClass(
                      expert.planType,
                    )}`}
                  >
                    {getPlanLabel(expert.planType)}
                  </span>

                  <span
                    className={`rounded-full px-3 py-1 text-xs ${getStatusClass(
                      expert.status,
                    )}`}
                  >
                    {getStatusLabel(expert.status)}
                  </span>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-slate-800 pt-5">
                  <span className="text-xs text-slate-500">
                    {t("created", {
                      date: expert.createdAt.toLocaleDateString(locale),
                    })}
                  </span>

                  <span className="text-sm text-blue-400 group-hover:underline">
                    {t("viewExpert")}
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
