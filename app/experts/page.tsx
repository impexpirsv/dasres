import Link from "next/link";
import { prisma } from "../../lib/prisma";
import ExpertsSearch from "../components/ExpertsSearch";

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
        ? reviews.reduce(
            (sum, review) => sum + review.rating,
            0
          ) / reviews.length
        : 0;

    return {
      ...expert,
      averageRating,
      reviewCount: reviews.length,
    };
  })
);

const planPriority = {
  ENTERPRISE: 4,
  DIAMOND: 3,
  GOLD: 2,
  FREE: 1,
} as const;

const sortedExpertsWithRatings =
  expertsWithRatings.sort(
    (a, b) =>
      planPriority[b.planType] -
        planPriority[a.planType] ||
      b.id - a.id
  );
 
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <h1 className="text-5xl font-bold mb-4">
          Experts Directory
        </h1>

        <p className="text-slate-400 mb-12">
          Find verified international trade experts.
        </p>

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