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

  const users = await prisma.user.findMany({
    orderBy: {
      id: "desc",
    },
  });

  const adminsCount = users.filter(
    (user) => user.role === "admin"
  ).length;

  const normalUsersCount =
    users.length - adminsCount;

  const freeUsersCount = users.filter(
    (user) => user.planType === "FREE"
  ).length;

  const goldUsersCount = users.filter(
    (user) => user.planType === "GOLD"
  ).length;

  const diamondUsersCount = users.filter(
    (user) => user.planType === "DIAMOND"
  ).length;

  const enterpriseUsersCount = users.filter(
    (user) => user.planType === "ENTERPRISE"
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10">
          <h1 className="text-5xl font-bold mb-4">
            Users Management
          </h1>

          <p className="text-slate-400">
            Manage user roles, plans and account access.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900 border border-blue-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Total Users
            </p>

            <p className="text-4xl font-bold text-blue-400 mt-2">
              {users.length}
            </p>
          </div>

          <div className="bg-slate-900 border border-green-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Admins
            </p>

            <p className="text-4xl font-bold text-green-400 mt-2">
              {adminsCount}
            </p>
          </div>

          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Users
            </p>

            <p className="text-4xl font-bold text-slate-200 mt-2">
              {normalUsersCount}
            </p>
          </div>

          <div className="bg-slate-900 border border-yellow-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Paid Plans
            </p>

            <p className="text-4xl font-bold text-yellow-400 mt-2">
              {goldUsersCount +
                diamondUsersCount +
                enterpriseUsersCount}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              FREE
            </p>

            <p className="text-3xl font-bold text-slate-200 mt-2">
              {freeUsersCount}
            </p>
          </div>

          <div className="bg-slate-900 border border-yellow-500 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              GOLD
            </p>

            <p className="text-3xl font-bold text-yellow-400 mt-2">
              {goldUsersCount}
            </p>
          </div>

          <div className="bg-slate-900 border border-cyan-500 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              DIAMOND
            </p>

            <p className="text-3xl font-bold text-cyan-400 mt-2">
              {diamondUsersCount}
            </p>
          </div>

          <div className="bg-slate-900 border border-purple-500 rounded-2xl p-5">
            <p className="text-slate-400 text-sm">
              ENTERPRISE
            </p>

            <p className="text-3xl font-bold text-purple-400 mt-2">
              {enterpriseUsersCount}
            </p>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-bold">
              User Accounts
            </h2>

            <p className="text-slate-400 mt-2">
              {users.length} account
              {users.length === 1 ? "" : "s"} registered
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-950/60">
                  <th className="text-left p-4">ID</th>
                  <th className="text-left p-4">User</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Current Plan</th>
                  <th className="text-left p-4">Change Plan</th>
                  <th className="text-left p-4">Created</th>
                  <th className="text-left p-4">Actions</th>
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
                        {user.name}
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
                        {user.role}
                      </span>
                    </td>

                    <td className="p-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getPlanBadge(
                          user.planType
                        )}`}
                      >
                        {user.planType}
                      </span>
                    </td>

                    <td className="p-4">
                      <ChangePlanButton
                        userId={user.id}
                        currentPlan={user.planType}
                      />
                    </td>

                    <td className="p-4 text-sm text-slate-400">
                      {user.createdAt.toLocaleDateString()}
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