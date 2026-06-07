import { prisma } from "../../../../lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.expert.delete({
    where: {
      id: Number(id),
    },
  });

  return Response.json({
    message: "Expert deleted",
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();

  const expert = await prisma.expert.update({
    where: {
      id: Number(id),
    },
    data: {
      name: body.name,
      country: body.country,
      specialty: body.specialty,
      experience: body.experience,
      email: body.email,
    },
  });

  return Response.json(expert);
}