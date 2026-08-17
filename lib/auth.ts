import { redirect } from "next/navigation";
import { AppError } from "./errors";
import {
  CAPABILITIES,
  hasCapability,
  type Capability,
} from "./auth/capabilities";
import { getAuthenticatedUser } from "./auth/session-service";
import type { AuthenticatedUser } from "./auth/types";

export {
  CAPABILITIES,
  getRoleCapabilities,
  hasAnyCapability,
  hasCapability,
  hasEveryCapability,
  normalizeAuthRole,
  type Capability,
} from "./auth/capabilities";
export {
  assertAdmin,
  assertAnyCapability,
  assertCapability,
  assertEveryCapability,
  canAccessAdmin,
} from "./auth/policies";
export {
  getAuthenticatedUser,
  getCurrentSession,
} from "./auth/session-service";
export type {
  AuthenticatedSession,
  AuthenticatedUser,
} from "./auth/types";

export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  return getAuthenticatedUser();
}

export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requireApiUser(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();

  if (!user) {
    throw new AppError("AUTHENTICATION_REQUIRED", 401);
  }

  return user;
}

export async function requireCapability(
  capability: Capability,
): Promise<AuthenticatedUser> {
  const user = await requireUser();

  if (!hasCapability(user.role, capability)) {
    redirect("/dashboard");
  }

  return user;
}

export async function requireAdmin(): Promise<AuthenticatedUser> {
  return requireCapability(
    CAPABILITIES.ADMIN_ACCESS,
  );
}
