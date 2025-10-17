// features/gastos/CreateGastoModal.tsx
"use client";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { listBancos } from "@/services/sales/bank.api";
import type { Banco } from "@/types/bank";
import { useCategoriasGastos } from "@/hooks/categoria-gastos/useCategoriaGastos";
import { useCreateGasto } from "@/hooks/gastos/useCreateGasto";
import type { GastoCreate, GastoCreated } from "@/types/expense";
import DateInput from "@/components/ui/DateRangePicker/DateInput";

type Props = { open: boolean; onClose: () => void; onCreated?: (g: GastoCreated) => void };

export default function CreateGastoModal({ open, onClose, onCreated }: Props) {
    const { items: categorias } = useCategoriasGastos();
    const [bancos, setBancos] = useState<Banco[]>([]);
    useEffect(() => {
        let alive = true;
        (async () => {
            try { const data = await listBancos(Date.now()); if (alive) setBancos(data); }
            catch { if (alive) setBancos([]); }
        })();
        return () => { alive = false; };
    }, []);

    const categoriaOpts = useMemo(() => categorias.map(c => ({ id: c.id, label: c.nombre })), [categorias]);
    const bancoOpts = useMemo(() => bancos.map(b => ({ id: b.id, label: b.nombre })), [bancos]);

    // ⬇️ mantener SIEMPRE yyyy-MM-dd
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const [fechaStr, setFechaStr] = useState<string | undefined>(todayStr);
    const [categoriaId, setCategoriaId] = useState<number | "">("");
    const [bancoId, setBancoId] = useState<number | "">("");
    const [monto, setMonto] = useState<string>("");

    useEffect(() => {
        if (!open) { setFechaStr(todayStr); setCategoriaId(""); setBancoId(""); setMonto(""); }
    }, [open, todayStr]);

    const { create, loading, error } = useCreateGasto((g) => { onCreated?.(g); onClose(); });
    const canSave = !!fechaStr && categoriaId !== "" && bancoId !== "" && Number(monto) > 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSave || !fechaStr) return;
        const payload: GastoCreate = {
            categoria_gasto_id: Number(categoriaId),
            banco_id: Number(bancoId),
            monto: Number(monto),
            // ⬇️ envía EXACTO "yyyy-MM-dd"
            fecha_gasto: fechaStr,
        };
        await create(payload);
    }

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget && !loading) onClose(); }}
            onKeyDown={(e) => { if (e.key === "Escape" && !loading) onClose(); }}
        >
            <form onSubmit={handleSubmit} className="w-[560px] max-w-[95vw] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                <div className="px-4 py-3 border-b border-tg">
                    <h3 className="text-base font-semibold">Registrar gasto</h3>
                </div>

                <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-tg-muted mb-1">Fecha</label>
                        {/* DateInput puede devolver "yyyy-MM-ddTHH:mm:ss"; normalizamos a "yyyy-MM-dd" */}
                        <DateInput
                            value={fechaStr}
                            onChange={(s) => setFechaStr(s ? s.slice(0, 10) : undefined)}
                        />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-tg-muted mb-1">Categoría</label>
                        <select
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            value={categoriaId}
                            onChange={(e) => setCategoriaId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">Selecciona categoría</option>
                            {categoriaOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-tg-muted mb-1">Banco</label>
                        <select
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            value={bancoId}
                            onChange={(e) => setBancoId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">Selecciona banco</option>
                            {bancoOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-tg-muted mb-1">Monto</label>
                        <input
                            type="number"
                            min={0}
                            step={1}
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            placeholder="0"
                            value={monto}
                            onChange={(e) => setMonto(e.target.value)}
                            inputMode="numeric"
                        />
                    </div>

                    {error ? <div className="sm:col-span-2 text-sm text-red-600 mt-1">{error}</div> : null}
                </div>

                <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                    <button type="button" className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10" onClick={onClose} disabled={loading}>
                        Cancelar
                    </button>
                    <button type="submit" className="h-9 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary disabled:opacity-60" disabled={!canSave || loading}>
                        {loading ? "Guardando…" : "Guardar"}
                    </button>
                </div>
            </form>
        </div>
    );
}
