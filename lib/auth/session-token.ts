import {
  createHash,
  randomBytes,
} from "node:crypto";

const SESSION_TOKEN_BYTE_LENGTH = 32;
const SESSION_TOKEN_LENGTH = 43;
const SESSION_TOKEN_PATTERN =
  /^[A-Za-z0-9_-]{43}$/;

export function generateSessionToken(): string {
  return randomBytes(
    SESSION_TOKEN_BYTE_LENGTH,
  ).toString("base64url");
}

export function hashSessionToken(
  value: string | undefined,
): string | null {
  if (
    value === undefined ||
    value.length !== SESSION_TOKEN_LENGTH ||
    !SESSION_TOKEN_PATTERN.test(value)
  ) {
    return null;
  }

  return createHash("sha256")
    .update(value, "utf8")
    .digest("hex");
}
