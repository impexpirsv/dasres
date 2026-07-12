import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/auth";
import { notifyTaskAssigned } from "../../../../../lib/notificationEvents";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireAdmin();

    const { id } = await params;
    const taskId = Number(id);

    if (!taskId) {
      return Response.json({ message: "Invalid task id." }, { status: 400 });
    }

    const body = await request.json();
    const assignedToId =
      body.assignedToId === null || body.assignedToId === ""
        ? null
        : Number(body.assignedToId);

    if (
      assignedToId !== null &&
      (!Number.isInteger(assignedToId) || assignedToId <= 0)
    ) {
      return Response.json({ message: "Invalid assignee." }, { status: 400 });
    }

    const task = await prisma.projectTask.findUnique({
      where: { id: taskId },
      include: {
        project: {
          include: {
            tradeCase: true,
          },
        },
      },
    });

    if (!task) {
      return Response.json({ message: "Task not found." }, { status: 404 });
    }

    if (assignedToId !== null) {
      const assignee = await prisma.user.findUnique({
        where: { id: assignedToId },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!assignee) {
        return Response.json(
          { message: "Assignee not found." },
          { status: 404 },
        );
      }
    }

    const updatedTask = await prisma.projectTask.update({
      where: { id: taskId },
      data: {
        assignedToId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    await prisma.caseActivity.create({
      data: {
        caseId: task.project.tradeCaseId,
        userId: admin.id,
        action: "TASK_ASSIGNED",
        details: updatedTask.assignedTo
          ? `Task "${task.title}" assigned to ${
              updatedTask.assignedTo.name || updatedTask.assignedTo.email
            }.`
          : `Task "${task.title}" was unassigned.`,
      },
    });
    if (updatedTask.assignedToId) {
      await notifyTaskAssigned({
        userId: updatedTask.assignedToId,
        taskTitle: task.title,
        projectId: task.projectId,
      });
    }
    return Response.json({
      message: "Task assignment updated.",
      task: updatedTask,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to assign task." },
      { status: 500 },
    );
  }
}
