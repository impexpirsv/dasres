import { prisma } from "../../../../lib/prisma";
import { requireAdmin } from "../../../../lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await requireAdmin();
  const { id } = await params;

  const targetUserId = Number(id);

  if (currentUser.id === targetUserId) {
    return Response.json(
      { message: "You are already admin" },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!targetUser) {
    return Response.json(
      { message: "User not found" },
      { status: 404 }
    );
  }

  if (targetUser.role === "admin") {
    return Response.json(
      { message: "User is already admin" },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: {
      id: targetUserId,
    },
    data: {
      role: "admin",
    },
  });

  return Response.json(user);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const currentUser = await requireAdmin();
  const { id } = await params;

  const targetUserId = Number(id);

  if (currentUser.id === targetUserId) {
    return Response.json(
      { message: "You cannot delete yourself" },
      { status: 400 }
    );
  }

  const targetUser = await prisma.user.findUnique({
    where: {
      id: targetUserId,
    },
  });

  if (!targetUser) {
    return Response.json(
      { message: "User not found" },
      { status: 404 }
    );
  }

  if (targetUser.role === "admin") {
    return Response.json(
      { message: "You cannot delete another admin" },
      { status: 403 }
    );
  }

  await prisma.user.delete({
    where: {
      id: targetUserId,
    },
  });

  return Response.json({
    message: "User deleted",
  });
}