import { PlanType, VerificationStatus } from "@prisma/client";

export function calculateTrustScore({
  averageRating,
  completedCases,
  verificationStatus,
  planType,
}: {
  averageRating: number;
  completedCases: number;
  verificationStatus: VerificationStatus;
  planType: PlanType;
}) {
  let score = 0;

  score += averageRating * 10;

  score += Math.min(completedCases * 2, 30);

  if (verificationStatus === "VERIFIED") {
    score += 15;
  }

  switch (planType) {
    case "GOLD":
      score += 5;
      break;

    case "DIAMOND":
      score += 10;
      break;

    case "ENTERPRISE":
      score += 15;
      break;
  }

  return Math.min(score, 100);
}