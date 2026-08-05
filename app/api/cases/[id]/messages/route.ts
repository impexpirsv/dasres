import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import {
  createCaseMessage,
  parseCreateCaseMessageInput,
} from "../../../../../lib/case-messages";
import { AppError } from "../../../../../lib/errors";
import { parseId } from "../../../../../lib/validation";

async function readJsonBody(
  request: Request,
): Promise<unknown> {
  const contentType =
    request.headers.get("content-type");

  if (
    contentType &&
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
    return await request.json();
  } catch {
    throw new AppError(
      "INVALID_REQUEST_BODY",
      400,
    );
  }
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>;
  },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const caseId = parseId(id, "case id");

    const body = await readJsonBody(request);
    const input =
      parseCreateCaseMessageInput(body);

    const message = await createCaseMessage({
      caseId,
      authenticatedUserId: user.id,
      input,
    });

    return Response.json(
      {
        code: "CASE_MESSAGE_CREATED",
        message,
      },
      {
        status: 201,
      },
    );
  });
}
