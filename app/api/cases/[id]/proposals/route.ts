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

    const message = String(body.message || "").trim();
    const price = String(body.price || "").trim();

    if (!message) {
      return Response.json(
        { message: "Proposal message is required" },
        { status: 400 }
      );
    }

    await prisma.caseProposal.create({
      data: {
        caseId: Number(id),
        message,
        price: price || null,
      },
    });

    return Response.json({
      message: "Proposal created",
    });
  } catch {
    return Response.json(
      { message: "Failed to create proposal" },
      { status: 500 }
    );
  }
}