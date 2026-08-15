import "server-only";

import { AppError } from "../errors";

export async function parseBoundedJsonObject(request: Request, maximumBytes = 16 * 1024): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase();
  if (contentType !== "application/json") throw new AppError("UNSUPPORTED_MEDIA_TYPE", 415);

  const contentLength = request.headers.get("content-length");
  if (contentLength !== null) {
    const parsed = Number(contentLength);
    if (!Number.isSafeInteger(parsed) || parsed < 0) throw new AppError("INVALID_CONTENT_LENGTH", 400);
    if (parsed > maximumBytes) throw new AppError("REQUEST_BODY_TOO_LARGE", 413);
  }

  if (!request.body) throw new AppError("INVALID_JSON_BODY", 400);

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  try {
    while (true) {
      const result = await reader.read();
      if (result.done) break;
      receivedBytes += result.value.byteLength;
      if (receivedBytes > maximumBytes) {
        await reader.cancel();
        throw new AppError("REQUEST_BODY_TOO_LARGE", 413);
      }
      chunks.push(result.value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(receivedBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown;
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError("INVALID_JSON_BODY", 400);
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new AppError("INVALID_REQUEST_BODY", 400);
  return body as Record<string, unknown>;
}
