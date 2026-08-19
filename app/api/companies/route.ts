import { apiHandler } from "../../../lib/api";
import { requireApiUser } from "../../../lib/auth";
import {
  createCompany,
  parseCreateCompanyInput,
} from "../../../lib/companies/create-company";

export const runtime = "nodejs";

export async function POST(
  request: Request,
): Promise<Response> {
  return apiHandler(async () => {
    const user = await requireApiUser();

    const input =
      await parseCreateCompanyInput(
        request,
      );

    const company =
      await createCompany({
        authenticatedUserId:
          user.id,
        input,
      });

    return Response.json(
      {
        code: "COMPANY_CREATED",
        company,
      },
      {
        status: 201,
      },
    );
  });
}
