import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/auth";
import { notifyDocumentApproved } from "../../../../../lib/notificationEvents";
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireAdmin();
    const { id } = await params;
    const documentId = Number(id);

    if (!documentId || Number.isNaN(documentId)) {
      return Response.json(
        { message: "Invalid document ID" },
        { status: 400 },
      );
    }

    const document = await prisma.projectTaskAttachment.update({
      where: {
        id: documentId,
      },
      data: {
        approvalStatus: "APPROVED",
        approvedById: user.id,
        approvedAt: new Date(),
        rejectionReason: null,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
          },
        },
        task: {
          select: {
            projectId: true,
          },
        },
      },
    });

    if (document.uploadedBy?.id && document.uploadedBy.id !== user.id) {
      await notifyDocumentApproved({
  userId: document.uploadedBy.id,
  projectId: document.task.projectId,
});
    }

    return Response.json({
      message: "Document approved",
      document,
    });
  } catch {
    return Response.json(
      { message: "Failed to approve document" },
      { status: 500 },
    );
  }
}