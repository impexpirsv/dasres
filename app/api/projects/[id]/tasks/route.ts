import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const projectId = parseId(id, "project id");

    const body = await request.json();

    const title = String(body.title || "").trim();
    const description = String(body.description || "").trim();
    const priority = String(body.priority || "MEDIUM").trim();

    const startDate = body.startDate
  ? new Date(`${body.startDate}T12:00:00`)
  : null;

const dueDate = body.dueDate
  ? new Date(`${body.dueDate}T12:00:00`)
  : null;

    if (!title) {
      throw new AppError("Task title is required.", 400);
    }

    if (!["LOW", "MEDIUM", "HIGH", "URGENT"].includes(priority)) {
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

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      throw new AppError("Project not found.", 404);
    }

    const isCustomer = project.createdBy === user.id;
    const isProvider = project.assignedTo === user.id;

    if (user.role !== "admin" && !isCustomer && !isProvider) {
      throw new AppError(
        "You are not allowed to add tasks to this project.",
        403,
      );
    }

    const task = await prisma.projectTask.create({
      data: {
        projectId,
        title,
        description: description || null,
        priority: priority as "LOW" | "MEDIUM" | "HIGH" | "URGENT",
        startDate,
        dueDate,
      },
    });

    await prisma.caseActivity.create({
      data: {
        caseId: project.tradeCaseId,
        userId: user.id,
        action: "PROJECT_TASK_CREATED",
        details: `Project task created: ${task.title}`,
      },
    });

    return Response.json({
      message: "Task created",
      task,
    });
  });
}