"use client";
import type { AdminUserOut } from "@/types/user";

export default function ConfirmDeleteUserModal({
    open,
    user,
    loading,
    onConfirm,
    onClose,
    error,
}: {
    open: boolean;
    user: AdminUserOut | null;
    loading?: boolean;
    error?: string | null;
    onConfirm: () => void;
    onClose: () => void;
}) {
    if (!open || !user) return null;
    const name = ((user.user_metadata ?? {}) as any)?.full_name || user.email.split("@")[0];

    return (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
            <div className="w-[460px] max-w-[95vw] rounded-2xl border border-tg bg-tg-card text-tg-card">
                <div className="px-5 py-4 border-b border-tg flex justify-between">
                    <h3 className="text-base font-medium">Eliminar usuario</h3>
                    <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded hover:bg-black/5">✕</button>
                </div>
                <div className="px-5 py-4 space-y-2">
                    <p className="text-sm">
                        ¿Deseas eliminar a <span className="font-medium">{name}</span> ({user.email})?
                    </p>
                    {error && (
                        <div className="px-3 py-2 text-sm rounded-lg border border-red-300 text-red-700 bg-red-50">
                            {error}
                        </div>
                    )}
                </div>
                <div className="px-5 py-4 border-t border-tg flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-2 rounded border border-tg text-sm">Cancelar</button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="px-3 py-2 rounded text-sm border border-[color-mix(in_srgb,red_40%,transparent)] bg-[color-mix(in_srgb,red_15%,transparent)] text-[color-mix(in_srgb,red_80%,black)]"
                    >
                        {loading ? "Eliminando…" : "Eliminar"}
                    </button>
                </div>
            </div>
        </div>
    );
}