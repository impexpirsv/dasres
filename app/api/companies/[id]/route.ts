import { apiHandler } from "../../../../lib/api";
import { getAuthenticatedUser, requireApiUser } from "../../../../lib/auth";
import {
  deleteCompany,
} from "../../../../lib/companies/delete-company";
import {
  getCompany,
  getCompanyViewAccess,
} from "../../../../lib/companies/get-company";
import { AppError } from "../../../../lib/errors";
import {
  parseUpdateCompanyInput,
  updateCompany,
} from "../../../../lib/companies/update-company";
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
    const companyId = parseId(
      id,
      "company id",
    );

    const company =
      await getCompany({
        companyId,
        viewer,
      });

    return Response.json({
      code: "COMPANY_LOADED",
      company,
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
    const companyId = parseId(
      id,
      "company id",
    );

    const access = await getCompanyViewAccess({
      companyId,
      viewer: user,
    });

    if (!access || access.visibility !== "private") {
      throw new AppError("COMPANY_NOT_FOUND", 404);
    }

    const input =
      await parseUpdateCompanyInput(
        request,
      );

    const result =
      await updateCompany({
        companyId,
        authenticatedUserId:
          user.id,
        input,
      });

    return Response.json({
      code: result.changed
        ? "COMPANY_UPDATED"
        : "COMPANY_UNCHANGED",
      company: result.company,
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
    const companyId = parseId(
      id,
      "company id",
    );

    await deleteCompany({
      companyId,
      authenticatedUserId:
        user.id,
    });

    return Response.json({
      code: "COMPANY_DELETED",
    });
  });
}
