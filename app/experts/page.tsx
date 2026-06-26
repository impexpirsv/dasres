import Link from "next/link";
import { prisma } from "../../lib/prisma";
import ExpertsSearch from "../components/ExpertsSearch";
import { calculateTrustScore } from "../../lib/ranking";
export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function ExpertsPage({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const currentPage = Number(params?.page) || 1;

  const totalExperts = await prisma.expert.count();
  const totalPages = Math.ceil(totalExperts / PAGE_SIZE);

  const experts = await prisma.expert.findMany({
    skip: (currentPage - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    orderBy: {
      id: "desc",
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
        ...expert,
        averageRating,
        reviewCount: reviews.length,
        trustScore,
      };
    }),
  );

  const planPriority = {
    ENTERPRISE: 4,
    DIAMOND: 3,
    GOLD: 2,
    FREE: 1,
  } as const;

  const sortedExpertsWithRatings = expertsWithRatings.sort(
    (a, b) =>
      planPriority[b.planType] - planPriority[a.planType] || b.id - a.id,
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
       <div className="mb-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16"></div>
  <p className="text-blue-400 font-semibold mb-3">
    Verified Expert Network
  </p>

  <h1 className="text-5xl md:text-6xl font-black mb-5">
    Find trusted trade experts
  </h1>

  <p className="text-slate-400 text-lg max-w-3xl">
    Connect with verified international trade professionals across customs,
    sourcing, logistics, inspection and global business services.
  </p>
<div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">

  <p className="text-blue-400 text-sm">
    Featured Expert
  </p>

  <h2 className="text-3xl font-bold mt-2">
    {sortedExpertsWithRatings[0]?.name}
  </h2>

  <p className="text-slate-400 mt-2">
    {sortedExpertsWithRatings[0]?.specialty}
  </p>

  <div className="grid grid-cols-3 gap-4 mt-8">

    <div>
      <p className="text-2xl font-bold text-emerald-400">
        {sortedExpertsWithRatings[0]?.trustScore}
      </p>
      <p className="text-slate-500 text-sm">
        Trust
      </p>
    </div>

    <div>
      <p className="text-2xl font-bold text-yellow-400">
        {sortedExpertsWithRatings[0]?.averageRating.toFixed(1)}
      </p>
      <p className="text-slate-500 text-sm">
        Rating
      </p>
    </div>

    <div>
      <p className="text-2xl font-bold text-blue-400">
        {sortedExpertsWithRatings[0]?.reviewCount}
      </p>
      <p className="text-slate-500 text-sm">
        Reviews
      </p>
    </div>

  </div>

</div>
  <div className="grid sm:grid-cols-3 gap-4 mt-10">
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-3xl font-bold text-blue-400">{totalExperts}</p>
      <p className="text-slate-400 text-sm mt-1">Total Experts</p>
    </div>

    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-3xl font-bold text-emerald-400">
        {sortedExpertsWithRatings.filter(
          (expert) => expert.verificationStatus === "VERIFIED"
        ).length}
      </p>
      <p className="text-slate-400 text-sm mt-1">Verified Experts</p>
    </div>

    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-3xl font-bold text-yellow-400">
        {sortedExpertsWithRatings.filter(
          (expert) => expert.averageRating > 0
        ).length}
      </p>
      <p className="text-slate-400 text-sm mt-1">Rated Experts</p>
    </div>
  </div>
</div>

        <ExpertsSearch experts={sortedExpertsWithRatings} />

        <div className="flex justify-center gap-4 mt-12">
          {currentPage > 1 && (
            <Link
              href={`/experts?page=${currentPage - 1}`}
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
              href={`/experts?page=${currentPage + 1}`}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              Next
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
