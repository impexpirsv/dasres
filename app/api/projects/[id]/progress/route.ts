import { apiHandler } from "../../../../../lib/api";
import { AppError } from "../../../../../lib/errors";
import { prisma } from "../../../../../lib/prisma";
import { parseId } from "../../../../../lib/validation";
import { requireUser } from "../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const projectId = parseId(id, "project id");

    const body = await request.json();
    const progress = Number(body.progress);

    if (Number.isNaN(progress) || progress < 0 || progress > 100) {
      throw new AppError("Progress must be a number between 0 and 100.", 400);
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
      throw new AppError("You are not allowed to update this project.", 403);
    }

    const updatedProject = await prisma.project.update({
      where: {
        id: projectId,
      },
      data: {
        progress,
      },
    });

    return Response.json({
      message: "Project progress updated",
      project: updatedProject,
    });
  });
}