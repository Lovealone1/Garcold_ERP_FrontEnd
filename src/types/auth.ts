export type Role = "admin" | "manager" | "user";

export interface AuthSyncDTO {
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface RoleOut {
  id: number;
  code: string;
}

export interface MeDTO {
  user_id: string;
  email?: string | null;
  display_name?: string | null;
  role: RoleOut | null;
  permissions: string[]; // códigos activos
}
