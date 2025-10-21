import type { RolePermissionOut } from "@/types/permissions";

export type ModulePerms = Record<
  string, 
  Record<string, boolean> 
>;

export function groupByModule(perms: RolePermissionOut[]): ModulePerms {
  const out: ModulePerms = {};
  for (const p of perms) {
    const [module, action] = p.code.split(".", 2); 
    if (!module || !action) continue;
    out[module] ??= {};
    out[module][action] = !!p.active;
  }
  return out;
}
