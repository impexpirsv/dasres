import { Prisma } from "@prisma/client";
import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/auth";
import { notifyDocumentApproved } from "../../../../../lib/notificationEvents";
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
          uploadedById: true,
          task: {
            select: {
              projectId: true,
            },
          },
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
      "APPROVED"
    ) {
      return Response.json({
        code: "PROJECT_DOCUMENT_ALREADY_APPROVED",
      });
    }

    const document =
      await prisma.projectTaskAttachment.update({
        where: {
          id: documentId,
        },
        data: {
          approvalStatus: "APPROVED",
          approvedById: user.id,
          approvedAt: new Date(),
          rejectionReason: null,
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
          task: {
            select: {
              projectId: true,
            },
          },
        },
      });

    if (
      document.uploadedById &&
      document.uploadedById !== user.id
    ) {
      try {
        await notifyDocumentApproved({
          userId: document.uploadedById,
          projectId: document.task.projectId,
        });
      } catch (notificationError) {
        console.error(
          "PROJECT_DOCUMENT_APPROVAL_NOTIFICATION_ERROR",
          {
            documentId: document.id,
            userId: document.uploadedById,
            error: notificationError,
          },
        );
      }
    }

    return Response.json({
      code: "PROJECT_DOCUMENT_APPROVED",
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
      "PROJECT_DOCUMENT_APPROVE_ERROR",
      {
        error,
      },
    );

    return Response.json(
      {
        code: "PROJECT_DOCUMENT_APPROVE_FAILED",
      },
      {
        status: 500,
      },
    );
  }
}