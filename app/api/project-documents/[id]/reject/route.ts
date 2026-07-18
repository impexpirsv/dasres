import { Prisma } from "@prisma/client";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/auth";
import { parseId } from "../../../../../lib/validation";

export async function PATCH(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
) {
  try {
    const user = await requireAdmin();

    const { id } = await params;
    const documentId = parseId(
      id,
      "document id",
    );

    const existingDocument =
      await prisma.projectTaskAttachment.findUnique({
        where: {
          id: documentId,
        },
        select: {
          id: true,
          approvalStatus: true,
        },
      });

    if (!existingDocument) {
      return Response.json(
        {
          code: "PROJECT_DOCUMENT_NOT_FOUND",
        },
        {
          status: 404,
        },
      );
    }

    if (
      existingDocument.approvalStatus ===
      "REJECTED"
    ) {
      return Response.json({
        code: "PROJECT_DOCUMENT_ALREADY_REJECTED",
      });
    }

    const document =
      await prisma.projectTaskAttachment.update({
        where: {
          id: documentId,
        },
        data: {
          approvalStatus: "REJECTED",
          approvedById: user.id,
          approvedAt: new Date(),
          rejectionReason: "Rejected by admin",
        },
        select: {
          id: true,
          fileName: true,
          fileUrl: true,
          approvalStatus: true,
          approvedById: true,
          approvedAt: true,
          rejectionReason: true,
          uploadedById: true,
          taskId: true,
        },
      });

    return Response.json({
      code: "PROJECT_DOCUMENT_REJECTED",
      document,
    });
  } catch (error) {
    if (error instanceof Response) {
      return error;
    }

    if (
      error instanceof
        Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return Response.json(
        {
          code: "PROJECT_DOCUMENT_NOT_FOUND",
        },
        {
          status: 404,
        },
      );
    }

    console.error(
      "PROJECT_DOCUMENT_REJECT_ERROR",
      {
        error,
      },
    );

    return Response.json(
      {
        code: "PROJECT_DOCUMENT_REJECT_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}