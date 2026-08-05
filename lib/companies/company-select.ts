import { Prisma } from "@prisma/client";

export const COMPANY_DETAIL_SELECT = {
  id: true,
  name: true,
  country: true,
  category: true,
  status: true,
  description: true,
  email: true,
  website: true,
  logoUrl: true,
  verificationStatus: true,
  verifiedAt: true,
  planType: true,
  ownerId: true,
  createdAt: true,
} satisfies Prisma.CompanySelect;

export const PUBLIC_COMPANY_DETAIL_SELECT = {
  id: true,
  name: true,
  country: true,
  category: true,
  status: true,
  description: true,
  email: true,
  website: true,
  logoUrl: true,
  planType: true,
} satisfies Prisma.CompanySelect;

export type CompanyDetail =
  Prisma.CompanyGetPayload<{
    select:
      typeof COMPANY_DETAIL_SELECT;
  }>;

export type PublicCompanyDetail =
  Prisma.CompanyGetPayload<{
    select: typeof PUBLIC_COMPANY_DETAIL_SELECT;
  }>;
