import Link from "next/link";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function MyReviewsPage() {
  const user = await requireUser();

  const reviewsReceived = await prisma.review.findMany({
    where: {
      reviewedUserId: user.id,
    },
    include: {
      reviewer: true,
      tradeCase: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const reviewsGiven = await prisma.review.findMany({
    where: {
      reviewerId: user.id,
    },
    include: {
      reviewedUser: true,
      tradeCase: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const averageReceivedRating =
    reviewsReceived.length > 0
      ? reviewsReceived.reduce(
          (sum, review) => sum + review.rating,
          0
        ) / reviewsReceived.length
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-6 py-20">
      <h1 className="text-5xl font-bold mb-4">
        My Reviews
      </h1>

      <p className="text-slate-400 mb-12">
        View reviews you received and reviews you submitted.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-300">
            Average Rating
          </h2>

          <p className="text-4xl font-bold text-yellow-400 mt-3">
            {reviewsReceived.length > 0
              ? `⭐ ${averageReceivedRating.toFixed(1)}`
              : "—"}
          </p>

          <p className="text-slate-500 mt-2">
            Based on {reviewsReceived.length} received review
            {reviewsReceived.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-300">
            Reviews Received
          </h2>

          <p className="text-4xl font-bold text-blue-400 mt-3">
            {reviewsReceived.length}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-slate-300">
            Reviews Given
          </h2>

          <p className="text-4xl font-bold text-emerald-400 mt-3">
            {reviewsGiven.length}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-6">
            Reviews I Received
          </h2>

          <div className="space-y-4">
            {reviewsReceived.length === 0 ? (
              <p className="text-slate-500">
                You have not received any reviews yet.
              </p>
            ) : (
              reviewsReceived.map((review) => (
                <div
                  key={review.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold">
                        From{" "}
                        {review.reviewer?.name ||
                          review.reviewer?.email ||
                          "User"}
                      </p>

                      {review.tradeCase && (
                        <Link
                          href={`/dashboard/cases/${review.tradeCase.id}`}
                          className="text-sm text-blue-400 hover:underline"
                        >
                          {review.tradeCase.title}
                        </Link>
                      )}
                    </div>

                    <p className="text-yellow-400 font-semibold whitespace-nowrap">
                      ⭐ {review.rating}/5
                    </p>
                  </div>

                  {review.comment && (
                    <p className="text-slate-300">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6">
          <h2 className="text-2xl font-bold mb-6">
            Reviews I Gave
          </h2>

          <div className="space-y-4">
            {reviewsGiven.length === 0 ? (
              <p className="text-slate-500">
                You have not submitted any reviews yet.
              </p>
            ) : (
              reviewsGiven.map((review) => (
                <div
                  key={review.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5"
                >
                  <div className="flex justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold">
                        To{" "}
                        {review.reviewedUser?.name ||
                          review.reviewedUser?.email ||
                          "User"}
                      </p>

                      {review.tradeCase && (
                        <Link
                          href={`/dashboard/cases/${review.tradeCase.id}`}
                          className="text-sm text-blue-400 hover:underline"
                        >
                          {review.tradeCase.title}
                        </Link>
                      )}
                    </div>

                    <p className="text-yellow-400 font-semibold whitespace-nowrap">
                      ⭐ {review.rating}/5
                    </p>
                  </div>

                  {review.comment && (
                    <p className="text-slate-300">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}