export const USER_ROLES = ["admin", "doctor", "patient"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: SessionUser;
}

export function isUserRole(value: string | null | undefined): value is UserRole {
  return Boolean(value && USER_ROLES.includes(value as UserRole));
}
