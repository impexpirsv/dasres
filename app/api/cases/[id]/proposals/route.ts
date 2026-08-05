import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import {
  createProposal,
  parseCreateProposalInput,
} from "../../../../../lib/case-proposals";
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
    params: Promise<{
      id: string;
    }>;
  },
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const caseId = parseId(
      id,
      "case id",
    );

    const body = await readJsonBody(request);
    const input =
      parseCreateProposalInput(body);

    const result = await createProposal({
      caseId,
      authenticatedUserId: user.id,
      input,
    });

    return Response.json(
      {
        code: "PROPOSAL_CREATED",
        proposal: result.proposal,
        proposalLimit:
          result.proposalLimit,
        proposalCount:
          result.proposalCount,
      },
      {
        status: 201,
      },
    );
  });
}
