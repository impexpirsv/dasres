import { prisma } from "../../../lib/prisma";
import { requireUser } from "../../../lib/auth";

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();

    const projectId = Number(body.projectId);
    const conversationId = body.conversationId
      ? Number(body.conversationId)
      : null;
    const message = String(body.message || "").trim();

    if (!projectId || !message) {
      return Response.json(
        { message: "Project and message are required." },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
    });

    if (!project) {
      return Response.json(
        { message: "Project not found." },
        { status: 404 },
      );
    }

    const canAccess =
      user.role === "admin" ||
      project.createdBy === user.id ||
      project.assignedTo === user.id;

    if (!canAccess) {
      return Response.json(
        { message: "Access denied." },
        { status: 403 },
      );
    }

    const conversation =
      conversationId
        ? await prisma.projectConversation.findUnique({
            where: {
              id: conversationId,
            },
          })
        : await prisma.projectConversation.create({
            data: {
              projectId,
              title: "Project Conversation",
            },
          });

    if (!conversation || conversation.projectId !== projectId) {
      return Response.json(
        { message: "Invalid conversation." },
        { status: 400 },
      );
    }

    await prisma.projectMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: user.id,
        message,
      },
    });

    return Response.json({
      message: "Message sent.",
    });
  } catch {
    return Response.json(
      { message: "Failed to send message." },
      { status: 500 },
    );
  }
}