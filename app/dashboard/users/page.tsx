import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";
import MakeAdminButton from "../../components/MakeAdminButton";
import DeleteUserButton from "../../components/DeleteUserButton";
import ChangePlanButton from "../../components/ChangePlanButton";

function getPlanBadge(planType: string) {
  if (planType === "ENTERPRISE") {
    return "bg-purple-600 text-white";
  }

  if (planType === "DIAMOND") {
    return "bg-cyan-600 text-black";
  }

  if (planType === "GOLD") {
    return "bg-yellow-600 text-black";
  }

  return "bg-slate-700 text-slate-200";
}

export default async function UsersPage() {
  await requireAdmin();

  const locale = await getLocale();
  const t = await getTranslations("adminUsers.list");

  const users = await prisma.user.findMany({
    orderBy: {
      id: "desc",
    },
  });

  const adminsCount = users.filter(
    (user) => user.role === "admin",
  ).length;

  const normalUsersCount =
    users.length - adminsCount;

  const freeUsersCount = users.filter(
    (user) => user.planType === "FREE",
  ).length;

  const goldUsersCount = users.filter(
    (user) => user.planType === "GOLD",
  ).length;

  const diamondUsersCount = users.filter(
    (user) => user.planType === "DIAMOND",
  ).length;

  const enterpriseUsersCount = users.filter(
    (user) => user.planType === "ENTERPRISE",
  ).length;

  const paidPlansCount =
    goldUsersCount +
    diamondUsersCount +
    enterpriseUsersCount;

  function getRoleLabel(role: string) {
    if (role === "admin") {
      return t("roles.admin");
    }

    return t("roles.user");
  }

  function getPlanLabel(planType: string) {
    switch (planType) {
      case "FREE":
        return t("plans.free");

      case "GOLD":
        return t("plans.gold");

      case "DIAMOND":
        return t("plans.diamond");

      case "ENTERPRISE":
        return t("plans.enterprise");

      default:
        return planType;
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20">
        <div className="mb-10">
          <h1 className="mb-4 text-5xl font-bold">
            {t("title")}
          </h1>

          <p className="text-slate-400">
            {t("description")}
          </p>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-blue-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.totalUsers")}
            </p>

            <p className="mt-2 text-4xl font-bold text-blue-400">
              {users.length}
            </p>
          </div>

          <div className="rounded-2xl border border-green-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.admins")}
            </p>

            <p className="mt-2 text-4xl font-bold text-green-400">
              {adminsCount}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.users")}
            </p>

            <p className="mt-2 text-4xl font-bold text-slate-200">
              {normalUsersCount}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500 bg-slate-900 p-6">
            <p className="text-sm text-slate-400">
              {t("stats.paidPlans")}
            </p>

            <p className="mt-2 text-4xl font-bold text-yellow-400">
              {paidPlansCount}
            </p>
          </div>
        </div>

        <div className="mb-10 grid gap-6 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              {t("plans.free")}
            </p>

            <p className="mt-2 text-3xl font-bold text-slate-200">
              {freeUsersCount}
            </p>
          </div>

          <div className="rounded-2xl border border-yellow-500 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              {t("plans.gold")}
            </p>

            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {goldUsersCount}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-500 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              {t("plans.diamond")}
            </p>

            <p className="mt-2 text-3xl font-bold text-cyan-400">
              {diamondUsersCount}
            </p>
          </div>

          <div className="rounded-2xl border border-purple-500 bg-slate-900 p-5">
            <p className="text-sm text-slate-400">
              {t("plans.enterprise")}
            </p>

            <p className="mt-2 text-3xl font-bold text-purple-400">
              {enterpriseUsersCount}
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900">
          <div className="border-b border-slate-800 p-6">
            <h2 className="text-2xl font-bold">
              {t("accountsTitle")}
            </h2>

            <p className="mt-2 text-slate-400">
              {t("accountsRegistered", {
                count: users.length,
              })}
            </p>
          </div>

          <div className="workspace-horizontal-scroll overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  <th className="p-4 text-start">
                    {t("table.id")}
                  </th>

                  <th className="p-4 text-start">
                    {t("table.user")}
                  </th>

                  <th className="p-4 text-start">
                    {t("table.role")}
                  </th>

                  <th className="p-4 text-start">
                    {t("table.currentPlan")}
                  </th>

                  <th className="p-4 text-start">
                    {t("table.changePlan")}
                  </th>

                  <th className="p-4 text-start">
                    {t("table.created")}
                  </th>

                  <th className="p-4 text-start">
                    {t("table.actions")}
                  </th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-800 last:border-0 hover:bg-slate-800/40"
                  >
                    <td className="p-4 text-slate-400">
                      #{user.id}
                    </td>

                    <td className="p-4">
                      <p className="font-semibold">
                        {user.name || t("unnamedUser")}
                      </p>

                      <p className="text-sm text-slate-400">
                        {user.email}
                      </p>
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          user.role === "admin"
                            ? "bg-green-600 text-white"
                            : "bg-slate-700 text-slate-200"
                        }`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getPlanBadge(
                          user.planType,
                        )}`}
                      >
                        {getPlanLabel(user.planType)}
                      </span>
                    </td>

                    <td className="p-4">
                      <ChangePlanButton
                        userId={user.id}
                        currentPlan={user.planType}
                      />
                    </td>

                    <td className="p-4 text-sm text-slate-400">
                      {user.createdAt.toLocaleDateString(
                        locale,
                      )}
                    </td>

                    <td className="p-4">
                      <div className="flex gap-3">
                        {user.role !== "admin" && (
                          <>
                            <MakeAdminButton id={user.id} />
                            <DeleteUserButton id={user.id} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
