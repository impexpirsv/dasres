import { prisma } from "../../../lib/prisma";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    if (!email || !password) {
      return Response.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      return Response.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const isValidPassword = await bcrypt.compare(
      password,
      user.password
    );

    if (!isValidPassword) {
      return Response.json(
        { message: "Invalid password." },
        { status: 401 }
      );
    }

    const token = crypto.randomUUID();

    await prisma.session.create({
      data: {
        token,
        userId: user.id,
        expiresAt: new Date(
          Date.now() + 1000 * 60 * 60 * 24 * 7
        ),
      },
    });

    const cookieStore = await cookies();

    cookieStore.set("dasres_session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });

    cookieStore.delete("dasres_user_id");

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
    console.error("LOGIN ERROR:", error);

    return Response.json(
      { message: "Server error." },
      { status: 500 }
    );
  }
}