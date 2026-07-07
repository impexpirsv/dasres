import { TaskPriority } from "@prisma/client";
import { apiHandler } from "../../../../lib/api";
import { AppError } from "../../../../lib/errors";
import { prisma } from "../../../../lib/prisma";
import { parseId } from "../../../../lib/validation";
import { requireUser } from "../../../../lib/auth";

const ALLOWED_PRIORITIES: TaskPriority[] = [
  TaskPriority.LOW,
  TaskPriority.MEDIUM,
  TaskPriority.HIGH,
  TaskPriority.URGENT,
];

function parseDateOnly(value: unknown) {
  const text = String(value || "").trim();

  if (!text) {
    return null;
  }

  return new Date(`${text}T12:00:00`);
}

function parseHours(value: unknown) {
  const numberValue = Number(value || 0);

  if (Number.isNaN(numberValue) || numberValue < 0) {
    return null;
  }

  return Math.round(numberValue);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const taskId = parseId(id, "task id");

    const body = await request.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const priority = String(body.priority || "MEDIUM") as TaskPriority;

    const startDate = parseDateOnly(body.startDate);
    const dueDate = parseDateOnly(body.dueDate);

    const estimatedHours = parseHours(body.estimatedHours);
    const loggedHours = parseHours(body.loggedHours);

    const dependsOnId =
      body.dependsOnId === "" ||
      body.dependsOnId === null ||
      body.dependsOnId === undefined
        ? null
        : Number(body.dependsOnId);

    if (!title) {
      throw new AppError("Task title is required.", 400);
    }

    if (!ALLOWED_PRIORITIES.includes(priority)) {
      throw new AppError("Invalid task priority.", 400);
    }

    if (startDate && Number.isNaN(startDate.getTime())) {
      throw new AppError("Invalid start date.", 400);
    }

    if (dueDate && Number.isNaN(dueDate.getTime())) {
      throw new AppError("Invalid due date.", 400);
    }

    if (startDate && dueDate && startDate > dueDate) {
      throw new AppError("Start date cannot be after due date.", 400);
    }

    if (estimatedHours === null) {
      throw new AppError("Invalid estimated hours.", 400);
    }

    if (loggedHours === null) {
      throw new AppError("Invalid logged hours.", 400);
    }

    if (dependsOnId !== null && Number.isNaN(dependsOnId)) {
      throw new AppError("Invalid dependency.", 400);
    }

    if (dependsOnId === taskId) {
      throw new AppError("A task cannot depend on itself.", 400);
    }

    const remainingHours = Math.max(estimatedHours - loggedHours, 0);

    const assignedToId =
      body.assignedToId === "" ||
      body.assignedToId === null ||
      body.assignedToId === undefined
        ? null
        : Number(body.assignedToId);

    if (assignedToId !== null && Number.isNaN(assignedToId)) {
      throw new AppError("Invalid assignee.", 400);
    }

    const task = await prisma.projectTask.findUnique({
      where: {
        id: taskId,
      },
      include: {
        project: true,
      },
    });

    if (!task) {
      throw new AppError("Task not found.", 404);
    }

    const isCustomer = task.project.createdBy === user.id;
    const isProvider = task.project.assignedTo === user.id;

    if (user.role !== "admin" && !isCustomer && !isProvider) {
      throw new AppError("You are not allowed to update this task.", 403);
    }

    if (assignedToId !== null) {
      const assignee = await prisma.user.findUnique({
        where: {
          id: assignedToId,
        },
        select: {
          id: true,
        },
      });

      if (!assignee) {
        throw new AppError("Assigned user not found.", 404);
      }
    }

    if (dependsOnId !== null) {
      const dependency = await prisma.projectTask.findUnique({
        where: {
          id: dependsOnId,
        },
        select: {
          id: true,
          projectId: true,
        },
      });

      if (!dependency) {
        throw new AppError("Dependency task not found.", 404);
      }

      if (dependency.projectId !== task.projectId) {
        throw new AppError(
          "Dependency must belong to the same project.",
          400,
        );
      }
    }

    const updatedTask = await prisma.projectTask.update({
      where: {
        id: taskId,
      },
      data: {
        title,
        description: description || null,
        priority,
        startDate,
        dueDate,
        assignedToId,
        estimatedHours,
        loggedHours,
        remainingHours,
        dependsOnId,
      },
    });

    await prisma.caseActivity.create({
      data: {
        caseId: task.project.tradeCaseId,
        userId: user.id,
        action: "PROJECT_TASK_UPDATED",
        details: `Project task updated: ${updatedTask.title}`,
      },
    });

    return Response.json({
      message: "Task updated",
      task: updatedTask,
    });
  });
}