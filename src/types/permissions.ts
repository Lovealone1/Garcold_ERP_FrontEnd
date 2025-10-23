export type RolePermissionOut = {
  code: string;
  description?: string | null;
  active: boolean;
};

export type RolePermissionStateIn = {
  active: boolean;
};

export type RolePermissionsBulkIn = {
  codes: string[];
  active?: boolean; 
};

export type RoleDTO = {
  id: number;
  code: string;
};

export type PermissionDTO = {
  code: string;
  description?: string | null;
  is_active: boolean;
};
