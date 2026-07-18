import { Prisma } from "@prisma/client";
import { apiHandler } from "../../../../lib/api";
import { AppError } from "../../../../lib/errors";
import { prisma } from "../../../../lib/prisma";
import { parseId } from "../../../../lib/validation";
import { requireAdmin } from "../../../../lib/auth";

export async function PUT(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const currentUser = await requireAdmin();

    const { id } = await params;
    const targetUserId = parseId(
      id,
      "user id",
    );

    if (currentUser.id === targetUserId) {
      return Response.json({
        code: "USER_ALREADY_ADMIN",
        user: {
          id: currentUser.id,
          role: currentUser.role,
        },
      });
    }

    const targetUser =
      await prisma.user.findUnique({
        where: {
          id: targetUserId,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      });

    if (!targetUser) {
      throw new AppError(
        "USER_NOT_FOUND",
        404,
      );
    }

    if (targetUser.role === "admin") {
      return Response.json({
        code: "USER_ALREADY_ADMIN",
        user: targetUser,
      });
    }

    try {
      const updatedUser =
        await prisma.user.update({
          where: {
            id: targetUserId,
          },
          data: {
            role: "admin",
          },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        });

      return Response.json({
        code: "USER_PROMOTED_TO_ADMIN",
        user: updatedUser,
      });
    } catch (error) {
      if (
        error instanceof
          Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new AppError(
          "USER_NOT_FOUND",
          404,
        );
      }

      console.error(
        "USER_ADMIN_PROMOTION_ERROR",
        {
          currentUserId: currentUser.id,
          targetUserId,
          error,
        },
      );

      throw error;
    }
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  return apiHandler(async () => {
    const currentUser = await requireAdmin();

    const { id } = await params;
    const targetUserId = parseId(
      id,
      "user id",
    );

    if (currentUser.id === targetUserId) {
      throw new AppError(
        "ADMIN_SELF_DELETE_NOT_ALLOWED",
        400,
      );
    }

    const targetUser =
      await prisma.user.findUnique({
        where: {
          id: targetUserId,
        },
        select: {
          id: true,
          role: true,
        },
      });

    if (!targetUser) {
      throw new AppError(
        "USER_NOT_FOUND",
        404,
      );
    }

    if (targetUser.role === "admin") {
      throw new AppError(
        "ADMIN_DELETE_NOT_ALLOWED",
        403,
      );
    }

    try {
      await prisma.user.delete({
        where: {
          id: targetUserId,
        },
        select: {
          id: true,
        },
      });

      return Response.json({
        code: "USER_DELETED",
        userId: targetUserId,
      });
    } catch (error) {
      if (
        error instanceof
        Prisma.PrismaClientKnownRequestError
      ) {
        if (error.code === "P2025") {
          throw new AppError(
            "USER_NOT_FOUND",
            404,
          );
        }

        if (error.code === "P2003") {
          throw new AppError(
            "USER_DELETE_BLOCKED_BY_RELATED_DATA",
            409,
          );
        }
      }

      console.error(
        "USER_DELETE_ERROR",
        {
          currentUserId: currentUser.id,
          targetUserId,
          error,
        },
      );

      throw error;
    }
  });
}