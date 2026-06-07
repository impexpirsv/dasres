import { prisma } from "../../../../lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await prisma.user.update({
    where: {
      id: Number(id),
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
  const { id } = await params;

  await prisma.user.delete({
    where: {
      id: Number(id),
    },
  });

  return Response.json({
    message: "User deleted",
  });
}