// components/admin/UserList.tsx
"use client";
import type { AdminUserOut, UserDTO } from "@/types/user";

type Props = {
    items: AdminUserOut[];
    page: number;
    perPage: number;
    onPrev?: () => void;
    onNext?: () => void;
    hasNext?: boolean;
    onEdit?: (u: AdminUserOut) => void;
    onDelete?: (u: AdminUserOut) => void;
    localMap?: Record<string, UserDTO>; // <- NUEVO  key = external_sub (supabase id)
};

function avatarOf(u: AdminUserOut): string | null {
    const m = u.user_metadata as Record<string, any>;
    return m?.avatar_url || m?.picture || null;
}
function nameOf(u: AdminUserOut): string {
    const m = u.user_metadata as Record<string, any>;
    return m?.full_name || m?.name || u.email.split("@")[0];
}
function fmt(date?: string | null): string {
    if (!date) return "—";
    try { return new Date(date).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "2-digit" }); }
    catch { return date; }
}
function statusPill(ok: boolean) {
    const cls = ok
        ? "bg-[color-mix(in_srgb,var(--tg-primary)_18%,transparent)] text-[color-mix(in_srgb,var(--tg-primary)_90%,black)] border border-[color-mix(in_srgb,var(--tg-primary)_45%,transparent)]"
        : "bg-[color-mix(in_srgb,red_12%,transparent)] text-[color-mix(in_srgb,red_80%,black)] border border-[color-mix(in_srgb,red_35%,transparent)]";
    return <span className={`px-2 py-0.5 rounded-lg text-xs ${cls}`}>{ok ? "Activo" : "Inactivo"}</span>;
}

export default function UsersList({
    items, page, perPage, onPrev, onNext, hasNext, onEdit, onDelete, localMap = {},
}: Props) {
    return (
        <div className="px-5 pt-3 pb-5">
            <div className="mt-2 overflow-x-auto rounded-lg border border-tg">
                <table className="w-full border-collapse text-sm">
                    <thead className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                        <tr>
                            <th className="text-left px-4 py-3 w-12"></th>
                            <th className="text-left px-4 py-3">Nombre</th>
                            <th className="text-left px-4 py-3">Email</th>
                            <th className="text-left px-4 py-3">Rol</th>
                            <th className="text-left px-4 py-3">Estado</th>
                            <th className="text-left px-4 py-3">Creado</th>
                            <th className="text-right px-4 py-3 w-24">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-[var(--panel-bg)]">
                        {items.map((u) => {
                            const avatar = avatarOf(u);
                            const name = nameOf(u);
                            const local = localMap[u.id]; // u.id === external_sub
                            const role = local?.role ?? "Invitado";
                            const active = local?.is_active ?? false;

                            return (
                                <tr key={u.id} className="border-t border-[var(--panel-border)]">
                                    <td className="px-4 py-3">
                                        {avatar ? (
                                            <img src={avatar} alt={name} className="h-8 w-8 rounded-full object-cover" />
                                        ) : (
                                            <div className="h-8 w-8 rounded-full bg-[color-mix(in_srgb,var(--tg-muted)_18%,transparent)] grid place-items-center text-xs">
                                                {name.slice(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">{name}</td>
                                    <td className="px-4 py-3">{u.email}</td>
                                    <td className="px-4 py-3 capitalize">{role}</td>
                                    <td className="px-4 py-3">{statusPill(active)}</td>
                                    <td className="px-4 py-3">{fmt(u.created_at)}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                aria-label="Editar usuario"
                                                className="h-8 w-8 rounded-md grid place-items-center border border-tg hover:bg-[color-mix(in_srgb,var(--tg-muted)_10%,transparent)]"
                                                onClick={() => onEdit?.(u)}
                                            >
                                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                                    <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zm17.71-10.21a1.004 1.004 0 0 0 0-1.42l-2.34-2.34a1.004 1.004 0 0 0-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.82z" />
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                aria-label="Eliminar usuario"
                                                className="h-8 w-8 rounded-md grid place-items-center border border-tg hover:bg-[color-mix(in_srgb,red_12%,transparent)]"
                                                onClick={() => onDelete?.(u)}
                                            >
                                                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                                                    <path d="M16 9v10H8V9h8m-1.5-6h-5l-1 1H5v2h14V4h-3.5l-1-1z" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {!items.length && (
                            <tr>
                                <td colSpan={7} className="px-4 py-8 text-center text-tg-muted">Sin usuarios.</td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td colSpan={7} className="px-4 py-3">
                                <div className="flex items-center gap-3 justify-end">
                                    <span className="text-xs text-tg-muted">Página {page} · {perPage} por página</span>
                                    <button className="px-2 py-1 text-sm rounded border border-tg" onClick={onPrev} disabled={page <= 1}>Prev</button>
                                    <button className="px-2 py-1 text-sm rounded border border-tg" onClick={onNext} disabled={!hasNext}>Next</button>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
