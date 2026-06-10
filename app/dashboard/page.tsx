import Link from "next/link";
import { prisma } from "../../lib/prisma";
import { requireUser } from "../../lib/auth";

export default async function DashboardPage() {
  const user = await requireUser();

  const usersCount =
  user.role === "admin"
    ? await prisma.user.count()
    : 0;
  const expertsCount = await prisma.expert.count();
  const companiesCount = await prisma.company.count();
  const opportunitiesCount =
    await prisma.opportunity.count();
  const casesCount =
  user.role === "admin"
    ? await prisma.tradeCase.count()
    : await prisma.tradeCase.count({
        where: {
          customerId: user.id,
        },
      });
  const latestExperts =
    await prisma.expert.findMany({
      orderBy: { id: "desc" },
      take: 5,
    });

  const latestCompanies =
    await prisma.company.findMany({
      orderBy: { id: "desc" },
      take: 5,
    });

  const latestOpportunities =
    await prisma.opportunity.findMany({
      orderBy: { id: "desc" },
      take: 5,
    });

  const latestUsers =
    user.role === "admin"
      ? await prisma.user.findMany({
          orderBy: { id: "desc" },
          take: 5,
        })
      : [];

  return (
    
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              User Profile
            </h2>

            <p>
              <strong>Name:</strong> {user.name}
            </p>

            <p>
              <strong>Email:</strong> {user.email}
            </p>

            <p>
              <strong>Role:</strong> {user.role}
            </p>
          </div>

          <h1 className="text-5xl font-bold mb-4">
            Dashboard
          </h1>

          <p className="text-slate-400 mb-12">
            Manage your Dasres account, profiles and trade activities.
          </p>

          <div className="grid md:grid-cols-4 gap-6">
            <Link
              href="/experts"
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
            >
              <h2 className="text-xl font-semibold mb-3">
                Experts
              </h2>
              <div className="text-5xl font-bold text-blue-400">
                {expertsCount}
              </div>
              <p className="text-slate-400 mt-3">
                Verified experts available
              </p>
            </Link>

            <Link
              href="/companies"
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
            >
              <h2 className="text-xl font-semibold mb-3">
                Companies
              </h2>
              <div className="text-5xl font-bold text-blue-400">
                {companiesCount}
              </div>
              <p className="text-slate-400 mt-3">
                Registered companies
              </p>
            </Link>

            <Link
              href="/opportunities"
              className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
            >
              <h2 className="text-xl font-semibold mb-3">
                Opportunities
              </h2>
              <div className="text-5xl font-bold text-blue-400">
                {opportunitiesCount}
              </div>
              <p className="text-slate-400 mt-3">
                Active trade opportunities
              </p>
            </Link>
            
            <Link
  href="/dashboard/cases"
  className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-cyan-500"
>
  <h2 className="text-xl font-semibold mb-3">
    Trade Cases
  </h2>
  <div className="text-5xl font-bold text-cyan-400">
    {casesCount}
  </div>
  <p className="text-slate-400 mt-3">
    Active trade projects
  </p>
</Link>
          </div>

          {user.role === "admin" && (
            <div className="mt-12">
              <h2 className="text-3xl font-bold mb-6">
                Admin Panel
              </h2>

              <div className="grid md:grid-cols-4 gap-6">
                <Link
                  href="/dashboard/users"
                  className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-green-500"
                >
                  <h3 className="text-lg font-semibold">
                    Users
                  </h3>
                  <div className="text-4xl font-bold text-green-400 mt-3">
                    {usersCount}
                  </div>
                </Link>

                <Link
                  href="/experts"
                  className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-blue-500"
                >
                  <h3 className="text-lg font-semibold">
                    Experts
                  </h3>
                  <div className="text-4xl font-bold text-blue-400 mt-3">
                    {expertsCount}
                  </div>
                </Link>

                <Link
                  href="/companies"
                  className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-yellow-500"
                >
                  <h3 className="text-lg font-semibold">
                    Companies
                  </h3>
                  <div className="text-4xl font-bold text-yellow-400 mt-3">
                    {companiesCount}
                  </div>
                </Link>

                <Link
                  href="/opportunities"
                  className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-purple-500"
                >
                  <h3 className="text-lg font-semibold">
                    Opportunities
                  </h3>
                  <div className="text-4xl font-bold text-purple-400 mt-3">
                    {opportunitiesCount}
                  </div>
                </Link>
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-6 mt-12">
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Latest Experts
                </h2>
                <Link
                  href="/experts"
                  className="text-blue-400 text-sm hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {latestExperts.map((expert) => (
                  <Link
                    key={expert.id}
                    href={`/experts/${expert.id}`}
                    className="block border-b border-slate-800 pb-3 last:border-0"
                  >
                    <p className="font-semibold">
                      {expert.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {expert.country} · {expert.specialty}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Latest Companies
                </h2>
                <Link
                  href="/companies"
                  className="text-blue-400 text-sm hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {latestCompanies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    className="block border-b border-slate-800 pb-3 last:border-0"
                  >
                    <p className="font-semibold">
                      {company.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {company.country} · {company.category}
                    </p>
                  </Link>
                ))}
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Latest Opportunities
                </h2>
                <Link
                  href="/opportunities"
                  className="text-blue-400 text-sm hover:underline"
                >
                  View all
                </Link>
              </div>

              <div className="space-y-4">
                {latestOpportunities.map((opportunity) => (
                  <Link
                    key={opportunity.id}
                    href={`/opportunities/${opportunity.id}`}
                    className="block border-b border-slate-800 pb-3 last:border-0"
                  >
                    <p className="font-semibold">
                      {opportunity.title}
                    </p>
                    <p className="text-sm text-slate-400">
                      {opportunity.country} · {opportunity.status}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {user.role === "admin" && (
            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 mt-12">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  Latest Users
                </h2>
                <Link
                  href="/dashboard/users"
                  className="text-blue-400 text-sm hover:underline"
                >
                  Manage users
                </Link>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
                {latestUsers.map((latestUser) => (
                  <div
                    key={latestUser.id}
                    className="bg-slate-950 border border-slate-800 rounded-xl p-4"
                  >
                    <p className="font-semibold">
                      {latestUser.name}
                    </p>
                    <p className="text-sm text-slate-400 truncate">
                      {latestUser.email}
                    </p>
                    <span className="inline-block mt-3 text-xs bg-slate-800 px-2 py-1 rounded">
                      {latestUser.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      
  );
}