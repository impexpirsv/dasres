import "server-only";

import net from "node:net";
import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

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

type MailTransport = Readonly<{
  sendMail(message: Mail.Options): Promise<unknown>;
}>;

type SocketCallback = (error: Error | null, options: { connection?: net.Socket }) => void;

type SmtpError = Readonly<{
  code?: unknown;
  command?: unknown;
  responseCode?: unknown;
}>;

const CONNECTION_TIMEOUT_MS = 5_000;
const GREETING_TIMEOUT_MS = 5_000;
const SOCKET_TIMEOUT_MS = 10_000;
const DELIVERY_TIMEOUT_MS = 15_000;
const MESSAGE_ID_PATTERN = /^[^\u0000-\u001f\u007f\s]{1,512}$/;

function createTransport(config: TransactionalEmailConfig): MailTransport {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.username, pass: config.password },
    connectionTimeout: CONNECTION_TIMEOUT_MS,
    greetingTimeout: GREETING_TIMEOUT_MS,
    socketTimeout: SOCKET_TIMEOUT_MS,
    getSocket(_options: SMTPTransport.Options, callback: SocketCallback) {
      const socket = net.connect({ host: config.host, port: config.port });
      let completed = false;

      const finish = (error?: Error): void => {
        if (completed) return;
        completed = true;
        socket.setTimeout(0);
        socket.removeListener("connect", handleConnect);
        socket.removeListener("error", finish);
        socket.removeListener("timeout", handleTimeout);
        if (error) {
          socket.destroy();
          callback(error, {});
          return;
        }
        callback(null, { connection: socket });
      };

      const handleConnect = (): void => finish();
      const handleTimeout = (): void => {
        const error = new Error("Connection timeout") as NodeJS.ErrnoException;
        error.code = "ETIMEDOUT";
        finish(error);
      };

      socket.once("connect", handleConnect);
      socket.once("error", finish);
      socket.setTimeout(CONNECTION_TIMEOUT_MS, handleTimeout);
    },
  });
}

function asSmtpError(error: unknown): SmtpError {
  return typeof error === "object" && error !== null ? error : {};
}

function mapSmtpError(error: unknown): TransactionalEmailFailureCategory {
  const smtpError = asSmtpError(error);
  const code = typeof smtpError.code === "string" ? smtpError.code.toUpperCase() : "";
  const command = typeof smtpError.command === "string" ? smtpError.command.toUpperCase() : "";
  const responseCode = typeof smtpError.responseCode === "number" ? smtpError.responseCode : undefined;

  if (code === "ETIMEDOUT") return "timeout";
  if (code === "EAUTH" || command === "AUTH" || responseCode === 530 || responseCode === 534 || responseCode === 535 || responseCode === 538) return "authentication";
  if (code === "ECONNECTION" || code === "EDNS" || code === "ESOCKET" || code === "ECONNREFUSED" || code === "ECONNRESET" || code === "EHOSTUNREACH" || code === "ENETUNREACH") return "network";
  if (code === "ECONFIG") return "configuration";
  if (responseCode === 452) return "rate_limited";
  if (responseCode !== undefined && responseCode >= 400 && responseCode < 500) return "provider_unavailable";
  if (code === "EENVELOPE" || code === "EMESSAGE" || (responseCode !== undefined && responseCode >= 500 && responseCode < 600)) return "validation";
  return "invalid_response";
}

function getMessageId(result: unknown): string {
  if (typeof result !== "object" || result === null || !("messageId" in result)) {
    throw new TransactionalEmailDeliveryError("invalid_response");
  }
  const messageId = result.messageId;
  if (typeof messageId !== "string" || !MESSAGE_ID_PATTERN.test(messageId)) {
    throw new TransactionalEmailDeliveryError("invalid_response");
  }
  return messageId;
}

export class SmtpTransactionalEmailProvider implements TransactionalEmailProvider {
  private readonly transport: MailTransport;

  constructor(
    private readonly config: TransactionalEmailConfig = getTransactionalEmailConfig(),
    transport?: MailTransport,
    private readonly deliveryTimeoutMs = DELIVERY_TIMEOUT_MS,
  ) {
    this.transport = transport ?? createTransport(config);
  }

  async sendPasswordReset(message: PasswordResetEmail): Promise<void> {
    await this.send("password_reset", message.recipient, createPasswordResetEmailContent(message.resetUrl, message.expiresAt));
  }

  async sendEmailVerification(message: EmailVerificationEmail): Promise<void> {
    await this.send("email_verification", message.recipient, createEmailVerificationContent(message.verificationUrl, message.expiresAt));
  }

  private async send(messageType: "password_reset" | "email_verification", recipient: string, content: TransactionalEmailContent): Promise<void> {
    const startedAt = Date.now();
    let timeout: ReturnType<typeof setTimeout> | undefined;
    try {
      const delivery = this.transport.sendMail({
        from: this.config.from,
        to: recipient,
        ...(this.config.replyTo ? { replyTo: this.config.replyTo } : {}),
        subject: content.subject,
        text: content.text,
        html: content.html,
      });
      const timeoutFailure = new Promise<never>((_resolve, reject) => {
        timeout = setTimeout(() => reject(new TransactionalEmailDeliveryError("timeout")), this.deliveryTimeoutMs);
      });
      const messageId = getMessageId(await Promise.race([delivery, timeoutFailure]));
      logger.info("Transactional email delivered.", {
        provider: "smtp",
        messageType,
        durationMs: Date.now() - startedAt,
        providerMessageId: messageId,
      });
    } catch (error) {
      const deliveryError = error instanceof TransactionalEmailDeliveryError
        ? error
        : new TransactionalEmailDeliveryError(mapSmtpError(error));
      logger.error("Transactional email delivery failed.", {
        provider: "smtp",
        messageType,
        category: deliveryError.category,
        durationMs: Date.now() - startedAt,
      });
      throw deliveryError;
    } finally {
      if (timeout !== undefined) clearTimeout(timeout);
    }
  }
}
