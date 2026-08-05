import {
  AUTH_ROLES,
  type AuthRole,
} from "./constants";

export const CAPABILITIES = {
  DASHBOARD_ACCESS: "dashboard:access",
  ADMIN_ACCESS: "admin:access",
  USER_MANAGE: "user:manage",
  DIRECTORY_VERIFY: "directory:verify",
  OPPORTUNITY_MANAGE: "opportunity:manage",
  PROJECT_ADMINISTER: "project:administer",
  TICKET_ADMINISTER: "ticket:administer",
  SUBSCRIPTION_MANAGE: "subscription:manage",
} as const;

export type Capability =
  (typeof CAPABILITIES)[keyof typeof CAPABILITIES];

const USER_CAPABILITIES: ReadonlySet<Capability> =
  new Set([CAPABILITIES.DASHBOARD_ACCESS]);

const ADMIN_CAPABILITIES: ReadonlySet<Capability> =
  new Set(Object.values(CAPABILITIES));

const ROLE_CAPABILITIES: Readonly<
  Record<AuthRole, ReadonlySet<Capability>>
> = {
  [AUTH_ROLES.USER]: USER_CAPABILITIES,
  [AUTH_ROLES.ADMIN]: ADMIN_CAPABILITIES,
};

export function normalizeAuthRole(
  role: string,
): AuthRole {
  return role === AUTH_ROLES.ADMIN
    ? AUTH_ROLES.ADMIN
    : AUTH_ROLES.USER;
}

export function getRoleCapabilities(
  role: string,
): ReadonlySet<Capability> {
  return ROLE_CAPABILITIES[
    normalizeAuthRole(role)
  ];
}

export function hasCapability(
  role: string,
  capability: Capability,
): boolean {
  return getRoleCapabilities(role).has(
    capability,
  );
}

export function hasEveryCapability(
  role: string,
  capabilities: readonly Capability[],
): boolean {
  const granted = getRoleCapabilities(role);

  return capabilities.every((capability) =>
    granted.has(capability),
  );
}

export function hasAnyCapability(
  role: string,
  capabilities: readonly Capability[],
): boolean {
  const granted = getRoleCapabilities(role);

  return capabilities.some((capability) =>
    granted.has(capability),
  );
}
