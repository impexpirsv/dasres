import { NextResponse } from "next/server";

import { apiHandler } from "../../../../lib/api";
import { verifyEmailWithToken } from "../../../../lib/auth/identity-token";
import { createEmailVerificationPageUrl } from "../../../../lib/email/verification-email";

export async function GET(request: Request): Promise<Response> {
  return apiHandler(async () => {
    const rawToken = new URL(request.url).searchParams.get("token") ?? "";
    const result = await verifyEmailWithToken(rawToken);
    const status = result === "verified" ? "success" : result;
    const response = NextResponse.redirect(createEmailVerificationPageUrl(status), 303);
    response.headers.set("Cache-Control", "no-store");
    return response;
  });
}
