import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();

    const { id } = await params;
    const body = await request.json();

    const content = String(body.content || "").trim();

    if (!content) {
      return Response.json(
        { message: "Message is required" },
        { status: 400 }
      );
    }

    await prisma.caseMessage.create({
      data: {
        caseId: Number(id),
        content,
      },
    });

    return Response.json({
      message: "Message added",
    });
  } catch {
    return Response.json(
      { message: "Failed to add message" },
      { status: 500 }
    );
  }
}