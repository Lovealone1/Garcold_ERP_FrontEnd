"use client";
import { useState } from "react";
import type { Banco } from "@/types/bancos";
import { useUpdateSaldoBanco } from "@/hooks/bancos/useUpdateSaldoBanco";
import { useNotifications } from "@/components/providers/NotificationsProvider";

type Props = { banco: Banco; onClose: () => void };

export default function SaldoForm({ banco, onClose }: Props) {
    const [value, setValue] = useState<number>(banco.saldo ?? 0);
    const { updateSaldo, loading, error: err } = useUpdateSaldoBanco();
    const { success, error } = useNotifications();

    async function save() {
        if (value < 0) return;
        try {
            await updateSaldo(banco.id, value);
            success("Saldo actualizado");
            onClose();
        } catch (e: any) {
            error(e?.response?.data?.detail ?? err ?? "No se pudo actualizar el saldo");
        }
    }

    return (
        <div>
            <label className="text-sm text-tg-muted">Saldo</label>
            <input
                type="number"
                min={0}
                step={1}
                className="mt-1 h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card outline-none"
                value={value}
                onChange={(e) => setValue(Number(e.target.value))}
            />
            {err && <div className="mt-2 text-xs text-red-500">{err}</div>}
            <div className="mt-3 flex justify-end gap-2">
                <button
                    className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                    onClick={onClose}
                    disabled={loading}
                >
                    Cancelar
                </button>
                <button
                    className="h-9 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary disabled:opacity-60"
                    onClick={save}
                    disabled={loading || value < 0}
                >
                    {loading ? "Guardando…" : "Guardar"}
                </button>
            </div>
        </div>
    );
}
