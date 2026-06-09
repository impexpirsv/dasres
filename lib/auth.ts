import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

export async function getCurrentUser() {
  const cookieStore = await cookies();

  const sessionToken = cookieStore.get(
    "dasres_session_token"
  )?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      token: sessionToken,
    },
    include: {
      user: true,
    },
  });

  if (!session) {
    return null;
  }

  if (session.expiresAt < new Date()) {
    await prisma.session.deleteMany({
      where: {
        token: sessionToken,
      },
    });

    return null;
  }

  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "admin") {
    redirect("/dashboard");
  }

  return user;
}