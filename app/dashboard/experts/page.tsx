import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import ExpertsSearch from "../../components/ExpertsSearch";
import { calculateTrustScore } from "../../../lib/ranking";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function DashboardExpertsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;

  const totalExperts = await prisma.expert.count();

  const verifiedExpertsCount = await prisma.expert.count({
    where: {
      verificationStatus: "VERIFIED",
    },
  });

  const pendingExpertsCount = await prisma.expert.count({
    where: {
      verificationStatus: "PENDING",
    },
  });

  const rejectedExpertsCount = await prisma.expert.count({
    where: {
      verificationStatus: "REJECTED",
    },
  });

  const premiumExpertsCount = await prisma.expert.count({
    where: {
      planType: {
        in: ["GOLD", "DIAMOND", "ENTERPRISE"],
      },
    },
  });

  const totalPages = Math.ceil(totalExperts / PAGE_SIZE);

  const experts = await prisma.expert.findMany({
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    orderBy: {
      id: "desc",
    },
    select: {
      id: true,
      name: true,
      country: true,
      specialty: true,
      status: true,
      experience: true,
      email: true,
      imageUrl: true,
      ownerId: true,
      verificationStatus: true,
      planType: true,
    },
  });

  const expertsWithRatings = await Promise.all(
    experts.map(async (expert) => {
      const reviews = expert.ownerId
        ? await prisma.review.findMany({
            where: {
              reviewedUserId: expert.ownerId,
            },
            select: {
              rating: true,
            },
          })
        : [];

      const averageRating =
        reviews.length > 0
          ? reviews.reduce((sum, review) => sum + review.rating, 0) /
            reviews.length
          : 0;
      const trustScore = calculateTrustScore({
        averageRating,
        completedCases: 0,
        verificationStatus: expert.verificationStatus,
        planType: expert.planType,
      });
      return {
        id: expert.id,
        name: expert.name,
        country: expert.country,
        specialty: expert.specialty,
        status: expert.status,
        experience: expert.experience,
        email: expert.email,
        imageUrl: expert.imageUrl,
        verificationStatus: expert.verificationStatus,
        planType: expert.planType,
        averageRating,
        reviewCount: reviews.length,
        trustScore,
      };
    }),
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
        <div>
          <h1 className="text-5xl font-bold mb-4">Experts Management</h1>

          <p className="text-slate-400">
            Manage and browse international trade experts.
          </p>
        </div>

        <Link
          href="/dashboard/experts/new"
          className="bg-blue-600 hover:bg-blue-700 px-5 py-3 rounded-xl text-center"
        >
          Add Expert
        </Link>
      </div>

      <div className="grid md:grid-cols-5 gap-6 mb-10">
        <div className="bg-slate-900 border border-blue-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Total</p>

          <p className="text-4xl font-bold text-blue-400 mt-2">
            {totalExperts}
          </p>
        </div>

        <div className="bg-slate-900 border border-emerald-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Verified</p>

          <p className="text-4xl font-bold text-emerald-400 mt-2">
            {verifiedExpertsCount}
          </p>
        </div>

        <div className="bg-slate-900 border border-yellow-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Pending</p>

          <p className="text-4xl font-bold text-yellow-400 mt-2">
            {pendingExpertsCount}
          </p>
        </div>

        <div className="bg-slate-900 border border-red-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Rejected</p>

          <p className="text-4xl font-bold text-red-400 mt-2">
            {rejectedExpertsCount}
          </p>
        </div>

        <div className="bg-slate-900 border border-purple-500 rounded-2xl p-6">
          <p className="text-slate-400 text-sm">Premium</p>

          <p className="text-4xl font-bold text-purple-400 mt-2">
            {premiumExpertsCount}
          </p>
        </div>
      </div>

      <ExpertsSearch
    experts={expertsWithRatings}
    profileBasePath="/dashboard/experts"
/>

      <div className="flex justify-center gap-4 mt-12">
        {currentPage > 1 && (
          <Link
            href={`/dashboard/experts?page=${currentPage - 1}`}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            Previous
          </Link>
        )}

        <span className="px-4 py-2 text-slate-300">
          Page {currentPage} of {totalPages || 1}
        </span>

        {currentPage < totalPages && (
          <Link
            href={`/dashboard/experts?page=${currentPage + 1}`}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}
