"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
    const [ready, setReady] = useState(false);
    const [pwd, setPwd] = useState("");
    const [confirm, setConfirm] = useState("");
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        // Cuando vienes del link, Supabase crea una sesión temporal (PASSWORD_RECOVERY)
        const { data: sub } = supabase.auth.onAuthStateChange((_event, _session) => {
            setReady(true);
        });
        setReady(true);
        return () => sub.subscription.unsubscribe();
    }, []);

    async function apply() {
        if (!pwd || pwd.length < 8) { setErr("Mínimo 8 caracteres."); return; }
        if (pwd !== confirm) { setErr("Las contraseñas no coinciden."); return; }
        setErr(null); setMsg(null); setSaving(true);
        try {
            const { error } = await supabase.auth.updateUser({ password: pwd });
            if (error) throw error;
            setMsg("Contraseña actualizada. Ya puedes cerrar esta pestaña y volver a la app.");
            setPwd(""); setConfirm("");
        } catch (e: any) {
            setErr(e.message ?? "No se pudo actualizar");
        } finally {
            setSaving(false);
        }
    }

    if (!ready) return null;

    return (
        <div className="max-w-md mx-auto p-6 space-y-4">
            <h1 className="text-xl font-semibold" style={{ color: "var(--tg-fg)" }}>Establecer nueva contraseña</h1>

            {(msg || err) && (
                <div className="rounded-lg px-3 py-2 text-sm"
                    style={{
                        background: err ? "rgba(255,0,0,.08)" : "rgba(0,128,0,.1)",
                        color: err ? "var(--tg-danger)" : "var(--tg-success, #22c55e)",
                        border: `1px solid ${err ? "var(--tg-danger)" : "transparent"}`,
                    }}>
                    {err ?? msg}
                </div>
            )}

            <div className="space-y-3">
                <input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--tg-border)", background: "var(--tg-input-bg, transparent)", color: "var(--tg-fg)" }}
                    placeholder="Nueva contraseña" />
                <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-lg border px-3 py-2 text-sm"
                    style={{ borderColor: "var(--tg-border)", background: "var(--tg-input-bg, transparent)", color: "var(--tg-fg)" }}
                    placeholder="Confirmar contraseña" />
                <button onClick={apply} disabled={saving}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ background: "var(--tg-primary)", color: "var(--tg-primary-fg)", opacity: saving ? 0.7 : 1 }}>
                    {saving ? "Actualizando…" : "Actualizar contraseña"}
                </button>
            </div>
        </div>
    );
}
