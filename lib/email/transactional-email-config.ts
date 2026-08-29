import "server-only";

import { AppError } from "../errors";

export type TransactionalEmailConfig = Readonly<{
  host: string;
  port: number;
  secure: boolean;
  username: string;
  password: string;
  from: string;
  replyTo?: string;
}>;

const CONTROL_CHARACTER_PATTERN = /[\u0000-\u001f\u007f]/;
const EMAIL_ADDRESS_PATTERN = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;
const NAMED_ADDRESS_PATTERN = /^([^<>]+)\s<([^<>]+)>$/;
const TCP_PORT_PATTERN = /^[0-9]+$/;
const PLACEHOLDER_CREDENTIAL_PATTERN = /^(?:change-?me|your[-_ ]|replace[-_ ]?with|replace-me|example|placeholder|username|password)/i;
const RESERVED_PLACEHOLDER_DOMAIN_PATTERN = /(?:^|\.)(?:example(?:\.com|\.net|\.org)?|invalid|test)$/i;

function isValidCredential(value: string, maximumLength: number): boolean {
  return Boolean(
    value.trim() &&
    value.length <= maximumLength &&
    !CONTROL_CHARACTER_PATTERN.test(value) &&
    !PLACEHOLDER_CREDENTIAL_PATTERN.test(value.trim()),
  );
}

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
  const host = process.env.SMTP_HOST?.trim() ?? "";
  const portValue = process.env.SMTP_PORT ?? "";
  const secureValue = process.env.SMTP_SECURE ?? "";
  const username = process.env.SMTP_USERNAME ?? "";
  const password = process.env.SMTP_PASSWORD ?? "";
  const from = process.env.TRANSACTIONAL_EMAIL_FROM?.trim() ?? "";
  const replyTo = process.env.TRANSACTIONAL_EMAIL_REPLY_TO?.trim() || undefined;
  const port = TCP_PORT_PATTERN.test(portValue) ? Number(portValue) : Number.NaN;

  if (
    !host ||
    host.length > 253 ||
    /\s/.test(host) ||
    CONTROL_CHARACTER_PATTERN.test(host) ||
    !Number.isInteger(port) ||
    port < 1 ||
    port > 65_535 ||
    (secureValue !== "true" && secureValue !== "false") ||
    !isValidCredential(username, 512) ||
    !isValidCredential(password, 1_024) ||
    !from ||
    from.length > 500 ||
    CONTROL_CHARACTER_PATTERN.test(from) ||
    !isValidFrom(from) ||
    (replyTo !== undefined &&
      (CONTROL_CHARACTER_PATTERN.test(replyTo) || !isValidMailbox(replyTo)))
  ) {
    invalidConfiguration();
  }

  return {
    host,
    port,
    secure: secureValue === "true",
    username,
    password,
    from,
    ...(replyTo ? { replyTo } : {}),
  };
}
