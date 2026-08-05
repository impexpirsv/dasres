import type { Prisma } from "@prisma/client";

import { prisma } from "../prisma";

export function canViewProject({
  userId,
  userRole,
  projectCreatedBy,
  projectAssignedTo,
}: {
  userId: number;
  userRole: string;
  projectCreatedBy: number | null;
  projectAssignedTo: number | null;
}): boolean {
  return (
    userRole === "admin" ||
    projectCreatedBy === userId ||
    projectAssignedTo === userId
  );
}

export async function getAuthorizedProjectViewScope({
  projectId,
  userId,
  userRole,
}: {
  projectId: number;
  userId: number;
  userRole: string;
}): Promise<Prisma.ProjectWhereInput | null> {
  const accessRecord = await prisma.project.findUnique({
    where: { id: projectId },
    select: {
      createdBy: true,
      assignedTo: true,
    },
  });

  if (
    !accessRecord ||
    !canViewProject({
      userId,
      userRole,
      projectCreatedBy: accessRecord.createdBy,
      projectAssignedTo: accessRecord.assignedTo,
    })
  ) {
    return null;
  }

  if (userRole === "admin") {
    return { id: projectId };
  }

  return {
    id: projectId,
    OR: [
      { createdBy: userId },
      { assignedTo: userId },
    ],
  };
}
