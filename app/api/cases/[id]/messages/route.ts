import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

const MAX_MESSAGE_LENGTH = 5000;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const caseId = Number(id);

    if (!Number.isInteger(caseId) || caseId <= 0) {
      return Response.json(
        {
          code: "INVALID_CASE_ID",
        },
        { status: 400 },
      );
    }

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        {
          code: "INVALID_REQUEST_BODY",
        },
        { status: 400 },
      );
    }

    const content =
      typeof body === "object" &&
      body !== null &&
      "content" in body
        ? String(body.content ?? "").trim()
        : "";

    if (!content) {
      return Response.json(
        {
          code: "MESSAGE_REQUIRED",
        },
        { status: 400 },
      );
    }

    if (content.length > MAX_MESSAGE_LENGTH) {
      return Response.json(
        {
          code: "MESSAGE_TOO_LONG",
          maxLength: MAX_MESSAGE_LENGTH,
        },
        { status: 400 },
      );
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
      include: {
        proposals: {
          where: {
            status: "ACCEPTED",
          },
          select: {
            company: {
              select: {
                ownerId: true,
              },
            },
            expert: {
              select: {
                ownerId: true,
              },
            },
          },
        },
      },
    });

    if (!tradeCase) {
      return Response.json(
        {
          code: "CASE_NOT_FOUND",
        },
        { status: 404 },
      );
    }

    if (tradeCase.status !== "IN_PROGRESS") {
      return Response.json(
        {
          code: "CASE_NOT_IN_PROGRESS",
        },
        { status: 400 },
      );
    }

    const acceptedProposal = tradeCase.proposals[0];

    const acceptedProviderUserId =
      acceptedProposal?.company?.ownerId ??
      acceptedProposal?.expert?.ownerId ??
      null;

    const isAdmin = user.role === "admin";
    const isCustomer = tradeCase.customerId === user.id;
    const isAcceptedProvider =
      acceptedProviderUserId === user.id;

    if (!isAdmin && !isCustomer && !isAcceptedProvider) {
      return Response.json(
        {
          code: "CASE_MESSAGE_ACCESS_DENIED",
        },
        { status: 403 },
      );
    }

    const message = await prisma.$transaction(async (tx) => {
      const createdMessage = await tx.caseMessage.create({
        data: {
          caseId,
          senderId: user.id,
          content,
        },
      });

      await tx.caseActivity.create({
        data: {
          caseId,
          userId: user.id,
          action: "MESSAGE_SENT",
          details: `${user.name ?? user.email} sent a message`,
        },
      });

      const receiverIds = new Set<number>();

      if (tradeCase.customerId !== user.id) {
        receiverIds.add(tradeCase.customerId);
      }

      if (
        acceptedProviderUserId &&
        acceptedProviderUserId !== user.id
      ) {
        receiverIds.add(acceptedProviderUserId);
      }

      if (receiverIds.size > 0) {
        await tx.notification.createMany({
          data: Array.from(receiverIds).map((receiverId) => ({
            userId: receiverId,
            title: "New case message",
            message: `${
              user.name ?? user.email
            } sent a new message in case: ${tradeCase.title}`,
            type: "CASE_MESSAGE",
            link: `/dashboard/cases/${tradeCase.id}`,
          })),
        });
      }

      return createdMessage;
    });

    return Response.json(
      {
        code: "CASE_MESSAGE_CREATED",
        message,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("CASE_MESSAGE_CREATE_FAILED", error);

    return Response.json(
      {
        code: "CASE_MESSAGE_CREATE_FAILED",
      },
      { status: 500 },
    );
  }
}