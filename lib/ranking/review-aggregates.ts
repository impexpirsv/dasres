import { prisma } from "../prisma";

export type ReviewRatingStats = {
  averageRating: number;
  reviewCount: number;
};

export async function getReviewRatingStats(
  ownerIds: readonly (number | null)[],
): Promise<Map<number, ReviewRatingStats>> {
  const uniqueOwnerIds = [
    ...new Set(
      ownerIds.filter(
        (ownerId): ownerId is number =>
          ownerId !== null,
      ),
    ),
  ];

  if (uniqueOwnerIds.length === 0) {
    return new Map();
  }

  const aggregates =
    await prisma.review.groupBy({
      by: ["reviewedUserId"],
      where: {
        reviewedUserId: {
          in: uniqueOwnerIds,
        },
      },
      _avg: {
        rating: true,
      },
      _count: {
        _all: true,
      },
    });

  return new Map(
    aggregates.map((aggregate) => [
      aggregate.reviewedUserId,
      {
        averageRating:
          aggregate._avg.rating ?? 0,
        reviewCount:
          aggregate._count._all,
      },
    ]),
  );
}

export function getEntityReviewRatingStats(
  reviewStats: ReadonlyMap<
    number,
    ReviewRatingStats
  >,
  ownerId: number | null,
): ReviewRatingStats {
  if (ownerId === null) {
    return {
      averageRating: 0,
      reviewCount: 0,
    };
  }

  return (
    reviewStats.get(ownerId) ?? {
      averageRating: 0,
      reviewCount: 0,
    }
  );
}
