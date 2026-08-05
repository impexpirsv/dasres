import { prisma } from "../prisma";
import {
  getEntityReviewRatingStats,
  getReviewRatingStats,
} from "../ranking/review-aggregates";

export async function getDashboardTopRated() {
  const [experts, companies] =
    await Promise.all([
      prisma.expert.findMany({
        select: {
          id: true,
          name: true,
          country: true,
          specialty: true,
          ownerId: true,
        },
      }),

      prisma.company.findMany({
        select: {
          id: true,
          name: true,
          country: true,
          category: true,
          ownerId: true,
        },
      }),
    ]);

  const reviewStats =
    await getReviewRatingStats([
      ...experts.map(
        (expert) => expert.ownerId,
      ),
      ...companies.map(
        (company) => company.ownerId,
      ),
    ]);

  const topRatedExperts = experts
    .map((expert) => {
      const ratingStats =
        getEntityReviewRatingStats(
          reviewStats,
          expert.ownerId,
        );

      return {
        ...expert,
        ...ratingStats,
      };
    })
    .filter(
      (expert) =>
        expert.reviewCount > 0,
    )
    .sort(
      (first, second) =>
        second.averageRating -
          first.averageRating ||
        second.reviewCount -
          first.reviewCount,
    )
    .slice(0, 5);

  const topRatedCompanies = companies
    .map((company) => {
      const ratingStats =
        getEntityReviewRatingStats(
          reviewStats,
          company.ownerId,
        );

      return {
        ...company,
        ...ratingStats,
      };
    })
    .filter(
      (company) =>
        company.reviewCount > 0,
    )
    .sort(
      (first, second) =>
        second.averageRating -
          first.averageRating ||
        second.reviewCount -
          first.reviewCount,
    )
    .slice(0, 5);

  return {
    topRatedExperts,
    topRatedCompanies,
  };
}
