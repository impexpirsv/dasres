import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

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

export default async function MyCompaniesPage() {
  const user = await requireUser();

  const companies = await prisma.company.findMany({
    where: {
      ownerId: user.id,
    },
    orderBy: {
      id: "desc",
    },
  });

  const verifiedCompanies = companies.filter(
    (company) => company.verificationStatus === "VERIFIED"
  ).length;

  const pendingCompanies = companies.filter(
    (company) => company.verificationStatus === "PENDING"
  ).length;

  const rejectedCompanies = companies.filter(
    (company) => company.verificationStatus === "REJECTED"
  ).length;

  const premiumCompanies = companies.filter(
    (company) => company.planType !== "FREE"
  ).length;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-5xl font-bold">
              My Companies
            </h1>

            <p className="text-slate-400 mt-3">
              Manage your owned company profiles, verification status and plan visibility.
            </p>
          </div>

          <Link
            href="/dashboard/companies/new"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-center"
          >
            Add Company
          </Link>
        </div>

        <div className="grid md:grid-cols-5 gap-6 mb-10">
          <div className="bg-slate-900 border border-blue-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Total
            </p>

            <p className="text-4xl font-bold text-blue-400 mt-2">
              {companies.length}
            </p>
          </div>

          <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Verified
            </p>

            <p className="text-4xl font-bold text-emerald-400 mt-2">
              {verifiedCompanies}
            </p>
          </div>

          <div className="bg-slate-900 border border-yellow-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Pending
            </p>

            <p className="text-4xl font-bold text-yellow-400 mt-2">
              {pendingCompanies}
            </p>
          </div>

          <div className="bg-slate-900 border border-red-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Rejected
            </p>

            <p className="text-4xl font-bold text-red-400 mt-2">
              {rejectedCompanies}
            </p>
          </div>

          <div className="bg-slate-900 border border-purple-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">
              Premium
            </p>

            <p className="text-4xl font-bold text-purple-400 mt-2">
              {premiumCompanies}
            </p>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-slate-400">
            You do not own any companies yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {companies.map((company) => (
              <Link
                key={company.id}
                href={`/companies/${company.id}`}
                className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500 transition"
              >
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getVerificationClass(
                      company.verificationStatus
                    )}`}
                  >
                    {company.verificationStatus}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanClass(
                      company.planType
                    )}`}
                  >
                    {company.planType}
                  </span>

                  <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs">
                    {company.status}
                  </span>
                </div>

                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition">
                  {company.name}
                </h2>

                <p className="text-blue-400 mb-2">
                  {company.category}
                </p>

                <p className="text-slate-400 mb-5">
                  {company.country}
                </p>

                <p className="text-slate-500 text-sm line-clamp-2">
                  {company.description}
                </p>

                <div className="mt-6 pt-5 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs text-slate-500">
                    Created:{" "}
                    {company.createdAt.toLocaleDateString()}
                  </span>

                  <span className="text-blue-400 text-sm group-hover:underline">
                    View Company →
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