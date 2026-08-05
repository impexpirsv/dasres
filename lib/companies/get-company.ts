import { AppError } from "../errors";
import { prisma } from "../prisma";
import type { Prisma } from "@prisma/client";
import {
  COMPANY_DETAIL_SELECT,
  type CompanyDetail,
  PUBLIC_COMPANY_DETAIL_SELECT,
  type PublicCompanyDetail,
} from "./company-select";

export type CompanyViewer = {
  id: number;
  role: string;
} | null;

export type CompanyViewAccess = {
  scope: Prisma.CompanyWhereInput;
  visibility: "private" | "public";
};

export async function getCompanyViewAccess({
  companyId,
  viewer,
}: {
  companyId: number;
  viewer: CompanyViewer;
}): Promise<CompanyViewAccess | null> {
  const accessRecord = await prisma.company.findUnique({
    where: { id: companyId },
    select: {
      ownerId: true,
      verificationStatus: true,
    },
  });

  if (!accessRecord) return null;

  if (viewer?.role === "admin") {
    return { scope: { id: companyId }, visibility: "private" };
  }

  if (viewer && accessRecord.ownerId === viewer.id) {
    return {
      scope: { id: companyId, ownerId: viewer.id },
      visibility: "private",
    };
  }

  if (accessRecord.verificationStatus === "VERIFIED") {
    return {
      scope: { id: companyId, verificationStatus: "VERIFIED" },
      visibility: "public",
    };
  }

  return null;
}

export async function getCompany({
  companyId,
  viewer,
}: {
  companyId: number;
  viewer: CompanyViewer;
}): Promise<CompanyDetail | PublicCompanyDetail> {
  const access = await getCompanyViewAccess({ companyId, viewer });

  if (!access) {
    throw new AppError(
      "COMPANY_NOT_FOUND",
      404,
    );
  }

  if (access.visibility === "private") {
    const company = await prisma.company.findFirst({
      where: access.scope,
      select: COMPANY_DETAIL_SELECT,
    });
    if (!company) throw new AppError("COMPANY_NOT_FOUND", 404);
    return company;
  }

  const company = await prisma.company.findFirst({
    where: access.scope,
    select: PUBLIC_COMPANY_DETAIL_SELECT,
  });
  if (!company) throw new AppError("COMPANY_NOT_FOUND", 404);
  return company;
}
