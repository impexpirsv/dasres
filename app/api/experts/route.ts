import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const expert = await prisma.expert.create({
      data: {
        name: body.name,
        country: body.country,
        specialty: body.specialty,
        status: "Verified Expert",
        experience: body.experience,
        email: body.email,
      },
    });

    return Response.json(expert);
  } catch (error) {
    return Response.json(
      { message: "Error creating expert" },
      { status: 500 }
    );
  }
}