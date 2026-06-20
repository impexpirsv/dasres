import { prisma } from "../../../lib/prisma";
import { requireAdmin } from "../../../lib/auth";
import VerificationCompanyActions from "../../components/VerificationCompanyActions";
import Link from "next/link";
import VerificationExpertActions from "../../components/VerificationExpertActions";
export default async function VerificationsPage() {
  await requireAdmin();

  const pendingCompanies = await prisma.company.findMany({
    where: {
      verificationStatus: "PENDING",
    },
    orderBy: {
      id: "desc",
    },
  });

  const pendingExperts = await prisma.expert.findMany({
    where: {
      verificationStatus: "PENDING",
    },
    orderBy: {
      id: "desc",
    },
  });

  const verifiedCompaniesCount = await prisma.company.count({
    where: {
      verificationStatus: "VERIFIED",
    },
  });

  const verifiedExpertsCount = await prisma.expert.count({
    where: {
      verificationStatus: "VERIFIED",
    },
  });

  const rejectedCompaniesCount = await prisma.company.count({
    where: {
      verificationStatus: "REJECTED",
    },
  });

  const rejectedExpertsCount = await prisma.expert.count({
    where: {
      verificationStatus: "REJECTED",
    },
  });

  const pendingCount = pendingCompanies.length + pendingExperts.length;

  const verifiedCount = verifiedCompaniesCount + verifiedExpertsCount;

  const rejectedCount = rejectedCompaniesCount + rejectedExpertsCount;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="mb-10">
        <h1 className="text-5xl font-bold mb-4">Verification Center</h1>

        <p className="text-slate-400">
          Review and manage company and expert verification requests.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-10">
        <div className="bg-slate-900 border border-yellow-500 rounded-2xl p-6">
          <div className="text-slate-400 text-sm">Pending</div>

          <div className="text-4xl font-bold text-yellow-400 mt-2">
            {pendingCount}
          </div>

          <p className="text-xs text-slate-500 mt-2">Companies + Experts</p>
        </div>

        <div className="bg-slate-900 border border-green-500 rounded-2xl p-6">
          <div className="text-slate-400 text-sm">Verified</div>

          <div className="text-4xl font-bold text-green-400 mt-2">
            {verifiedCount}
          </div>

          <p className="text-xs text-slate-500 mt-2">Approved profiles</p>
        </div>

        <div className="bg-slate-900 border border-red-500 rounded-2xl p-6">
          <div className="text-slate-400 text-sm">Rejected</div>

          <div className="text-4xl font-bold text-red-400 mt-2">
            {rejectedCount}
          </div>

          <p className="text-xs text-slate-500 mt-2">Rejected profiles</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-bold">Pending Companies</h2>

            <p className="text-slate-400 mt-2">
              Company profiles waiting for admin review.
            </p>
          </div>

          {pendingCompanies.length === 0 ? (
            <div className="p-6 text-slate-400">No pending companies.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {pendingCompanies.map((company) => (
                <div key={company.id} className="p-6 flex flex-col gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/companies/${company.id}`}
                        className="font-bold hover:text-blue-400"
                      >
                        {company.name}
                      </Link>

                      {company.planType !== "FREE" && (
                        <span className="text-xs rounded-full bg-slate-800 px-3 py-1 text-slate-200">
                          {company.planType}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 mt-1">
                      {company.country} • {company.category}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Created: {company.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  <VerificationCompanyActions companyId={company.id} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-slate-800">
            <h2 className="text-2xl font-bold">Pending Experts</h2>

            <p className="text-slate-400 mt-2">
              Expert profiles waiting for admin review.
            </p>
          </div>

          {pendingExperts.length === 0 ? (
            <div className="p-6 text-slate-400">No pending experts.</div>
          ) : (
            <div className="divide-y divide-slate-800">
              {pendingExperts.map((expert) => (
                <div key={expert.id} className="p-6 flex flex-col gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Link
                        href={`/experts/${expert.id}`}
                        className="font-bold hover:text-blue-400"
                      >
                        {expert.name}
                      </Link>

                      {expert.planType !== "FREE" && (
                        <span className="text-xs rounded-full bg-slate-800 px-3 py-1 text-slate-200">
                          {expert.planType}
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-slate-400 mt-1">
                      {expert.country} • {expert.specialty}
                    </p>

                    <p className="text-xs text-slate-500 mt-1">
                      Created: {expert.createdAt.toLocaleDateString()}
                    </p>
                  </div>

                  <VerificationExpertActions expertId={expert.id} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
