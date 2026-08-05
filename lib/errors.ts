export const APP_ERROR_CODES = {
  BAD_REQUEST: "BAD_REQUEST",
  VALIDATION_ERROR: "VALIDATION_ERROR",
  UNAUTHENTICATED: "UNAUTHENTICATED",
  UNAUTHORIZED: "UNAUTHORIZED",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  RATE_LIMITED: "RATE_LIMITED",
  PRECONDITION_FAILED: "PRECONDITION_FAILED",
  PAYLOAD_TOO_LARGE: "PAYLOAD_TOO_LARGE",
  UNSUPPORTED_MEDIA_TYPE: "UNSUPPORTED_MEDIA_TYPE",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  INTERNAL_ERROR: "INTERNAL_ERROR",
} as const;

export type AppErrorCode =
  (typeof APP_ERROR_CODES)[keyof typeof APP_ERROR_CODES];

export type AppErrorDetails =
  | Record<string, unknown>
  | readonly unknown[]
  | string
  | number
  | boolean
  | null;

export type AppErrorOptions = {
  code?: AppErrorCode | (string & {});
  details?: AppErrorDetails;
  expose?: boolean;
  exposeDetails?: boolean;
  cause?: unknown;
};

const HTTP_STATUS_MIN = 400;
const HTTP_STATUS_MAX = 599;

function isValidHttpErrorStatus(
  status: number,
): boolean {
  return (
    Number.isInteger(status) &&
    status >= HTTP_STATUS_MIN &&
    status <= HTTP_STATUS_MAX
  );
}

function getDefaultCode(
  status: number,
): AppErrorCode {
  switch (status) {
    case 400:
      return APP_ERROR_CODES.BAD_REQUEST;

    case 401:
      return APP_ERROR_CODES.UNAUTHENTICATED;

    case 403:
      return APP_ERROR_CODES.UNAUTHORIZED;

    case 404:
      return APP_ERROR_CODES.NOT_FOUND;

    case 409:
      return APP_ERROR_CODES.CONFLICT;

    case 412:
      return APP_ERROR_CODES.PRECONDITION_FAILED;

    case 413:
      return APP_ERROR_CODES.PAYLOAD_TOO_LARGE;

    case 415:
      return APP_ERROR_CODES.UNSUPPORTED_MEDIA_TYPE;

    case 422:
      return APP_ERROR_CODES.VALIDATION_ERROR;

    case 429:
      return APP_ERROR_CODES.RATE_LIMITED;

    case 503:
      return APP_ERROR_CODES.SERVICE_UNAVAILABLE;

    default:
      return status >= 500
        ? APP_ERROR_CODES.INTERNAL_ERROR
        : APP_ERROR_CODES.BAD_REQUEST;
  }
}

export class AppError extends Error {
  readonly status: number;
  readonly code: AppErrorCode | (string & {});
  readonly details?: AppErrorDetails;
  readonly expose: boolean;
  readonly exposeDetails: boolean;
  readonly cause?: unknown;

  constructor(
    message: string,
    status = 500,
    options: AppErrorOptions = {},
  ) {
    if (
      typeof message !== "string" ||
      message.trim().length === 0
    ) {
      throw new TypeError(
        "AppError message must be a non-empty string.",
      );
    }

    if (!isValidHttpErrorStatus(status)) {
      throw new RangeError(
        `AppError status must be an integer between ${HTTP_STATUS_MIN} and ${HTTP_STATUS_MAX}.`,
      );
    }

    super(message.trim());

    this.name = "AppError";
    this.status = status;
    this.code =
      options.code ?? getDefaultCode(status);
    this.details = options.details;
    this.expose =
      options.expose ?? status < 500;
    this.exposeDetails =
      options.exposeDetails ?? false;
    this.cause = options.cause;

    Object.setPrototypeOf(
      this,
      new.target.prototype,
    );

    if (
      Error.captureStackTrace
    ) {
      Error.captureStackTrace(
        this,
        new.target,
      );
    }
  }

  static badRequest(
    message = "Bad request.",
    options: Omit<
      AppErrorOptions,
      "code"
    > & {
      code?: AppErrorCode | (string & {});
    } = {},
  ): AppError {
    return new AppError(message, 400, {
      code:
        options.code ??
        APP_ERROR_CODES.BAD_REQUEST,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static validation(
    message = "Validation failed.",
    details?: AppErrorDetails,
    options: Omit<
      AppErrorOptions,
      "code" | "details"
    > = {},
  ): AppError {
    return new AppError(message, 422, {
      code:
        APP_ERROR_CODES.VALIDATION_ERROR,
      details,
      expose: options.expose,
      exposeDetails: details !== undefined,
      cause: options.cause,
    });
  }

  static unauthenticated(
    message = "Authentication is required.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 401, {
      code:
        APP_ERROR_CODES.UNAUTHENTICATED,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static unauthorized(
    message = "You are not authorized to perform this action.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 403, {
      code:
        APP_ERROR_CODES.UNAUTHORIZED,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static notFound(
    message = "Resource not found.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 404, {
      code: APP_ERROR_CODES.NOT_FOUND,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static conflict(
    message = "The request conflicts with the current resource state.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 409, {
      code: APP_ERROR_CODES.CONFLICT,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static preconditionFailed(
    message = "A required precondition was not met.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 412, {
      code:
        APP_ERROR_CODES
          .PRECONDITION_FAILED,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static payloadTooLarge(
    message = "Request payload is too large.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 413, {
      code:
        APP_ERROR_CODES.PAYLOAD_TOO_LARGE,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static unsupportedMediaType(
    message = "Unsupported media type.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 415, {
      code:
        APP_ERROR_CODES
          .UNSUPPORTED_MEDIA_TYPE,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static rateLimited(
    message = "Too many requests.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 429, {
      code:
        APP_ERROR_CODES.RATE_LIMITED,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static serviceUnavailable(
    message = "Service is temporarily unavailable.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 503, {
      code:
        APP_ERROR_CODES
          .SERVICE_UNAVAILABLE,
      details: options.details,
      expose: options.expose,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }

  static internal(
    message = "Internal server error.",
    options: Omit<
      AppErrorOptions,
      "code"
    > = {},
  ): AppError {
    return new AppError(message, 500, {
      code:
        APP_ERROR_CODES.INTERNAL_ERROR,
      details: options.details,
      expose: options.expose ?? false,
      exposeDetails: options.exposeDetails,
      cause: options.cause,
    });
  }
}

export function isAppError(
  error: unknown,
): error is AppError {
  return error instanceof AppError;
}

export function toAppError(
  error: unknown,
  fallbackMessage = "Internal server error.",
): AppError {
  if (isAppError(error)) {
    return error;
  }

  return AppError.internal(
    fallbackMessage,
    {
      cause: error,
    },
  );
}

export function getErrorMessage(
  error: unknown,
  fallback = "An unexpected error occurred.",
): string {
  if (
    error instanceof Error &&
    error.message.trim().length > 0
  ) {
    return error.message;
  }

  if (
    typeof error === "string" &&
    error.trim().length > 0
  ) {
    return error.trim();
  }

  return fallback;
}
