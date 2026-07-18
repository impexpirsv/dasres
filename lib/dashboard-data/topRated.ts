import { prisma } from "../prisma";

function calculateAverageRating(
  reviews: {
    rating: number;
  }[],
) {
  if (reviews.length === 0) {
    return 0;
  }

  const ratingTotal = reviews.reduce(
    (sum, review) =>
      sum + review.rating,
    0,
  );

  return ratingTotal / reviews.length;
}

export async function getDashboardTopRated() {
  const [experts, companies] =
    await Promise.all([
      prisma.expert.findMany({
        include: {
          owner: {
            include: {
              reviewsReceived: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
      }),

      prisma.company.findMany({
        include: {
          owner: {
            include: {
              reviewsReceived: {
                select: {
                  rating: true,
                },
              },
            },
          },
        },
      }),
    ]);

  const topRatedExperts = experts
    .map((expert) => {
      const reviews =
        expert.owner?.reviewsReceived ??
        [];

      return {
        ...expert,
        averageRating:
          calculateAverageRating(reviews),
        reviewCount: reviews.length,
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
      const reviews =
        company.owner?.reviewsReceived ??
        [];

      return {
        ...company,
        averageRating:
          calculateAverageRating(reviews),
        reviewCount: reviews.length,
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