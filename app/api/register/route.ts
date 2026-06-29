import bcrypt from "bcryptjs";
import { apiHandler } from "../../../lib/api";
import { AppError } from "../../../lib/errors";
import { prisma } from "../../../lib/prisma";

export async function POST(request: Request) {
  return apiHandler(async () => {
    const body = await request.json();

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!name || !email || !password) {
      throw new AppError("Name, email and password are required.", 400);
    }

    if (!email.includes("@")) {
      throw new AppError("Please enter a valid email address.", 400);
    }

    if (password.length < 6) {
      throw new AppError("Password must be at least 6 characters.", 400);
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      throw new AppError("User with this email already exists.", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
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
  });
}