import { prisma } from "../../../../lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.opportunity.delete({
    where: {
      id: Number(id),
    },
  });

  return Response.json({
    message: "Opportunity deleted",
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const body = await request.json();

  const opportunity =
    await prisma.opportunity.update({
      where: {
        id: Number(id),
      },
      data: {
        title: body.title,
        country: body.country,
        description: body.description,
      },
    });

  return Response.json(opportunity);
}