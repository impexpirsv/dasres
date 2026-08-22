import { isApplicationReady } from "../../../../lib/health/readiness";

export async function GET(): Promise<Response> {
  const ready = await isApplicationReady();
  return Response.json(
    { status: ready ? "ok" : "unavailable" },
    {
      status: ready ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
