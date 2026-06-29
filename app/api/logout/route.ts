import { cookies } from "next/headers";
import { apiHandler } from "../../../lib/api";
import { prisma } from "../../../lib/prisma";

export async function POST() {
  return apiHandler(async () => {
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

    return Response.json({
      message: "Logout successful",
    });
  });
}