export async function POST() {
  return Response.json(
    {
      message:
        "Expert reviews can only be submitted after a completed trade case.",
    },
    { status: 403 }
  );
}