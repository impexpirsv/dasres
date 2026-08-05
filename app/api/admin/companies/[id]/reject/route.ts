import { apiHandler } from "../../../../../../lib/api";
import { requireAdmin } from "../../../../../../lib/auth";
import { rejectCompany } from "../../../../../../lib/companies/reject-company";
import { parseId } from "../../../../../../lib/validation";

export async function PATCH(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      id: string;
    }>;
  },
): Promise<Response> {
  return apiHandler(async () => {
    const admin = await requireAdmin();

    const { id } = await params;
    const companyId = parseId(
      id,
      "company id",
    );

    const result =
      await rejectCompany({
        companyId,
        authenticatedAdminId:
          admin.id,
      });

    if (result.alreadyRejected) {
      return Response.json({
        code:
          "COMPANY_ALREADY_REJECTED",
        company: result.company,
      });
    }

    return Response.json({
      code: "COMPANY_REJECTED",
      company: result.company,
    });
  });
}
