import { apiHandler } from "../../../../../lib/api";
import { requireUser } from "../../../../../lib/auth";
import { toggleSavedExpert } from "../../../../../lib/experts/toggle-saved-expert";
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
    const expertId = parseId(
      id,
      "expert id",
    );

    const result =
      await toggleSavedExpert({
        userId: user.id,
        expertId,
      });

    return Response.json(result);
  });
}
