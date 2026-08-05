import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { AppError } from "../../../../../lib/errors";
import {
  createTicketReply,
  parseCreateTicketReplyInput,
} from "../../../../../lib/tickets";
import { parseId } from "../../../../../lib/validation";

async function readJsonBody(
  request: Request,
): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new AppError(
      "INVALID_JSON_BODY",
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
    const ticketId = parseId(
      id,
      "ticket id",
    );

    const body =
      await readJsonBody(request);

    const input =
      parseCreateTicketReplyInput(body);

    const result =
      await createTicketReply({
        ticketId,
        authenticatedUserId:
          user.id,
        message: input.message,
      });

    return Response.json(
      {
        code:
          "TICKET_REPLY_CREATED",
        message: result.message,
        ticketStatus:
          result.ticketStatus,
      },
      {
        status: 201,
      },
    );
  });
}
