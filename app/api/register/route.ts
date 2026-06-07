import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.password) {
      return Response.json(
        { message: "Name, email and password are required." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (existingUser) {
      return Response.json(
        { message: "User with this email already exists." },
        { status: 400 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: body.password,
        role: "user",
      },
    });

    return Response.json({
      message: "User created successfully",
      user,
    });
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return Response.json(
      { message: "Server error during registration." },
      { status: 500 }
    );
  }
}