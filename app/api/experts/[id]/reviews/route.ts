export async function POST() {
  return Response.json(
    {
      code: "EXPERT_REVIEW_NOT_ALLOWED",
    },
    {
      status: 403,
    },
  );
}