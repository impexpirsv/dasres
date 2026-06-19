import { prisma } from "../../../../../lib/prisma";
import { requireUser } from "../../../../../lib/auth";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();

    const { id } = await params;
    const caseId = Number(id);

    if (!caseId || Number.isNaN(caseId)) {
      return Response.json(
        { message: "Invalid case id" },
        { status: 400 }
      );
    }

    const tradeCase = await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
    });

    if (!tradeCase) {
      return Response.json(
        { message: "Case not found" },
        { status: 404 }
      );
    }

    const isAdmin = user.role === "admin";
    const isCustomer = tradeCase.customerId === user.id;

    if (!isAdmin && !isCustomer) {
      return Response.json(
        {
          message:
            "You can only complete your own case.",
        },
        { status: 403 }
      );
    }

    if (tradeCase.status !== "IN_PROGRESS") {
      return Response.json(
        {
          message:
            "Only in-progress cases can be completed.",
        },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
  await tx.tradeCase.update({
    where: {
      id: caseId,
    },
    data: {
      status: "COMPLETED",
    },
  });

  await tx.caseStep.updateMany({
    where: {
      caseId,
    },
    data: {
      completed: true,
    },
  });

  await tx.caseActivity.create({
    data: {
      caseId,
      userId: user.id,
      action: "CASE_COMPLETED",
      details: `${user.name || user.email} completed this case`,
    },
  });
});

    return Response.json({
      message: "Case completed",
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { message: "Failed to complete case" },
      { status: 500 }
    );
  }
}