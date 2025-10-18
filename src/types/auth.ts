export type Role = "admin" | "manager" | "user";

export interface AuthSyncDTO {
  email?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
}

export interface MeDTO {
  user_id: string;
  email?: string | null;
  display_name?: string | null;
  role?: Role | null;
  permissions: string[];
}
