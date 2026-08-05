import { Prisma } from "@prisma/client";

import { AppError } from "../errors";
import { prisma } from "../prisma";
import {
  OPPORTUNITY_SELECT,
  type OpportunityResponse,
} from "./opportunity-select";

function mapOpportunityReadError(
  error: unknown,
): never {
  if (
    error instanceof
    Prisma.PrismaClientValidationError
  ) {
    throw new AppError(
      "INVALID_OPPORTUNITY_ID",
      400,
    );
  }

  throw error;
}

export async function getOpportunity({
  opportunityId,
}: {
  opportunityId: number;
}): Promise<OpportunityResponse> {
  try {
    const opportunity =
      await prisma.opportunity.findUnique({
        where: {
          id: opportunityId,
        },
        select:
          OPPORTUNITY_SELECT,
      });

    if (!opportunity) {
      throw new AppError(
        "OPPORTUNITY_NOT_FOUND",
        404,
      );
    }

    return opportunity;
  } catch (error) {
    mapOpportunityReadError(
      error,
    );
  }
}
