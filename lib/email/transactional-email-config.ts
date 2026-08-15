import "server-only";

import { AppError } from "../errors";

export type TransactionalEmailConfig = Readonly<{
  apiKey: string;
  from: string;
  replyTo?: string;
}>;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const EMAIL_ADDRESS_PATTERN = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const NAMED_ADDRESS_PATTERN = /^([^<>]+)\s<([^<>]+)>$/;
const RESEND_API_KEY_PATTERN = /^re_[A-Za-z0-9_-]{8,}$/;
const RESERVED_PLACEHOLDER_DOMAIN_PATTERN = /(?:^|\.)(?:example(?:\.com|\.net|\.org)?|invalid|test)$/i;

function isValidMailbox(value: string): boolean {
  if (value.length > 320 || !EMAIL_ADDRESS_PATTERN.test(value)) return false;
  const domain = value.slice(value.lastIndexOf("@") + 1);
  return !RESERVED_PLACEHOLDER_DOMAIN_PATTERN.test(domain);
}

function isValidFrom(value: string): boolean {
  if (isValidMailbox(value)) return true;
  const match = NAMED_ADDRESS_PATTERN.exec(value);
  return Boolean(match && match[1].trim() && isValidMailbox(match[2].trim()));
}

function invalidConfiguration(): never {
  throw new AppError("TRANSACTIONAL_EMAIL_NOT_CONFIGURED", 503, {
    details: { category: "configuration" },
  });
}

export function getTransactionalEmailConfig(): TransactionalEmailConfig {
  const apiKey = process.env.RESEND_API_KEY?.trim() ?? "";
  const from = process.env.TRANSACTIONAL_EMAIL_FROM?.trim() ?? "";
  const replyTo = process.env.TRANSACTIONAL_EMAIL_REPLY_TO?.trim() || undefined;

  if (
    !RESEND_API_KEY_PATTERN.test(apiKey) ||
    apiKey.length > 512 ||
    CONTROL_CHARACTER_PATTERN.test(apiKey) ||
    !from ||
    from.length > 500 ||
    CONTROL_CHARACTER_PATTERN.test(from) ||
    !isValidFrom(from) ||
    (replyTo !== undefined &&
      (CONTROL_CHARACTER_PATTERN.test(replyTo) || !isValidMailbox(replyTo)))
  ) {
    invalidConfiguration();
  }

  return { apiKey, from, ...(replyTo ? { replyTo } : {}) };
}
