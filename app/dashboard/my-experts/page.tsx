import Link from "next/link";
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
export default async function MyExpertsPage() {
  const user = await requireUser();

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
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">My Experts</h1>

          <Link
            href="/dashboard/experts/new"
            className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl"
          >
            Add Expert
          </Link>
        </div>
        <div className="grid md:grid-cols-5 gap-6 mb-10">
          <div className="bg-slate-900 border border-blue-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Total</p>
            <p className="text-4xl font-bold text-blue-400 mt-2">
              {experts.length}
            </p>
          </div>

          <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Verified</p>
            <p className="text-4xl font-bold text-emerald-400 mt-2">
              {verifiedExperts}
            </p>
          </div>

          <div className="bg-slate-900 border border-yellow-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Pending</p>
            <p className="text-4xl font-bold text-yellow-400 mt-2">
              {pendingExperts}
            </p>
          </div>

          <div className="bg-slate-900 border border-red-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Rejected</p>
            <p className="text-4xl font-bold text-red-400 mt-2">
              {rejectedExperts}
            </p>
          </div>

          <div className="bg-slate-900 border border-purple-500 rounded-2xl p-6">
            <p className="text-slate-400 text-sm">Premium</p>
            <p className="text-4xl font-bold text-purple-400 mt-2">
              {premiumExperts}
            </p>
          </div>
        </div>
        {experts.length === 0 ? (
          <EmptyState
            icon="👨‍💼"
            title="No experts yet"
            description="Create your first expert profile to showcase your experience and receive trade requests."
            buttonText="Add Expert"
            href="/dashboard/experts/new"
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {experts.map((expert) => (
              <Link
                key={expert.id}
                href={`/dashboard/experts/${expert.id}`}
                className="group bg-slate-900 border border-slate-800 rounded-3xl p-6 hover:border-blue-500 transition"
              >
                <h2 className="text-2xl font-bold mb-2">{expert.name}</h2>

                <p className="text-blue-400 mb-2">{expert.specialty}</p>

                <p className="text-slate-400">{expert.country}</p>
                <p className="text-slate-500 mt-3 line-clamp-2">
                  {expert.experience}
                </p>
                <p className="text-slate-500 mt-3 line-clamp-2">
                  {expert.experience}
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getVerificationClass(
                      expert.verificationStatus,
                    )}`}
                  >
                    {expert.verificationStatus}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${getPlanClass(
                      expert.planType,
                    )}`}
                  >
                    {expert.planType}
                  </span>

                  <span className="bg-slate-800 px-3 py-1 rounded-full text-xs">
                    {expert.status}
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
