import { prisma } from "../../../lib/prisma";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const user = await prisma.user.findUnique({
      where: {
        email: body.email,
      },
    });

    if (!user) {
      return Response.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    if (user.password !== body.password) {
      return Response.json(
        { message: "Invalid password." },
        { status: 401 }
      );
    }

    const cookieStore = await cookies();

    cookieStore.set(
      "dasres_user_id",
      String(user.id),
      {
        httpOnly: true,
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      }
    );

    return Response.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return Response.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
}