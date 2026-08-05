type LogLevel = "debug" | "info" | "warn" | "error";

type LogPrimitive =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined;

export type LogValue =
  | LogPrimitive
  | Date
  | Error
  | readonly LogValue[]
  | { readonly [key: string]: LogValue };

export type LogContext = Readonly<
  Record<string, LogValue>
>;

type LogEntry = {
  readonly timestamp: string;
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: Record<string, unknown>;
};

const REDACTED = "[REDACTED]";
const DEFAULT_REDACTED_KEYS = [
  "authorization",
  "cookie",
  "password",
  "secret",
  "token",
  "accesstoken",
  "refreshtoken",
  "sessiontoken",
  "apikey",
  "privatekey",
  "databaseurl",
  "connectionstring",
] as const;

const SENSITIVE_TEXT_PATTERNS = [
  /\b(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?):\/\/[^\s"']+/gi,
  /\bBearer\s+[A-Za-z0-9._~+/=-]+/gi,
  /\b(?:password|api[_-]?key|session[_-]?token|access[_-]?token|refresh[_-]?token)\s*[=:]\s*[^\s,;]+/gi,
] as const;

function normalizeKey(key: string): string {
  return key.replace(/[-_\s]/g, "").toLowerCase();
}

function shouldRedact(key: string): boolean {
  const normalizedKey = normalizeKey(key);

  return DEFAULT_REDACTED_KEYS.some(
    (redactedKey) =>
      normalizedKey.includes(redactedKey),
  );
}

function redactSensitiveText(value: string): string {
  return SENSITIVE_TEXT_PATTERNS.reduce(
    (redactedValue, pattern) =>
      redactedValue.replace(pattern, REDACTED),
    value,
  );
}

function serializeValue(
  value: LogValue,
  seen: WeakSet<object>,
): unknown {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (
    value === null ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (typeof value === "string") {
    return redactSensitiveText(value);
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: redactSensitiveText(value.message),
      stack: value.stack
        ? redactSensitiveText(value.stack)
        : undefined,
      cause:
        "cause" in value
          ? serializeUnknown(value.cause, seen)
          : undefined,
    };
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) =>
        serializeValue(item, seen),
      );
    }

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        shouldRedact(key)
          ? REDACTED
          : serializeValue(item, seen),
      ]),
    );
  }

  return String(value);
}

function serializeUnknown(
  value: unknown,
  seen = new WeakSet<object>(),
): unknown {
  if (value instanceof Error) {
    return serializeValue(value, seen);
  }

  if (
    value === null ||
    value === undefined ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint" ||
    value instanceof Date
  ) {
    return serializeValue(value as LogValue, seen);
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      serializeUnknown(item, seen),
    );
  }

  if (typeof value === "object") {
    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);

    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [
        key,
        shouldRedact(key)
          ? REDACTED
          : serializeUnknown(item, seen),
      ]),
    );
  }

  return String(value);
}

function writeLog(
  level: LogLevel,
  message: string,
  context?: LogContext,
): void {
  const normalizedMessage = message.trim();

  if (normalizedMessage.length === 0) {
    throw new TypeError(
      "Log message must be a non-empty string.",
    );
  }

  const serializedContext = context
    ? (serializeUnknown(context) as Record<
        string,
        unknown
      >)
    : undefined;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message: normalizedMessage,
    ...(serializedContext &&
    Object.keys(serializedContext).length > 0
      ? { context: serializedContext }
      : {}),
  };

  const output = JSON.stringify(entry);

  switch (level) {
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(output);
      }
      return;

    case "info":
      console.info(output);
      return;

    case "warn":
      console.warn(output);
      return;

    case "error":
      console.error(output);
  }
}

export type Logger = {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
  child(context: LogContext): Logger;
};

function mergeContexts(
  baseContext: LogContext,
  context?: LogContext,
): LogContext {
  return context
    ? { ...baseContext, ...context }
    : baseContext;
}

export function createLogger(
  baseContext: LogContext = {},
): Logger {
  return {
    debug(message, context) {
      writeLog(
        "debug",
        message,
        mergeContexts(baseContext, context),
      );
    },

    info(message, context) {
      writeLog(
        "info",
        message,
        mergeContexts(baseContext, context),
      );
    },

    warn(message, context) {
      writeLog(
        "warn",
        message,
        mergeContexts(baseContext, context),
      );
    },

    error(message, context) {
      writeLog(
        "error",
        message,
        mergeContexts(baseContext, context),
      );
    },

    child(context) {
      return createLogger({
        ...baseContext,
        ...context,
      });
    },
  };
}

export const logger = createLogger({
  service: "dasres-web",
});
