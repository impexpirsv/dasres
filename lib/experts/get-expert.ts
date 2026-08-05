import { AppError } from "../errors";
import { prisma } from "../prisma";
import type { Prisma } from "@prisma/client";
import {
  EXPERT_DETAIL_SELECT,
  type ExpertDetail,
  PUBLIC_EXPERT_DETAIL_SELECT,
  type PublicExpertDetail,
} from "./expert-select";

export type ExpertViewer = {
  id: number;
  role: string;
} | null;

export type ExpertViewAccess = {
  scope: Prisma.ExpertWhereInput;
  visibility: "private" | "public";
};

export async function getExpertViewAccess({
  expertId,
  viewer,
}: {
  expertId: number;
  viewer: ExpertViewer;
}): Promise<ExpertViewAccess | null> {
  const accessRecord = await prisma.expert.findUnique({
    where: { id: expertId },
    select: {
      ownerId: true,
      verificationStatus: true,
    },
  });

  if (!accessRecord) return null;

  if (viewer?.role === "admin") {
    return { scope: { id: expertId }, visibility: "private" };
  }

  if (viewer && accessRecord.ownerId === viewer.id) {
    return {
      scope: { id: expertId, ownerId: viewer.id },
      visibility: "private",
    };
  }

  if (accessRecord.verificationStatus === "VERIFIED") {
    return {
      scope: { id: expertId, verificationStatus: "VERIFIED" },
      visibility: "public",
    };
  }

  return null;
}

export async function getExpert({
  expertId,
  viewer,
}: {
  expertId: number;
  viewer: ExpertViewer;
}): Promise<ExpertDetail | PublicExpertDetail> {
  const access = await getExpertViewAccess({ expertId, viewer });

  if (!access) {
    throw new AppError(
      "EXPERT_NOT_FOUND",
      404,
    );
  }

  if (access.visibility === "private") {
    const expert = await prisma.expert.findFirst({
      where: access.scope,
      select: EXPERT_DETAIL_SELECT,
    });
    if (!expert) throw new AppError("EXPERT_NOT_FOUND", 404);
    return expert;
  }

  const expert = await prisma.expert.findFirst({
    where: access.scope,
    select: PUBLIC_EXPERT_DETAIL_SELECT,
  });
  if (!expert) throw new AppError("EXPERT_NOT_FOUND", 404);
  return expert;
}
