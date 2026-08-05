import { apiHandler } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/auth";
import { notifyDocumentApproved } from "../../../../../lib/notificationEvents";
import { approveProjectDocument } from "../../../../../lib/project-documents";
import { parseId } from "../../../../../lib/validation";

export async function PATCH(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
) {
  return apiHandler(async () => {
    const user = await requireAdmin();
    const { id } = await params;
    const documentId = parseId(
      id,
      "document id",
    );

    const result =
      await approveProjectDocument({
        documentId,
        authenticatedUserId: user.id,
      });

    if (result.alreadyInRequestedState) {
      return Response.json({
        code:
          "PROJECT_DOCUMENT_ALREADY_APPROVED",
        document: result.document,
      });
    }

    if (
      result.document.uploadedById !== null &&
      result.document.uploadedById !== user.id
    ) {
      try {
        await notifyDocumentApproved({
          userId:
            result.document.uploadedById,
          projectId:
            result.document.task.projectId,
        });
      } catch (notificationError) {
        console.error(
          "PROJECT_DOCUMENT_APPROVAL_NOTIFICATION_ERROR",
          {
            documentId:
              result.document.id,
            userId:
              result.document.uploadedById,
            error: notificationError,
          },
        );
      }
    }

    return Response.json({
      code: "PROJECT_DOCUMENT_APPROVED",
      document: result.document,
    });
  });
}
