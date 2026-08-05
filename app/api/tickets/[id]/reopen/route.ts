import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { reopenTicket } from "../../../../../lib/tickets";
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
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireUser();

    const { id } = await params;
    const ticketId = parseId(
      id,
      "ticket id",
    );

    const result = await reopenTicket({
      ticketId,
      authenticatedUserId: user.id,
    });

    if (result.alreadyReopened) {
      return Response.json({
        code: "TICKET_ALREADY_REOPENED",
        ticket: result.ticket,
      });
    }

    return Response.json({
      code: "TICKET_REOPENED",
      ticket: result.ticket,
    });
  });
}
