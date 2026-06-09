import { cookies } from "next/headers";
import { prisma } from "../../../lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  const cookieStore = await cookies();

  const sessionToken =
    cookieStore.get("dasres_session_token")?.value;

  if (sessionToken) {
    await prisma.session.deleteMany({
      where: {
        token: sessionToken,
      },
    });
  }

  cookieStore.set("dasres_session_token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return NextResponse.json({
    message: "Logout successful",
  });
}