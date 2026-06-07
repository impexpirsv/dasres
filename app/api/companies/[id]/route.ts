import { prisma } from "../../../../lib/prisma";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.company.delete({
    where: {
      id: Number(id),
    },
  });

  return Response.json({
    message: "Company deleted",
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  const company = await prisma.company.update({
    where: {
      id: Number(id),
    },
    data: {
      name: body.name,
      country: body.country,
      category: body.category,
      description: body.description,
      email: body.email,
      website: body.website,
    },
  });

  return Response.json(company);
}