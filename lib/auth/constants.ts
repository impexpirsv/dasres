export const SESSION_COOKIE_NAME = "dasres_session_token";
export const LEGACY_USER_COOKIE_NAME = "dasres_user_id";

export const AUTH_ROLES = {
  USER: "user",
  ADMIN: "admin",
} as const;

export type AuthRole =
  (typeof AUTH_ROLES)[keyof typeof AUTH_ROLES];
