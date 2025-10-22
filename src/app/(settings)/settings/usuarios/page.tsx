"use client";

import { useEffect, useMemo, useState } from "react";

import TeamHeader from "@/components/admin/TeamHeader";
import RolesPermissionsContent from "@/components/admin/RolesPermissionContent";
import UsersList from "@/components/admin/UserList";

import EditUserModal from "@/components/users/EditUsersModal";
import InviteUserModal from "@/components/admin/InviteUserModal";
import CreateUserModal from "@/components/admin/CreateUserModal";
import ConfirmDeleteUserModal from "@/components/users/ConfirmDeleteUserModal";

import { useRoles } from "@/hooks/permissions/useRoles";
import { useRolePermissions } from "@/hooks/permissions/useRolePermissions";
import type { RolePermissionOut } from "@/types/permissions";
import useListAdminUsers from "@/hooks/users/useListAdminUsers";
import { useLocalUsersMap } from "@/hooks/users/useLocalUsersMap";
import useDeleteAdminUser from "@/hooks/users/useDeleteAdminUser";

export default function RolesPermisosPage() {
    const [tab, setTab] = useState<"users" | "roles">("users");
    const [openInvite, setOpenInvite] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);
    const [editing, setEditing] = useState<import("@/types/user").AdminUserOut | null>(null);
    const [toDelete, setToDelete] = useState<import("@/types/user").AdminUserOut | null>(null);

    const { data: roles = [], loading: rolesLoading } = useRoles();
    const [roleId, setRoleId] = useState<number | "">("");

    useEffect(() => {
        if (roles.length && roleId === "") setRoleId(roles[0]!.id);
    }, [roles, roleId]);

    const rp = useRolePermissions(typeof roleId === "number" ? roleId : null);
    const { loading, saving, setOne, setMany, reload } = rp;
    const perms: RolePermissionOut[] = useMemo(() => rp.data ?? [], [rp.data]);

    const users = useListAdminUsers({ auto: tab === "users" });
    const { map: localMap, reload: reloadLocal } = useLocalUsersMap();

    const { remove, loading: deleting, error: delErr, reset: resetDelete } = useDeleteAdminUser();

    const toggleRolCompleto = async (on: boolean) => {
        const codes = perms.map((p) => p.code);
        await setMany(codes, on);
    };

    const handleAnySaved = async () => {
        await Promise.all([users.refresh(), reloadLocal()]);
    };

    const confirmDelete = async () => {
        if (!toDelete) return;
        const ok = await remove(toDelete.id);
        if (ok) {
            await users.refresh();
            setToDelete(null);
            resetDelete();
        }
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
                    onCreateUser={() => setOpenCreate(true)}
                    onInviteUser={() => setOpenInvite(true)}
                />

                {(rolesLoading || loading || users.loading) && (
                    <div className="h-1 w-full bg-[color-mix(in_srgb,var(--tg-muted)_20%,transparent)] overflow-hidden">
                        <div className="h-full w-1/2 bg-tg-primary animate-[progress_1.2s_linear_infinite]" />
                    </div>
                )}

                {tab === "roles" ? (
                    <>
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
                        <RolesPermissionsContent perms={perms} saving={saving} setOne={setOne} setMany={setMany} />
                    </>
                ) : (
                    <UsersList
                        items={users.items}
                        page={users.page}
                        perPage={users.perPage}
                        onPrev={users.prevPage}
                        onNext={users.nextPage}
                        hasNext={users.hasNext}
                        onEdit={(u) => setEditing(u)}
                        onDelete={(u) => setToDelete(u)}
                        localMap={localMap}
                    />
                )}
            </div>

            <EditUserModal
                open={!!editing}
                user={editing}
                local={editing ? localMap[editing.id] : null}
                roles={roles}
                onClose={() => setEditing(null)}
                onSaved={handleAnySaved}
            />

            <InviteUserModal
                open={openInvite}
                onClose={() => setOpenInvite(false)}
                onSaved={handleAnySaved}
            />

            <CreateUserModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onSaved={handleAnySaved}
            />

            <ConfirmDeleteUserModal
                open={!!toDelete}
                user={toDelete}
                loading={deleting}
                error={delErr ? "No fue posible eliminar" : null}
                onConfirm={confirmDelete}
                onClose={() => {
                    setToDelete(null);
                    resetDelete();
                }}
            />

            <style jsx global>{`
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
        </div>
    );
}
