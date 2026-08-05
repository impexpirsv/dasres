import { AppError } from "../errors";
import {
  CAPABILITIES,
  hasCapability,
  hasEveryCapability,
  hasAnyCapability,
  type Capability,
} from "./capabilities";
import type { AuthenticatedUser } from "./types";

export function assertCapability(
  user: AuthenticatedUser,
  capability: Capability,
): void {
  if (!hasCapability(user.role, capability)) {
    throw AppError.unauthorized();
  }
}

export function assertEveryCapability(
  user: AuthenticatedUser,
  capabilities: readonly Capability[],
): void {
  if (
    !hasEveryCapability(
      user.role,
      capabilities,
    )
  ) {
    throw AppError.unauthorized();
  }
}

export function assertAnyCapability(
  user: AuthenticatedUser,
  capabilities: readonly Capability[],
): void {
  if (
    !hasAnyCapability(user.role, capabilities)
  ) {
    throw AppError.unauthorized();
  }
}

export function assertAdmin(
  user: AuthenticatedUser,
): void {
  assertCapability(
    user,
    CAPABILITIES.ADMIN_ACCESS,
  );
}

export function canAccessAdmin(
  user: Pick<AuthenticatedUser, "role">,
): boolean {
  return hasCapability(
    user.role,
    CAPABILITIES.ADMIN_ACCESS,
  );
}
