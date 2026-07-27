import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const caseId = 18;
  const companyId = 10;

  const tradeCase =
    await prisma.tradeCase.findUnique({
      where: {
        id: caseId,
      },
      select: {
        id: true,
        title: true,
        status: true,
        customerId: true,
        assignedToId: true,
        acceptedProposalId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  const proposals =
    await prisma.caseProposal.findMany({
      where: {
        caseId,
        companyId,
      },
      orderBy: [
        {
          createdAt: "asc",
        },
        {
          id: "asc",
        },
      ],
      select: {
        id: true,
        caseId: true,
        companyId: true,
        expertId: true,
        message: true,
        price: true,
        status: true,
        createdAt: true,
        company: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
        expert: {
          select: {
            id: true,
            name: true,
            ownerId: true,
          },
        },
      },
    });

  console.log(
    "\nTrade case:\n",
  );

  console.dir(tradeCase, {
    depth: null,
  });

  console.log(
    "\nDuplicate proposals:\n",
  );

  console.dir(proposals, {
    depth: null,
  });

  if (
    tradeCase?.acceptedProposalId
  ) {
    console.log(
      "\nAccepted proposal ID:",
      tradeCase.acceptedProposalId,
    );
  }
}

main()
  .catch((error: unknown) => {
    console.error(
      "Could not inspect duplicate proposals.",
    );

    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });