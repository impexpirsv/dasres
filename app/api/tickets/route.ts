import { apiHandler } from "../../../lib/api";
import { requireUser } from "../../../lib/auth";
import {
  createTicket,
  createTicketNotifications,
  parseCreateTicketPayload,
} from "../../../lib/tickets";

export async function POST(
  request: Request,
): Promise<Response> {
  return apiHandler(async () => {
    const sessionUser =
      await requireUser();

    const payload =
      await parseCreateTicketPayload(
        request,
      );

    const result =
      await createTicket({
        authenticatedUserId:
          sessionUser.id,
        payload,
      });

    await createTicketNotifications({
      adminIds: result.adminIds,
      ticketId:
        result.ticket.id,
      subject:
        result.ticket.subject,
      actorDisplayName:
        result.actorDisplayName,
    });

    return Response.json(
      {
        code: "TICKET_CREATED",
        ticket: result.ticket,
      },
      {
        status: 201,
      },
    );
  });
}
