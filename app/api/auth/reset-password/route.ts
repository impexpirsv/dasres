import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { apiHandler } from "../../../../lib/api";
import { hashPassword, isValidPassword } from "../../../../lib/auth/credentials";
import { hashIdentityToken, RESET_COOKIE_NAME, RESET_COOKIE_PATH, resetPasswordWithToken } from "../../../../lib/auth/identity-token";
import { enforceResetTokenRateLimit } from "../../../../lib/auth/recovery-rate-limit";
import { AppError } from "../../../../lib/errors";
import { parseBoundedJsonObject } from "../../../../lib/http/bounded-json";

function clearedCookie(response: NextResponse): NextResponse {
  response.cookies.set(RESET_COOKIE_NAME, "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: RESET_COOKIE_PATH, maxAge: 0 });
  return response;
}

export async function POST(request: Request) {
  return apiHandler(async () => {
    const token = (await cookies()).get(RESET_COOKIE_NAME)?.value ?? "";
    if (token) enforceResetTokenRateLimit(hashIdentityToken(token));

    const payload = await parseBoundedJsonObject(request);
    const password = typeof payload.password === "string" ? payload.password : "";
    const confirmation = typeof payload.confirmPassword === "string" ? payload.confirmPassword : "";
    if (!isValidPassword(password)) throw new AppError("RESET_PASSWORD_POLICY_INVALID", 400);
    if (password !== confirmation) throw new AppError("RESET_PASSWORD_CONFIRMATION_MISMATCH", 400);

    const passwordHash = await hashPassword(password);
    const succeeded = await resetPasswordWithToken(token, passwordHash);
    if (!succeeded) return clearedCookie(NextResponse.json({ code: "PASSWORD_RESET_TOKEN_INVALID" }, { status: 400 }));
    return clearedCookie(NextResponse.json({ code: "PASSWORD_RESET_SUCCESSFUL" }));
  });
}
