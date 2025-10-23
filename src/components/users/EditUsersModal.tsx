"use client";
import { useEffect, useState } from "react";
import type { AdminUserOut, UserDTO, SetUserActiveIn, UpdateUserIn } from "@/types/user";
import { updateUser, setUserRoleBySub, setUserActiveBySub } from "@/services/user.api";
import { useNotifications } from "@/components/providers/NotificationsProvider"; 

export type RoleDTO = { id: number; code: string };

export default function EditUserModal({
    open, user, local, roles, onClose, onSaved,
}: {
    open: boolean;
    user: AdminUserOut | null;
    local?: UserDTO | null;
    roles: RoleDTO[];
    onClose: () => void;
    onSaved?: () => void;
}) {
    const { success, error } = useNotifications();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [roleId, setRoleId] = useState<number | "">("");
    const [active, setActive] = useState<boolean>(true);
    const [saving, setSaving] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        if (!user) return;
        const meta = (user.user_metadata ?? {}) as Record<string, any>;
        setName(meta.full_name || meta.name || "");
        setEmail(user.email ?? "");
        setPhone(typeof meta.phone === "string" ? meta.phone : "");
        if (local?.role) {
            const found = roles.find((r) => r.code === local.role);
            setRoleId(found ? found.id : "");
        } else {
            setRoleId("");
        }
        setActive(local?.is_active ?? true);
        setErr(null);
    }, [user, local, roles]);

    const canSave = !!user && !!email;

    const handleSave = async () => {
        if (!user) return;
        setSaving(true);
        setErr(null);
        try {
            const payload: UpdateUserIn = {
                email: email || undefined,
                name: name || undefined,
                full_name: name || undefined,
            };
            await updateUser(user.id, payload);
            if (roleId !== "") await setUserRoleBySub(user.id, { role_id: Number(roleId) });
            const desiredActive: SetUserActiveIn = { is_active: !!active };
            await setUserActiveBySub(user.id, desiredActive);

            success("Usuario actualizado");
            onSaved?.();
            onClose();
        } catch (e: any) {
            setErr(e?.response?.data?.detail ?? "No fue posible guardar");
            error(e);
        } finally {
            setSaving(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
            <div className="w-[520px] max-w-[95vw] rounded-2xl border border-tg bg-[var(--tg-card-bg)] text-[var(--tg-card-fg)] shadow-lg">
                <div className="px-5 py-4 border-b border-tg flex items-center justify-between">
                    <h3 className="text-base font-medium">Editar usuario</h3>
                    <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded hover:bg-black/5">✕</button>
                </div>

                <div className="px-5 py-4 space-y-3">
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-sm">Nombre</label>
                        <input className="col-span-2 px-3 py-2 rounded-lg border border-tg bg-tg-card text-sm"
                            value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-sm">Email</label>
                        <input className="col-span-2 px-3 py-2 rounded-lg border border-tg bg-tg-card text-sm"
                            type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-sm">Teléfono</label>
                        <input className="col-span-2 px-3 py-2 rounded-lg border border-tg bg-tg-card text-sm"
                            value={phone} onChange={(e) => setPhone(e.target.value)} disabled />
                    </div>
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-sm">Rol</label>
                        <select className="col-span-2 px-3 py-2 rounded-lg border border-tg bg-tg-card text-sm"
                            value={roleId === "" ? "" : String(roleId)}
                            onChange={(e) => setRoleId(e.target.value === "" ? "" : Number(e.target.value))}
                            disabled={!roles.length}>
                            <option value="">—</option>
                            {roles.map((r) => (
                                <option key={r.id} value={r.id}>{r.code}</option>
                            ))}
                        </select>
                    </div>
                    <div className="grid grid-cols-3 items-center gap-3">
                        <label className="text-sm">Estado</label>
                        <button type="button" onClick={() => setActive(v => !v)}
                            className={`col-span-2 h-8 w-14 rounded-full relative transition border border-tg ${active ? "bg-[color-mix(in_srgb,var(--tg-primary)_40%,transparent)]" : "bg-[color-mix(in_srgb,var(--tg-muted)_20%,transparent)]"
                                }`} aria-pressed={active}>
                            <span className={`absolute top-0.5 h-7 w-7 rounded-full bg-white transition ${active ? "right-0.5" : "left-0.5"}`} />
                        </button>
                    </div>
                    {err && <div className="px-3 py-2 text-sm rounded-lg border border-red-300 text-red-700 bg-red-50">{err}</div>}
                </div>

                <div className="px-5 py-4 border-t border-tg flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-2 rounded border border-tg text-sm">Cancelar</button>
                    <button onClick={handleSave} disabled={!canSave || saving}
                        className="px-3 py-2 rounded text-sm border border-[color-mix(in_srgb,var(--tg-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--tg-primary)_18%,transparent)]">
                        {saving ? "Guardando…" : "Guardar"}
                    </button>
                </div>
            </div>
        </div>
    );
}