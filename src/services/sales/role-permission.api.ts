// src/services/sales/role-permission.api.ts
import salesApi from "../salesApi";
import type {
  RolePermissionOut,
  RolePermissionStateIn,
  RolePermissionsBulkIn,
  RoleDTO,
  PermissionDTO,
} from "@/types/permissions";

const BASE = "/roles";

export async function listRoles(
  opts?: { nocacheToken?: number; signal?: AbortSignal }
): Promise<RoleDTO[]> {
  const { data } = await salesApi.get(`${BASE}/`, {
    params: { _ts: opts?.nocacheToken ?? Date.now() },
    signal: opts?.signal,
    headers: { "Cache-Control": "no-cache" },
  });
  return data as RoleDTO[];
}

export async function listPermissionsCatalog(
  opts?: { nocacheToken?: number; signal?: AbortSignal }
): Promise<PermissionDTO[]> {
  const { data } = await salesApi.get(`${BASE}/permissions`, {
    params: { _ts: opts?.nocacheToken ?? Date.now() },
    signal: opts?.signal,
    headers: { "Cache-Control": "no-cache" },
  });
  return data as PermissionDTO[];
}

export async function listRolePermissions(
  roleId: number,
  opts?: { nocacheToken?: number; signal?: AbortSignal }
): Promise<RolePermissionOut[]> {
  const { data } = await salesApi.get(`${BASE}/${roleId}/permissions`, {
    params: { _ts: opts?.nocacheToken ?? Date.now() },
    signal: opts?.signal,
    headers: { "Cache-Control": "no-cache" },
  });
  return data as RolePermissionOut[];
}

export async function setPermissionState(
  roleId: number,
  code: string,
  body: RolePermissionStateIn,
  opts?: { signal?: AbortSignal }
): Promise<void> {
  await salesApi.patch(
    `${BASE}/${roleId}/permissions/${encodeURIComponent(code)}`,
    body,
    { signal: opts?.signal }
  );
}

export async function bulkSetPermissions(
  roleId: number,
  body: RolePermissionsBulkIn,
  opts?: { signal?: AbortSignal }
): Promise<void> {
  await salesApi.post(
    `${BASE}/${roleId}/permissions:bulk-set`,
    { active: true, ...body },
    { signal: opts?.signal }
  );
}
