import "server-only";

export type TransactionalEmailContent = Readonly<{
  subject: string;
  text: string;
  html: string;
}>;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderEmail({
  heading,
  introduction,
  action,
  url,
  expiry,
  notice,
}: Readonly<{
  heading: string;
  introduction: string;
  action: string;
  url: URL;
  expiry: string;
  notice: string;
}>): Omit<TransactionalEmailContent, "subject"> {
  const canonicalUrl = url.toString();
  const safeUrl = escapeHtml(canonicalUrl);
  return {
    text: `${heading}\n\n${introduction}\n\n${action}: ${canonicalUrl}\n\n${expiry}\n\n${notice}\n\nDasres`,
    html: `<!doctype html><html lang="en" dir="auto"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head><body><main><h1>${escapeHtml(heading)}</h1><p>${escapeHtml(introduction)}</p><p><a href="${safeUrl}">${escapeHtml(action)}</a></p><p>If the button does not work, copy this link:</p><p><bdi dir="ltr">${safeUrl}</bdi></p><p>${escapeHtml(expiry)}</p><p>${escapeHtml(notice)}</p><p>Dasres</p></main></body></html>`,
  };
}

export function createPasswordResetEmailContent(
  resetUrl: URL,
  expiresAt: Date,
): TransactionalEmailContent {
  return {
    subject: "Reset your Dasres password",
    ...renderEmail({
      heading: "Reset your Dasres password",
      introduction: "We received a request to reset the password for your Dasres account.",
      action: "Reset password",
      url: resetUrl,
      expiry: `This link expires at ${expiresAt.toISOString()}.`,
      notice: "If you did not request this, you can ignore this email. Do not share or forward this link.",
    }),
  };
}

export function createEmailVerificationContent(
  verificationUrl: URL,
  expiresAt: Date,
): TransactionalEmailContent {
  return {
    subject: "Verify your email address for Dasres",
    ...renderEmail({
      heading: "Verify your email address",
      introduction: "Verify this email address to finish setting up your Dasres account.",
      action: "Verify email address",
      url: verificationUrl,
      expiry: `This link expires at ${expiresAt.toISOString()}.`,
      notice: "If you did not create a Dasres account, you can ignore this email.",
    }),
  };
}
