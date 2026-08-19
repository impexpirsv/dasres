import { apiHandler } from "../../../../lib/api";
import { getAuthenticatedUser, requireApiUser } from "../../../../lib/auth";
import {
  deleteExpert,
} from "../../../../lib/experts/delete-expert";
import {
  getExpert,
  getExpertViewAccess,
} from "../../../../lib/experts/get-expert";
import { AppError } from "../../../../lib/errors";
import {
  parseUpdateExpertInput,
  updateExpert,
} from "../../../../lib/experts/update-expert";
import { parseId } from "../../../../lib/validation";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext,
): Promise<Response> {
  return apiHandler(async () => {
    const { id } = await params;
    const viewer = await getAuthenticatedUser();
    const expertId = parseId(
      id,
      "expert id",
    );

    const expert =
      await getExpert({
        expertId,
        viewer,
      });

    return Response.json({
      code: "EXPERT_LOADED",
      expert,
    });
  });
}

export async function PUT(
  request: Request,
  {
    params,
  }: RouteContext,
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireApiUser();

    const { id } = await params;
    const expertId = parseId(
      id,
      "expert id",
    );

    const access = await getExpertViewAccess({
      expertId,
      viewer: user,
    });

    if (!access || access.visibility !== "private") {
      throw new AppError("EXPERT_NOT_FOUND", 404);
    }

    const input =
      await parseUpdateExpertInput(
        request,
      );

    const expert =
      await updateExpert({
        expertId,
        authenticatedUserId:
          user.id,
        input,
      });

    return Response.json({
      code: "EXPERT_UPDATED",
      expert,
    });
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: RouteContext,
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireApiUser();

    const { id } = await params;
    const expertId = parseId(
      id,
      "expert id",
    );

    await deleteExpert({
      expertId,
      authenticatedUserId:
        user.id,
    });

    return Response.json({
      code: "EXPERT_DELETED",
    });
  });
}
