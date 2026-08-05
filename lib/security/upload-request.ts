import { AppError } from "../errors";

const MEBIBYTE = 1024 * 1024;

export const UPLOAD_REQUEST_LIMITS = {
  IMAGE: 6 * MEBIBYTE,
  CONFIDENTIAL_DOCUMENT: 11 * MEBIBYTE,
} as const;

export function assertUploadRequestSize(
  request: Request,
  maximumRequestBytes: number,
): void {
  const contentLength = request.headers.get("content-length");

  if (contentLength === null) return;

  if (!/^(0|[1-9]\d*)$/.test(contentLength)) {
    throw new AppError("INVALID_CONTENT_LENGTH", 400, {
      code: "INVALID_CONTENT_LENGTH",
    });
  }

  const declaredBytes = Number(contentLength);

  if (
    !Number.isSafeInteger(declaredBytes) ||
    declaredBytes > maximumRequestBytes
  ) {
    throw new AppError("PAYLOAD_TOO_LARGE", 413, {
      code: "PAYLOAD_TOO_LARGE",
    });
  }
}
