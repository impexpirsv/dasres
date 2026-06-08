import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  console.log("API HIT");

  try {
    const body = await request.json();
if (
  !body.title ||
  !body.country ||
  !body.description
) {
  return Response.json(
    { message: "All fields are required." },
    { status: 400 }
  );
}
    console.log(body);

    const opportunity = await prisma.opportunity.create({
      data: {
        title: body.title,
        country: body.country,
        status: "Open",
        description: body.description,
      },
    });

    console.log("CREATED", opportunity);

    return Response.json(opportunity);
  } catch (error) {
    console.error("CREATE_OPPORTUNITY_ERROR", error);

    return Response.json(
      { message: "Error creating opportunity" },
      { status: 500 }
    );
  }
}