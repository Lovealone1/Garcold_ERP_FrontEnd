// features/transacciones/NuevaTransaccionModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { listBancos } from "@/services/sales/bancos.api";
import type { Banco } from "@/types/bancos";
import type { TransaccionCreate } from "@/types/transacciones";

type Props = {
    open: boolean;
    onClose: () => void;
    loading?: boolean;
    onSubmit: (payload: TransaccionCreate) => Promise<void> | void;
};

const TYPE_MAP = { ingreso: 3, retiro: 4 } as const;
type TipoKey = keyof typeof TYPE_MAP;

export default function NuevaTransaccionModal({ open, onClose, loading = false, onSubmit }: Props) {
    const [bancos, setBancos] = useState<Banco[]>([]);
    const [loadingBancos, setLoadingBancos] = useState(false);

    const [bancoId, setBancoId] = useState<string>("");
    const [tipoKey, setTipoKey] = useState<TipoKey>("ingreso");
    const [monto, setMonto] = useState<string>("");
    const [descripcion, setDescripcion] = useState<string>("");

    useEffect(() => {
        if (!open) return;
        let alive = true;
        (async () => {
            setLoadingBancos(true);
            try {
                const data = await listBancos(Date.now());
                if (alive) setBancos(data);
            } finally {
                if (alive) setLoadingBancos(false);
            }
        })();
        return () => { alive = false; };
    }, [open]);

    // limpiar al cerrar
    useEffect(() => {
        if (!open) {
            setBancoId("");
            setTipoKey("ingreso");
            setMonto("");
            setDescripcion("");
        }
    }, [open]);

    const canSubmit = useMemo(() => {
        const nMonto = Number(monto);
        return bancoId !== "" && TYPE_MAP[tipoKey] && Number.isFinite(nMonto) && nMonto > 0 && !loading;
    }, [bancoId, tipoKey, monto, loading]);

    async function handleSubmit() {
        if (!canSubmit) return;
        const payload: TransaccionCreate = {
            banco_id: Number(bancoId),
            tipo_id: TYPE_MAP[tipoKey],
            monto: Number(monto),
            descripcion: descripcion.trim() || undefined,
        };
        await onSubmit(payload);
    }

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onKeyDown={(e) => { if (e.key === "Escape") onClose(); }}
            onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
        >
            <div className="w-[440px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                <div className="px-4 py-3 border-b border-tg flex items-center gap-2">
                    <MaterialIcon name="add" size={18} />
                    <h3 className="text-base font-semibold">Nueva transacción</h3>
                </div>

                <div className="px-4 py-4 space-y-3">
                    {/* Banco (desde DB) */}
                    <label className="block text-sm">
                        <span className="mb-1 block">Banco</span>
                        <select
                            className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-sm"
                            value={bancoId}
                            onChange={(e) => setBancoId(e.target.value)}
                            disabled={loadingBancos}
                        >
                            <option value="">{loadingBancos ? "Cargando bancos…" : "Selecciona un banco"}</option>
                            {bancos.map((b) => (
                                <option key={b.id} value={b.id}>{b.nombre}</option>
                            ))}
                        </select>
                    </label>

                    {/* Monto (número sin flechas) */}
                    <label className="block text-sm">
                        <span className="mb-1 block">Monto</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            className="h-9 w-full rounded-md border border-tg bg-tg-card px-3"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                        />
                    </label>

                    {/* Descripción */}
                    <label className="block text-sm">
                        <span className="mb-1 block">Descripción (opcional)</span>
                        <input
                            type="text"
                            className="h-9 w-full rounded-md border border-tg bg-tg-card px-3"
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                        />
                    </label>

                    {/* Combobutton (ingreso / retiro) — SIN label, abajo y redondeado */}
                    <div className="flex justify-center pt-2">
                        <div className="inline-flex rounded-full border border-tg overflow-hidden">
                            {(["ingreso", "retiro"] as TipoKey[]).map((k) => {
                                const active = tipoKey === k;
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setTipoKey(k)}
                                        className={`px-4 h-10 text-sm ${active ? "bg-tg-primary text-tg-on-primary" : "bg-[var(--panel-bg)] hover:bg-black/10 dark:hover:bg-white/10"}`}
                                        aria-pressed={active}
                                    >
                                        {k === "ingreso" ? "Ingreso" : "Retiro"}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                    <button onClick={onClose} className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10" disabled={loading}>
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="h-9 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary disabled:opacity-60"
                        disabled={!canSubmit}
                    >
                        {loading ? "Creando…" : "Crear"}
                    </button>
                </div>
            </div>

            {/* Quitar flechas de inputs numéricos */}
            <style jsx>{`
        input[type="number"]::-webkit-outer-spin-button,
        input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
      `}</style>
        </div>
    );
}
