import { Prisma } from "@prisma/client";

export const OPPORTUNITY_SELECT = {
  id: true,
  title: true,
  country: true,
  status: true,
  description: true,
  imageUrl: true,
} satisfies Prisma.OpportunitySelect;

export type OpportunityResponse =
  Prisma.OpportunityGetPayload<{
    select:
      typeof OPPORTUNITY_SELECT;
  }>;
