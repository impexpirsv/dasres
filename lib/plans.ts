import { PlanType } from "@prisma/client";

export const PLAN_LEVELS = {
  FREE: 0,
  GOLD: 1,
  DIAMOND: 2,
  ENTERPRISE: 3,
} as const;

export function hasPlanAccess(
  currentPlan: PlanType,
  requiredPlan: PlanType
) {
  return (
    PLAN_LEVELS[currentPlan] >=
    PLAN_LEVELS[requiredPlan]
  );
}

export function getProposalLimit(
  planType: PlanType
) {
  switch (planType) {
    case "GOLD":
      return 20;

    case "DIAMOND":
      return Number.MAX_SAFE_INTEGER;

    case "ENTERPRISE":
      return Number.MAX_SAFE_INTEGER;

    default:
      return 5;
  }
}

export function getCaseLimit(
  planType: PlanType
) {
  switch (planType) {
    case "GOLD":
      return 20;

    case "DIAMOND":
      return Number.MAX_SAFE_INTEGER;

    case "ENTERPRISE":
      return Number.MAX_SAFE_INTEGER;

    default:
      return 3;
  }
}

export function getBestPlan(
  plans: PlanType[]
): PlanType {
  if (plans.includes("ENTERPRISE")) {
    return "ENTERPRISE";
  }

  if (plans.includes("DIAMOND")) {
    return "DIAMOND";
  }

  if (plans.includes("GOLD")) {
    return "GOLD";
  }

  return "FREE";
}