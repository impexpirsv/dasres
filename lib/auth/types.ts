import type { User } from "@prisma/client";

export type AuthenticatedUser = User;

export type AuthenticatedSession = {
  id: number;
  createdAt: Date;
  expiresAt: Date;
  user: AuthenticatedUser;
};
