import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type ProposalRecord = {
  id: number;
  caseId: number;
  companyId: number | null;
  expertId: number | null;
  status: string;
};

type TradeCaseRecord = {
  id: number;
  acceptedProposalId: number | null;
};

type AuditResult = {
  name: string;
  count: number;
  severity: "critical" | "warning";
  details?: unknown;
};

function createCompositeKey(
  ...values: Array<
    string | number | null
  >
) {
  return values.join(":");
}

function findDuplicateKeys(
  keys: string[],
) {
  const counts = new Map<
    string,
    number
  >();

  for (const key of keys) {
    counts.set(
      key,
      (counts.get(key) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({
      key,
      count,
    }));
}

async function runAudit() {
  const [
    invalidTaskProgress,
    negativeTaskHours,
    invalidReviewRatings,
    proposals,
    tradeCases,
  ] = await Promise.all([
    prisma.projectTask.findMany({
      where: {
        OR: [
          {
            progress: {
              lt: 0,
            },
          },
          {
            progress: {
              gt: 100,
            },
          },
        ],
      },
      select: {
        id: true,
        projectId: true,
        progress: true,
      },
    }),

    prisma.projectTask.findMany({
      where: {
        OR: [
          {
            actualHours: {
              lt: 0,
            },
          },
          {
            estimatedHours: {
              lt: 0,
            },
          },
          {
            loggedHours: {
              lt: 0,
            },
          },
          {
            remainingHours: {
              lt: 0,
            },
          },
        ],
      },
      select: {
        id: true,
        projectId: true,
        actualHours: true,
        estimatedHours: true,
        loggedHours: true,
        remainingHours: true,
      },
    }),

    prisma.review.findMany({
      where: {
        OR: [
          {
            rating: {
              lt: 1,
            },
          },
          {
            rating: {
              gt: 5,
            },
          },
        ],
      },
      select: {
        id: true,
        caseId: true,
        reviewerId: true,
        reviewedUserId: true,
        rating: true,
      },
    }),

    prisma.caseProposal.findMany({
      select: {
        id: true,
        caseId: true,
        companyId: true,
        expertId: true,
        status: true,
      },
    }),

    prisma.tradeCase.findMany({
      select: {
        id: true,
        acceptedProposalId: true,
      },
    }),
  ]);

  const proposalRecords: ProposalRecord[] =
    proposals;

  const tradeCaseRecords: TradeCaseRecord[] =
    tradeCases;

 const proposalsWithoutCompany =
  proposalRecords.filter(
    (proposal) =>
      proposal.companyId === null,
  );

  const duplicateActiveCompanyProposals =
  findDuplicateKeys(
    proposalRecords
      .filter(
        (
          proposal,
        ): proposal is ProposalRecord & {
          companyId: number;
        } =>
          proposal.companyId !== null &&
          proposal.status !== "REJECTED",
      )
      .map((proposal) =>
        createCompositeKey(
          proposal.caseId,
          proposal.companyId,
        ),
      ),
  );

  const casesWithMultipleAcceptedProposals =
    findDuplicateKeys(
      proposalRecords
        .filter(
          (proposal) =>
            proposal.status ===
            "ACCEPTED",
        )
        .map((proposal) =>
          String(proposal.caseId),
        ),
    );

  const proposalsById = new Map(
    proposalRecords.map(
      (proposal) => [
        proposal.id,
        proposal,
      ],
    ),
  );

  const invalidAcceptedProposalReferences =
    tradeCaseRecords
      .filter(
        (
          tradeCase,
        ): tradeCase is TradeCaseRecord & {
          acceptedProposalId: number;
        } =>
          tradeCase.acceptedProposalId !==
          null,
      )
      .filter((tradeCase) => {
        const acceptedProposal =
          proposalsById.get(
            tradeCase.acceptedProposalId,
          );

        return (
          !acceptedProposal ||
          acceptedProposal.caseId !==
            tradeCase.id ||
          acceptedProposal.status !==
            "ACCEPTED"
        );
      })
      .map((tradeCase) => {
        const proposal =
          proposalsById.get(
            tradeCase.acceptedProposalId,
          );

        return {
          caseId: tradeCase.id,
          acceptedProposalId:
            tradeCase.acceptedProposalId,
          proposalCaseId:
            proposal?.caseId ?? null,
          proposalStatus:
            proposal?.status ?? null,
        };
      });

  const results: AuditResult[] = [
    {
      name: "Project tasks with progress outside 0–100",
      count:
        invalidTaskProgress.length,
      severity: "critical",
      details:
        invalidTaskProgress,
    },
    {
      name: "Project tasks with negative hour values",
      count:
        negativeTaskHours.length,
      severity: "critical",
      details:
        negativeTaskHours,
    },
    {
      name: "Reviews with rating outside 1–5",
      count:
        invalidReviewRatings.length,
      severity: "critical",
      details:
        invalidReviewRatings,
    },
   {
  name: "Proposals without a company",
  count:
    proposalsWithoutCompany.length,
  severity: "critical",
  details:
    proposalsWithoutCompany,
},
  
   {
  name: "Duplicate active company proposals for the same case",
  count:
    duplicateActiveCompanyProposals.length,
  severity: "critical",
  details:
    duplicateActiveCompanyProposals,
},
    {
      name: "Cases with multiple accepted proposals",
      count:
        casesWithMultipleAcceptedProposals.length,
      severity: "critical",
      details:
        casesWithMultipleAcceptedProposals,
    },
    {
      name: "Invalid acceptedProposalId references",
      count:
        invalidAcceptedProposalReferences.length,
      severity: "critical",
      details:
        invalidAcceptedProposalReferences,
    },
  ];

  console.log(
    "\nDasres database integrity audit\n",
  );

  for (const result of results) {
    const status =
      result.count === 0
        ? "PASS"
        : result.severity ===
            "critical"
          ? "FAIL"
          : "WARN";

    console.log(
      `[${status}] ${result.name}: ${result.count}`,
    );

    if (
      result.count > 0 &&
      result.details
    ) {
      console.dir(result.details, {
        depth: null,
      });
    }
  }

  const criticalIssueCount =
    results
      .filter(
        (result) =>
          result.severity ===
          "critical",
      )
      .reduce(
        (sum, result) =>
          sum + result.count,
        0,
      );

  console.log("");

  if (criticalIssueCount > 0) {
    console.error(
      `Database audit failed with ${criticalIssueCount} critical issue(s).`,
    );

    process.exitCode = 1;
    return;
  }

  console.log(
    "Database audit passed. No critical integrity issues were found.",
  );
}

runAudit()
  .catch((error: unknown) => {
    console.error(
      "Database audit could not be completed.",
    );

    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });