import { apiHandler } from "../../../../../lib/api";
import { requireAdmin } from "../../../../../lib/auth";
import { AppError } from "../../../../../lib/errors";
import {
  parseRejectProjectDocumentInput,
  rejectProjectDocument,
} from "../../../../../lib/project-documents";
import { parseId } from "../../../../../lib/validation";

async function readOptionalJsonBody(
  request: Request,
): Promise<unknown> {
  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }

  if (!rawBody.trim()) {
    return {};
  }

  const contentType = request.headers.get(
    "content-type",
  );

  if (
    !contentType ||
    !contentType
      .toLowerCase()
      .includes("application/json")
  ) {
    throw new AppError(
      "UNSUPPORTED_MEDIA_TYPE",
      415,
    );
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new AppError(
      "INVALID_JSON_BODY",
      400,
    );
  }
}

export async function PATCH(
  request: Request,
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
    const body =
      await readOptionalJsonBody(request);
    const input =
      parseRejectProjectDocumentInput(
        body,
      );

    const result =
      await rejectProjectDocument({
        documentId,
        authenticatedUserId: user.id,
        input,
      });

    if (result.alreadyInRequestedState) {
      return Response.json({
        code:
          "PROJECT_DOCUMENT_ALREADY_REJECTED",
        document: result.document,
      });
    }

    return Response.json({
      code: "PROJECT_DOCUMENT_REJECTED",
      document: result.document,
    });
  });
}
