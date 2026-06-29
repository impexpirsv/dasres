import { AppError } from "./errors";

export async function apiHandler(
  handler: () => Promise<Response>,
): Promise<Response> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof AppError) {
      return Response.json(
        { message: error.message },
        { status: error.status },
      );
    }

    console.error("API_ERROR:", error);

    return Response.json(
      { message: "Internal server error." },
      { status: 500 },
    );
  }
}