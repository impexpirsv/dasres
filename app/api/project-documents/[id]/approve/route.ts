import { prisma } from "../../../../../lib/prisma";
import { requireAdmin } from "../../../../../lib/auth";

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
    });

    return Response.json({
      message: "Document approved",
    });
  } catch {
    return Response.json(
      { message: "Failed to approve document" },
      { status: 500 },
    );
  }
}