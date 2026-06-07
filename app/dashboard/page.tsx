import DashboardSidebar from "../components/DashboardSidebar";
import ProtectedRoute from "../components/ProtectedRoute";
import { prisma } from "../../lib/prisma";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
export default async function DashboardPage() {
  const cookieStore = await cookies();
const userId = cookieStore.get("dasres_user_id")?.value;

if (!userId) {
  redirect("/login");
}

const user = await prisma.user.findUnique({
  where: {
    id: Number(userId),
  },
});

if (!user) {
  redirect("/login");
}

  const usersCount =
    await prisma.user.count();

  const expertsCount =
    await prisma.expert.count();

  const companiesCount =
    await prisma.company.count();

  const opportunitiesCount =
    await prisma.opportunity.count();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-950 text-white flex">
        <DashboardSidebar />

        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-6 py-20">

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8">
              <h2 className="text-2xl font-bold mb-4">
                User Profile
              </h2>

              <p>
                <strong>Name:</strong> {user?.name}
              </p>

              <p>
                <strong>Email:</strong> {user?.email}
              </p>

              <p>
                <strong>Role:</strong> {user?.role}
              </p>
            </div>

            <h1 className="text-5xl font-bold mb-4">
              Dashboard
            </h1>

            <p className="text-slate-400 mb-12">
              Manage your Dasres account, profiles and trade activities.
            </p>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-semibold mb-3">
                  Experts
                </h2>

                <div className="text-5xl font-bold text-blue-400">
                  {expertsCount}
                </div>

                <p className="text-slate-400 mt-3">
                  Verified experts available
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-semibold mb-3">
                  Companies
                </h2>

                <div className="text-5xl font-bold text-blue-400">
                  {companiesCount}
                </div>

                <p className="text-slate-400 mt-3">
                  Registered companies
                </p>
              </div>

              <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                <h2 className="text-xl font-semibold mb-3">
                  Opportunities
                </h2>

                <div className="text-5xl font-bold text-blue-400">
                  {opportunitiesCount}
                </div>

                <p className="text-slate-400 mt-3">
                  Active trade opportunities
                </p>
              </div>
            </div>

            {user?.role === "admin" && (
              <div className="mt-12">
                <h2 className="text-3xl font-bold mb-6">
                  Admin Panel
                </h2>

                <div className="grid md:grid-cols-4 gap-6">

                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-semibold">
                      Users
                    </h3>

                    <div className="text-4xl font-bold text-green-400 mt-3">
                      {usersCount}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-semibold">
                      Experts
                    </h3>

                    <div className="text-4xl font-bold text-blue-400 mt-3">
                      {expertsCount}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-semibold">
                      Companies
                    </h3>

                    <div className="text-4xl font-bold text-yellow-400 mt-3">
                      {companiesCount}
                    </div>
                  </div>

                  <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
                    <h3 className="text-lg font-semibold">
                      Opportunities
                    </h3>

                    <div className="text-4xl font-bold text-purple-400 mt-3">
                      {opportunitiesCount}
                    </div>
                  </div>

                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}