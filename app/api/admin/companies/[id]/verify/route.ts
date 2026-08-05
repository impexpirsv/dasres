import { apiHandler } from "../../../../../../lib/api";
import { requireAdmin } from "../../../../../../lib/auth";
import { verifyCompany } from "../../../../../../lib/companies/verify-company";
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
      await verifyCompany({
        companyId,
        authenticatedAdminId:
          admin.id,
      });

    if (result.alreadyVerified) {
      return Response.json({
        code:
          "COMPANY_ALREADY_VERIFIED",
        company: result.company,
      });
    }

    return Response.json({
      code: "COMPANY_VERIFIED",
      company: result.company,
    });
  });
}
