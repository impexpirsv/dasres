import { ProjectStatus } from "@prisma/client";
import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";
import { calculateTaskProgress } from "../../../../../lib/projectTaskProgress";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const checklistId = parseId(id, "checklist item id");

    const checklist = await prisma.projectTaskChecklist.findUnique({
      where: {
        id: checklistId,
      },
      include: {
        task: {
          include: {
            project: true,
            checklistItems: true,
          },
        },
      },
    });

    if (!checklist) {
      throw new AppError("Checklist item not found.", 404);
    }

    const isCustomer = checklist.task.project.createdBy === user.id;
    const isProvider = checklist.task.project.assignedTo === user.id;

    if (user.role !== "admin" && !isCustomer && !isProvider) {
      throw new AppError(
        "You are not allowed to update this checklist item.",
        403,
      );
    }

    const completed = !checklist.completed;

    const updatedChecklist = await prisma.$transaction(async (tx) => {
      const updated = await tx.projectTaskChecklist.update({
        where: {
          id: checklistId,
        },
        data: {
          completed,
          completedAt: completed ? new Date() : null,
        },
      });

      const updatedChecklistItems =
        checklist.task.checklistItems.map((item) =>
          item.id === checklistId
            ? {
                ...item,
                completed,
              }
            : item,
        );

      const taskProgress = calculateTaskProgress({
        status: checklist.task.status,
        checklistItems: updatedChecklistItems,
      });

      await tx.projectTask.update({
        where: {
          id: checklist.task.id,
        },
        data: {
          progress: taskProgress,
        },
      });

      const allTasks = await tx.projectTask.findMany({
        where: {
          projectId: checklist.task.projectId,
        },
        select: {
          progress: true,
        },
      });

      const projectProgress =
        allTasks.length === 0
          ? 0
          : Math.round(
              allTasks.reduce((sum, task) => sum + task.progress, 0) /
                allTasks.length,
            );

      await tx.project.update({
        where: {
          id: checklist.task.projectId,
        },
        data: {
          progress: projectProgress,
          status:
            projectProgress === 100
              ? ProjectStatus.COMPLETED
              : ProjectStatus.ACTIVE,
          completedAt: projectProgress === 100 ? new Date() : null,
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId: checklist.task.project.tradeCaseId,
          userId: user.id,
          action: "PROJECT_TASK_CHECKLIST_TOGGLED",
          details: `${updated.title} → ${
            completed ? "Completed" : "Incomplete"
          }`,
        },
      });

      return updated;
    });

    return Response.json({
      message: "Checklist updated.",
      checklistItem: updatedChecklist,
    });
  });
}