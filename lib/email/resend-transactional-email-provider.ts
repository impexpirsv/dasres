import "server-only";

import { logger } from "../logger";
import { getTransactionalEmailConfig, type TransactionalEmailConfig } from "./transactional-email-config";
import { createEmailVerificationContent, createPasswordResetEmailContent, type TransactionalEmailContent } from "./transactional-email-content";
import type { EmailVerificationEmail, PasswordResetEmail, TransactionalEmailProvider } from "./transactional-email";

export type TransactionalEmailFailureCategory =
  | "timeout"
  | "network"
  | "authentication"
  | "configuration"
  | "validation"
  | "rate_limited"
  | "provider_unavailable"
  | "invalid_response";

export class TransactionalEmailDeliveryError extends Error {
  constructor(readonly category: TransactionalEmailFailureCategory) {
    super("Transactional email delivery failed.");
    this.name = "TransactionalEmailDeliveryError";
  }
}

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DELIVERY_TIMEOUT_MS = 5_000;
const MAXIMUM_RESPONSE_BYTES = 16_384;
const PROVIDER_MESSAGE_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,255}$/;

type FetchImplementation = typeof fetch;

function mapStatus(status: number): TransactionalEmailFailureCategory {
  if (status === 401 || status === 403) return "authentication";
  if (status === 429) return "rate_limited";
  if (status >= 500) return "provider_unavailable";
  if (status >= 400) return "validation";
  return "invalid_response";
}

async function readBoundedResponse(response: Response): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let size = 0;
  let text = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return text + decoder.decode();
      size += value.byteLength;
      if (size > MAXIMUM_RESPONSE_BYTES) {
        await reader.cancel();
        throw new TransactionalEmailDeliveryError("invalid_response");
      }
      text += decoder.decode(value, { stream: true });
    }
  } finally {
    reader.releaseLock();
  }
}

function parseMessageId(body: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new TransactionalEmailDeliveryError("invalid_response");
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("id" in parsed) ||
    typeof parsed.id !== "string" ||
    !PROVIDER_MESSAGE_ID_PATTERN.test(parsed.id)
  ) {
    throw new TransactionalEmailDeliveryError("invalid_response");
  }
  return parsed.id;
}

export class ResendTransactionalEmailProvider implements TransactionalEmailProvider {
  constructor(
    private readonly config: TransactionalEmailConfig = getTransactionalEmailConfig(),
    private readonly fetchImplementation: FetchImplementation = fetch,
    private readonly timeoutMs = DELIVERY_TIMEOUT_MS,
  ) {}

  async sendPasswordReset(message: PasswordResetEmail): Promise<void> {
    await this.send("password_reset", message.recipient, createPasswordResetEmailContent(message.resetUrl, message.expiresAt));
  }

  async sendEmailVerification(message: EmailVerificationEmail): Promise<void> {
    await this.send("email_verification", message.recipient, createEmailVerificationContent(message.verificationUrl, message.expiresAt));
  }

  private async send(
    messageType: "password_reset" | "email_verification",
    recipient: string,
    content: TransactionalEmailContent,
  ): Promise<void> {
    const startedAt = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      let response: Response;
      try {
        response = await this.fetchImplementation(RESEND_ENDPOINT, {
          method: "POST",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            Authorization: `Bearer ${this.config.apiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "Dasres/1.0 transactional-email",
          },
          body: JSON.stringify({
            from: this.config.from,
            to: [recipient],
            ...(this.config.replyTo ? { reply_to: this.config.replyTo } : {}),
            subject: content.subject,
            text: content.text,
            html: content.html,
          }),
        });
      } catch (error) {
        throw new TransactionalEmailDeliveryError(
          controller.signal.aborted || (error instanceof Error && error.name === "AbortError")
            ? "timeout"
            : "network",
        );
      }

      const responseBody = await readBoundedResponse(response);
      if (!response.ok) throw new TransactionalEmailDeliveryError(mapStatus(response.status));
      const messageId = parseMessageId(responseBody);
      logger.info("Transactional email delivered.", {
        provider: "resend",
        messageType,
        durationMs: Date.now() - startedAt,
        providerMessageId: messageId,
      });
    } catch (error) {
      const deliveryError =
        error instanceof TransactionalEmailDeliveryError
          ? error
          : new TransactionalEmailDeliveryError(
              controller.signal.aborted ? "timeout" : "invalid_response",
            );
      logger.error("Transactional email delivery failed.", {
        provider: "resend",
        messageType,
        category: deliveryError.category,
        durationMs: Date.now() - startedAt,
      });
      throw deliveryError;
    } finally {
      clearTimeout(timeout);
    }
  }
}
