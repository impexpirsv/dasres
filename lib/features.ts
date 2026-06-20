import { PlanType } from "@prisma/client";

export const FEATURES = {
  VERIFIED_BADGE: PlanType.GOLD,

  PRIORITY_LISTING: PlanType.GOLD,

  UNLIMITED_PROPOSALS: PlanType.DIAMOND,

  FEATURED_COMPANY: PlanType.DIAMOND,

  ACCOUNT_MANAGER: PlanType.ENTERPRISE,

  API_ACCESS: PlanType.ENTERPRISE,
} as const;