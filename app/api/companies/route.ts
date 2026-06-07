import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const company = await prisma.company.create({
      data: {
        name: body.name,
        country: body.country,
        category: body.category,
        status: "Verified Company",
        description: body.description,
        email: body.email,
        website: body.website,
      },
    });

    return Response.json(company);
  } catch (error) {
    return Response.json(
      { message: "Error creating company" },
      { status: 500 }
    );
  }
}