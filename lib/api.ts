import { headers } from "next/headers";

import { AppError } from "./errors";
import { logger } from "./logger";

const INTERNAL_ERROR_MESSAGE =
  "INTERNAL_SERVER_ERROR";
const REQUEST_ID_PATTERN =
  /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/;
const MAX_DETAIL_DEPTH = 8;
const MAX_DETAIL_ENTRIES = 1_000;
const SENSITIVE_DETAIL_KEYS = [
  "authorization",
  "cookie",
  "password",
  "secret",
  "token",
  "apikey",
  "privatekey",
  "databaseurl",
] as const;

type DetailInspectionState = {
  entries: number;
  seen: WeakSet<object>;
};

function normalizeDetailKey(key: string): string {
  return key.replace(/[-_\s]/g, "").toLowerCase();
}

function isSensitiveDetailKey(key: string): boolean {
  const normalizedKey = normalizeDetailKey(key);

  return SENSITIVE_DETAIL_KEYS.some(
    (sensitiveKey) =>
      normalizedKey.includes(sensitiveKey),
  );
}

function isClientSafeDetailValue(
  value: unknown,
  state: DetailInspectionState,
  depth = 0,
): boolean {
  if (
    depth > MAX_DETAIL_DEPTH ||
    state.entries > MAX_DETAIL_ENTRIES
  ) {
    return false;
  }

  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (typeof value === "number") {
    return Number.isFinite(value);
  }

  if (typeof value !== "object") {
    return false;
  }

  if (state.seen.has(value)) {
    return false;
  }

  state.seen.add(value);

  if (Array.isArray(value)) {
    state.entries += value.length;

    return value.every((item) =>
      isClientSafeDetailValue(
        item,
        state,
        depth + 1,
      ),
    );
  }

  const prototype = Object.getPrototypeOf(value);

  if (
    prototype !== Object.prototype &&
    prototype !== null
  ) {
    return false;
  }

  const entries = Object.entries(value);
  state.entries += entries.length;

  return entries.every(
    ([key, item]) =>
      !isSensitiveDetailKey(key) &&
      isClientSafeDetailValue(
        item,
        state,
        depth + 1,
      ),
  );
}

function hasClientSafeDetails(
  error: AppError,
): boolean {
  return (
    error.expose &&
    error.exposeDetails &&
    error.details !== undefined &&
    isClientSafeDetailValue(error.details, {
      entries: 0,
      seen: new WeakSet<object>(),
    })
  );
}

async function getRequestId(): Promise<string> {
  try {
    const incomingRequestId =
      (await headers()).get("x-request-id")?.trim();

    if (
      incomingRequestId &&
      REQUEST_ID_PATTERN.test(incomingRequestId)
    ) {
      return incomingRequestId;
    }
  } catch {
    // apiHandler can also be exercised outside a Next.js request context.
  }

  return crypto.randomUUID();
}

function withRequestId(
  response: Response,
  requestId: string,
): Response {
  try {
    response.headers.set(
      "x-request-id",
      requestId,
    );

    return response;
  } catch {
    // Some Fetch API responses expose immutable headers.
  }

  const responseHeaders = new Headers(
    response.headers,
  );
  responseHeaders.set("x-request-id", requestId);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
}

function createErrorResponse(
  error: unknown,
  requestId: string,
): Response {
  const appError =
    error instanceof AppError ? error : null;
  const isExposed = appError?.expose === true;
  const status = appError?.status ?? 500;
  const errorCode = isExposed
    ? appError.code
    : INTERNAL_ERROR_MESSAGE;
  const errorName =
    error instanceof Error
      ? error.name
      : "UnknownError";
  const stack =
    error instanceof Error
      ? error.stack
      : undefined;
  const logContext = {
    requestId,
    errorName,
    errorCode,
    status,
    stack,
  };

  if (isExposed && status < 500) {
    logger.warn("API request failed.", logContext);
  } else {
    logger.error("API request failed.", logContext);
  }

  const body = isExposed
    ? {
        message: appError.message,
        code: appError.code,
        ...(hasClientSafeDetails(appError)
          ? { details: appError.details }
          : {}),
        requestId,
      }
    : {
        message: INTERNAL_ERROR_MESSAGE,
        code: INTERNAL_ERROR_MESSAGE,
        requestId,
      };

  return Response.json(body, {
    status,
    headers: {
      "x-request-id": requestId,
    },
  });
}

export async function apiHandler(
  handler: () => Promise<Response>,
): Promise<Response> {
  const requestId = await getRequestId();

  try {
    return withRequestId(
      await handler(),
      requestId,
    );
  } catch (error) {
    return createErrorResponse(error, requestId);
  }
}
