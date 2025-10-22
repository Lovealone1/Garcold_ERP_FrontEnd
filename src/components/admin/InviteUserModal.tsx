"use client";
import { useState } from "react";
import { inviteUser } from "@/services/user.api";
import type { InviteUserIn } from "@/types/user";
import { useNotifications } from "@/components/providers/NotificationsProvider"; 

export default function InviteUserModal({
    open, onClose, onSaved,
}: { open: boolean; onClose: () => void; onSaved?: () => void }) {
    const { success, error } = useNotifications();
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [saving, setSaving] = useState(false);
    if (!open) return null;

    const handle = async () => {
        setSaving(true);
        try {
            const payload: InviteUserIn = { email, user_metadata: { full_name: name } } as any;
            await inviteUser(payload);
            success("Invitación enviada");
            onSaved?.();
            onClose();
        } catch (e) {
            error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 grid place-items-center z-50">
            <div className="w-[520px] max-w-[95vw] rounded-2xl border border-tg bg-tg-card text-tg-card">
                <div className="px-5 py-4 border-b border-tg flex justify-between">
                    <h3 className="text-base font-medium">Invitar usuario</h3>
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
                </div>
                <div className="px-5 py-4 border-t border-tg flex justify-end gap-2">
                    <button onClick={onClose} className="px-3 py-2 rounded border border-tg text-sm">Cancelar</button>
                    <button onClick={handle} disabled={!email || saving}
                        className="px-3 py-2 rounded text-sm border border-[color-mix(in_srgb,var(--tg-primary)_40%,transparent)] bg-[color-mix(in_srgb,var(--tg-primary)_18%,transparent)]">
                        {saving ? "Enviando…" : "Invitar"}
                    </button>
                </div>
            </div>
        </div>
    );
}
