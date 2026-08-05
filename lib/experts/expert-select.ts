import { Prisma } from "@prisma/client";

export const EXPERT_DETAIL_SELECT = {
  id: true,
  name: true,
  country: true,
  specialty: true,
  status: true,
  experience: true,
  email: true,
  imageUrl: true,
  ownerId: true,
  verificationStatus: true,
  verifiedAt: true,
  createdAt: true,
} satisfies Prisma.ExpertSelect;

export const PUBLIC_EXPERT_DETAIL_SELECT = {
  id: true,
  name: true,
  country: true,
  specialty: true,
  status: true,
  experience: true,
  email: true,
  imageUrl: true,
  planType: true,
} satisfies Prisma.ExpertSelect;

export type ExpertDetail =
  Prisma.ExpertGetPayload<{
    select:
      typeof EXPERT_DETAIL_SELECT;
  }>;

export type PublicExpertDetail =
  Prisma.ExpertGetPayload<{
    select: typeof PUBLIC_EXPERT_DETAIL_SELECT;
  }>;
