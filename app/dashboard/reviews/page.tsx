import Link from "next/link";
import {
  getLocale,
  getTranslations,
} from "next-intl/server";
import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export default async function MyReviewsPage() {
  const user = await requireUser();

  const locale = await getLocale();
  const t = await getTranslations("myReviews");

  const numberFormatter = new Intl.NumberFormat(locale);

  const ratingFormatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const [reviewsReceived, reviewsGiven] =
    await Promise.all([
      prisma.review.findMany({
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
      }),

      prisma.review.findMany({
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
      }),
    ]);

  const averageReceivedRating =
    reviewsReceived.length > 0
      ? reviewsReceived.reduce(
          (sum, review) => sum + review.rating,
          0,
        ) / reviewsReceived.length
      : 0;

  return (
    <div className="mx-auto max-w-7xl px-6 py-20">
      <h1 className="mb-4 text-5xl font-bold">
        {t("title")}
      </h1>

      <p className="mb-12 text-slate-400">
        {t("description")}
      </p>

      <div className="mb-12 grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-slate-300">
            {t("statistics.averageRating")}
          </h2>

          <p className="mt-3 text-4xl font-bold text-yellow-400">
            {reviewsReceived.length > 0
              ? `⭐ ${ratingFormatter.format(
                  averageReceivedRating,
                )}`
              : "—"}
          </p>

          <p className="mt-2 text-slate-500">
            {t("statistics.basedOn", {
              count: numberFormatter.format(
                reviewsReceived.length,
              ),
            })}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-slate-300">
            {t("statistics.received")}
          </h2>

          <p className="mt-3 text-4xl font-bold text-blue-400">
            {numberFormatter.format(
              reviewsReceived.length,
            )}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-lg font-semibold text-slate-300">
            {t("statistics.given")}
          </h2>

          <p className="mt-3 text-4xl font-bold text-emerald-400">
            {numberFormatter.format(
              reviewsGiven.length,
            )}
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-6 text-2xl font-bold">
            {t("received.title")}
          </h2>

          <div className="space-y-4">
            {reviewsReceived.length === 0 ? (
              <p className="text-slate-500">
                {t("received.empty")}
              </p>
            ) : (
              reviewsReceived.map((review) => {
                const reviewerName =
                  review.reviewer?.name ||
                  review.reviewer?.email ||
                  t("fallbackUser");

                return (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="mb-3 flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {t("received.from", {
                            name: reviewerName,
                          })}
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

                      <p className="whitespace-nowrap font-semibold text-yellow-400">
                        ⭐{" "}
                        {t("ratingOutOfFive", {
                          rating:
                            numberFormatter.format(
                              review.rating,
                            ),
                        })}
                      </p>
                    </div>

                    {review.comment && (
                      <p className="whitespace-pre-wrap text-slate-300">
                        {review.comment}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="mb-6 text-2xl font-bold">
            {t("given.title")}
          </h2>

          <div className="space-y-4">
            {reviewsGiven.length === 0 ? (
              <p className="text-slate-500">
                {t("given.empty")}
              </p>
            ) : (
              reviewsGiven.map((review) => {
                const reviewedUserName =
                  review.reviewedUser?.name ||
                  review.reviewedUser?.email ||
                  t("fallbackUser");

                return (
                  <div
                    key={review.id}
                    className="rounded-2xl border border-slate-800 bg-slate-950 p-5"
                  >
                    <div className="mb-3 flex justify-between gap-4">
                      <div>
                        <p className="font-semibold">
                          {t("given.to", {
                            name: reviewedUserName,
                          })}
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

                      <p className="whitespace-nowrap font-semibold text-yellow-400">
                        ⭐{" "}
                        {t("ratingOutOfFive", {
                          rating:
                            numberFormatter.format(
                              review.rating,
                            ),
                        })}
                      </p>
                    </div>

                    {review.comment && (
                      <p className="whitespace-pre-wrap text-slate-300">
                        {review.comment}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}