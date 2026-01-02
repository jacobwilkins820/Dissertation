export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  userId: number;
  roleName: string;
  firstName: string;
};

export type MeResponse = {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  roleId: number | null;
  guardianId: number | null;
};

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  roleName: string;
  roleId: number | null;
  guardianId: number | null;
};

/**
 * In-memory session shape
 */
export type AuthSession = {
  token: string;
  user: AuthUser;
};
