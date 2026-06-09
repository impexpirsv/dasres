import { prisma } from "../../../lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.email || !body.password) {
      return Response.json(
        { message: "Name, email and password are required." },
        { status: 400 }
      );
    }

    if (!body.email.includes("@")) {
      return Response.json(
        { message: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (body.password.length < 6) {
      return Response.json(
        { message: "Password must be at least 6 characters." },
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

    const hashedPassword = await bcrypt.hash(
      body.password,
      10
    );

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: "user",
      },
    });

    return Response.json({
      message: "User created successfully",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("REGISTER_ERROR", error);

    return Response.json(
      { message: "Server error during registration." },
      { status: 500 }
    );
  }
}