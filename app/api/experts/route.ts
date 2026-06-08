import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
if (
  !body.name ||
  !body.country ||
  !body.specialty ||
  !body.experience ||
  !body.email
) {
  return Response.json(
    { message: "All fields are required." },
    { status: 400 }
  );
}
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