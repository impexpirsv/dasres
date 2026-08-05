import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { toggleSavedCompany } from "../../../../../lib/companies/toggle-saved-company";
import { parseId } from "../../../../../lib/validation";

export async function POST(
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
    const user = await requireUser();

    const { id } = await params;
    const companyId = parseId(
      id,
      "company id",
    );

    const result =
      await toggleSavedCompany({
        userId: user.id,
        companyId,
      });

    return Response.json(result);
  });
}
