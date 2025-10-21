// RolesPermisosPage.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import TeamHeader from "@/components/admin/TeamHeader";
import RolesPermissionsContent from "@/components/admin/RolesPermissionContent";
import UsersList from "@/components/admin/UserList";

import { useRoles } from "@/hooks/permissions/useRoles";
import { useRolePermissions } from "@/hooks/permissions/useRolePermissions";
import type { RolePermissionOut } from "@/types/permissions";
import useListAdminUsers from "@/hooks/users/useListAdminUsers"; // tu hook existente

export default function RolesPermisosPage() {
    const [tab, setTab] = useState<"users" | "roles">("users");

    const { data: roles = [], loading: rolesLoading } = useRoles();
    const [roleId, setRoleId] = useState<number | "">("");

    useEffect(() => {
        if (roles.length && roleId === "") setRoleId(roles[0]!.id);
    }, [roles, roleId]);

    const rp = useRolePermissions(typeof roleId === "number" ? roleId : null);
    const { loading, saving, error, setOne, setMany, reload } = rp;

    const perms: RolePermissionOut[] = useMemo(() => rp.data ?? [], [rp.data]);

    const users = useListAdminUsers({ auto: tab === "users" });

    const toggleRolCompleto = async (on: boolean) => {
        const codes = perms.map((p) => p.code);
        await setMany(codes, on);
    };

    return (
        <div className="app-shell__content">
            <div className="mb-3">
                <h1 className="text-xl font-semibold">Miembros del equipo</h1>
            </div>

            <div className="bg-tg-card text-tg-card rounded-xl border border-tg">
                <TeamHeader
                    active={tab}
                    onTab={setTab}
                    onReload={tab === "roles" ? reload : users.refresh}
                    onActivateAll={tab === "roles" ? () => toggleRolCompleto(true) : undefined}
                    onDeactivateAll={tab === "roles" ? () => toggleRolCompleto(false) : undefined}
                    actionsDisabled={tab === "roles" ? saving || !perms.length : false}
                />

                {(rolesLoading || loading || users.loading) && (
                    <div className="h-1 w-full bg-[color-mix(in_srgb,var(--tg-muted)_20%,transparent)] overflow-hidden">
                        <div className="h-full w-1/2 bg-tg-primary animate-[progress_1.2s_linear_infinite]" />
                    </div>
                )}

                {tab === "roles" ? (
                    <div className="px-4 py-3 flex items-center gap-3">
                        <span className="text-sm">Rol</span>
                        <select
                            className="px-2 py-1 rounded-lg border border-tg bg-tg-card text-tg-card text-sm"
                            value={roleId}
                            onChange={(e) => setRoleId(Number(e.target.value))}
                            disabled={rolesLoading || !roles.length}
                        >
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>
                                    {r.code}
                                </option>
                            ))}
                        </select>
                    </div>
                ) : null}

                {tab === "roles" ? (
                    <RolesPermissionsContent perms={perms} saving={saving} setOne={setOne} setMany={setMany} />
                ) : (
                    <UsersList
                        items={users.items}
                        page={users.page}
                        perPage={users.perPage}
                        onPrev={users.prevPage}
                        onNext={users.nextPage}
                        hasNext={users.hasNext}
                    />
                )}
            </div>

            <style jsx global>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
        </div>
    );
}
