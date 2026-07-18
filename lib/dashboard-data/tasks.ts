import { prisma } from "../prisma";
import type { DashboardUser } from "./types";

export async function getDashboardTasks(
  user: DashboardUser,
) {
  const now = new Date();

  const [
    dashboardTasks,
    overdueTasks,
  ] = await Promise.all([
    prisma.projectTask.findMany({
      where: {
        assignedToId: user.id,
      },
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: [
        {
          dueDate: "asc",
        },
        {
          createdAt: "desc",
        },
      ],
      take: 5,
    }),

    prisma.projectTask.findMany({
      where: {
        assignedToId: user.id,
        status: {
          not: "COMPLETED",
        },
        dueDate: {
          lt: now,
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
      take: 5,
    }),
  ]);

  return {
    dashboardTasks,
    overdueTasks,
  };
}