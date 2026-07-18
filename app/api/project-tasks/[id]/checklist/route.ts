import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";

const MAX_CHECKLIST_TITLE_LENGTH = 300;

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const taskId = parseId(id, "task id");

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      throw new AppError(
        "INVALID_JSON_BODY",
        400,
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      throw new AppError(
        "INVALID_REQUEST_BODY",
        400,
      );
    }

    const title = String(
      (body as Record<string, unknown>)
        .title ?? "",
    ).trim();

    if (!title) {
      throw new AppError(
        "CHECKLIST_ITEM_TITLE_REQUIRED",
        400,
      );
    }

    if (
      title.length >
      MAX_CHECKLIST_TITLE_LENGTH
    ) {
      throw new AppError(
        "CHECKLIST_ITEM_TITLE_TOO_LONG",
        400,
      );
    }

    const task =
      await prisma.projectTask.findUnique({
        where: {
          id: taskId,
        },
        select: {
          id: true,
          project: {
            select: {
              createdBy: true,
              assignedTo: true,
              tradeCaseId: true,
            },
          },
        },
      });

    if (!task) {
      throw new AppError(
        "PROJECT_TASK_NOT_FOUND",
        404,
      );
    }

    const isCustomer =
      task.project.createdBy === user.id;

    const isProvider =
      task.project.assignedTo === user.id;

    if (
      user.role !== "admin" &&
      !isCustomer &&
      !isProvider
    ) {
      throw new AppError(
        "CHECKLIST_ITEM_CREATE_NOT_ALLOWED",
        403,
      );
    }

    const checklistItem =
      await prisma.$transaction(
        async (transaction) => {
          const lastChecklistItem =
            await transaction.projectTaskChecklist.findFirst(
              {
                where: {
                  taskId,
                },
                orderBy: {
                  sortOrder: "desc",
                },
                select: {
                  sortOrder: true,
                },
              },
            );

          const createdItem =
            await transaction.projectTaskChecklist.create(
              {
                data: {
                  taskId,
                  title,
                  sortOrder:
                    (lastChecklistItem
                      ?.sortOrder ?? 0) + 1,
                },
                select: {
                  id: true,
                  taskId: true,
                  title: true,
                  completed: true,
                  completedAt: true,
                  sortOrder: true,
                  createdAt: true,
                },
              },
            );

          await transaction.caseActivity.create({
            data: {
              caseId:
                task.project.tradeCaseId,
              userId: user.id,
              action:
                "PROJECT_TASK_CHECKLIST_CREATED",
              details: `Checklist item created: ${title}`,
            },
          });

          return createdItem;
        },
        {
          isolationLevel:
            Prisma.TransactionIsolationLevel
              .Serializable,
        },
      );

    return Response.json(
      {
        code: "PROJECT_TASK_CHECKLIST_CREATED",
        checklistItem,
      },
      {
        status: 201,
      },
    );
  });
}