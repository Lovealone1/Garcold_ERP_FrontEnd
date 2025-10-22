
export type JsonValue = string | number | boolean | null | JsonObject | JsonValue[];
export type JsonObject = { [key: string]: JsonValue };

export interface InviteUserIn {
  email: string;
  redirect_to?: string | null;
}

export interface CreateUserIn {
  email: string;
  password: string;
  user_metadata?: JsonObject | null;
  app_metadata?: JsonObject | null;
}
export interface AdminUserOut {
  id: string;
  email: string;
  created_at?: string | null;
  confirmed_at?: string | null;
  user_metadata: JsonObject;
  app_metadata: JsonObject;
}

export interface AdminUsersPage {
  items: AdminUserOut[];
  page: number;
  per_page: number;
  has_next: boolean;
}

export interface UpdateUserIn {
  email?: string | null;
  name?: string | null;
  full_name?: string | null;
  phone?: string | null;
}

export type SetUserRoleIn = { role_id: number };

export type SetUserActiveIn ={is_active: boolean };

export interface UserDTO {
  id: number;
  external_sub: string;
  email: string | null;
  display_name: string | null;
  role: string | null;
  is_active: boolean;
  created_at: string;       
  updated_at: string | null; 
}
