"use client";

import { useEffect, useMemo, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";
import { listBanks } from "@/services/sales/bank.api";
import type { Bank } from "@/types/bank";
import type { TransactionCreate } from "@/types/transaction";
import DateInput from "@/components/ui/DateRangePicker/DateInput";

type Props = {
    open: boolean;
    onClose: () => void;
    loading?: boolean;
    onSubmit: (payload: TransactionCreate) => Promise<void> | void;
};

const TYPE_MAP = { ingreso: 2, retiro: 4 } as const;
type TypeKey = keyof typeof TYPE_MAP;

export default function NewTransactionModal({
    open,
    onClose,
    loading = false,
    onSubmit,
}: Props) {
    const [banks, setBanks] = useState<Bank[]>([]);
    const [loadingBanks, setLoadingBanks] = useState(false);

    const [bankId, setBankId] = useState<string>("");
    const [typeKey, setTypeKey] = useState<TypeKey>("ingreso");
    const [amount, setAmount] = useState<string>("");
    const [description, setDescription] = useState<string>("");
    const [createdAt, setCreatedAt] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!open) return;
        let alive = true;
        (async () => {
            setLoadingBanks(true);
            try {
                const data = await listBanks(Date.now());
                if (alive) setBanks(data);
            } finally {
                if (alive) setLoadingBanks(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [open]);

    // Reset form al cerrar
    useEffect(() => {
        if (!open) {
            setBankId("");
            setTypeKey("ingreso");
            setAmount("");
            setDescription("");
            setCreatedAt(undefined);
        }
    }, [open]);

    const canSubmit = useMemo(() => {
        const nAmount = Number(amount);
        return (
            bankId !== "" &&
            TYPE_MAP[typeKey] &&
            Number.isFinite(nAmount) &&
            nAmount > 0 &&
            !loading
        );
    }, [bankId, typeKey, amount, loading]);

    async function handleSubmit() {
        if (!canSubmit) return;

        const payload: TransactionCreate = {
            bank_id: Number(bankId),
            type_id: TYPE_MAP[typeKey],
            amount: Number(amount),
            description: description.trim() || undefined,
            is_auto: false,
            ...(createdAt ? { created_at: createdAt } : {}),
        };

        await onSubmit(payload);
    }

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            // fullscreen, centrado real en móvil, con padding
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4"
            onKeyDown={(e) => {
                if (e.key === "Escape" && !loading) onClose();
            }}
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) onClose();
            }}
        >
            {/* card responsivo */}
            <div className="w-full max-w-[440px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                <div className="flex items-center gap-2 border-b border-tg px-4 py-3">
                    <MaterialIcon name="add" size={18} />
                    <h3 className="text-base font-semibold">Nueva transacción</h3>
                </div>

                <div className="space-y-3 px-4 py-4">
                    {/* Banco */}
                    <label className="block text-sm">
                        <span className="mb-1 block">Banco</span>
                        <select
                            className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-sm"
                            value={bankId}
                            onChange={(e) => setBankId(e.target.value)}
                            disabled={loadingBanks}
                        >
                            <option value="">
                                {loadingBanks
                                    ? "Cargando bancos…"
                                    : "Selecciona un banco"}
                            </option>
                            {banks.map((b) => (
                                <option key={b.id} value={b.id}>
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    {/* Monto */}
                    <label className="block text-sm">
                        <span className="mb-1 block">Monto</span>
                        <input
                            type="number"
                            inputMode="decimal"
                            step="any"
                            className="h-9 w-full rounded-md border border-tg bg-tg-card px-3"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </label>

                    {/* Fecha (opcional) */}
                    <label className="block text-sm">
                        <span className="mb-1 block">Fecha (opcional)</span>
                        <DateInput
                            value={createdAt}
                            onChange={setCreatedAt}
                            disabled={loading}
                            placeholder="dd/mm/aaaa"
                        />
                    </label>

                    {/* Descripción */}
                    <label className="block text-sm">
                        <span className="mb-1 block">Descripción (opcional)</span>
                        <input
                            type="text"
                            className="h-9 w-full rounded-md border border-tg bg-tg-card px-3"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </label>

                    {/* Tipo */}
                    <div className="flex justify-center pt-2">
                        <div className="inline-flex overflow-hidden rounded-full border border-tg">
                            {(["ingreso", "retiro"] as TypeKey[]).map((k) => {
                                const active = typeKey === k;
                                return (
                                    <button
                                        key={k}
                                        type="button"
                                        onClick={() => setTypeKey(k)}
                                        className={`h-10 px-4 text-sm ${active
                                            ? "bg-tg-primary text-tg-on-primary"
                                            : "bg-[var(--panel-bg)] hover:bg-black/10 dark:hover:bg-white/10"
                                            }`}
                                        aria-pressed={active}
                                    >
                                        {k === "ingreso" ? "Ingreso" : "Retiro"}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 border-t border-tg px-4 py-3">
                    <button
                        onClick={onClose}
                        className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                        disabled={loading}
                    >
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

            <style jsx>{`
                input[type="number"]::-webkit-outer-spin-button,
                input[type="number"]::-webkit-inner-spin-button {
                    -webkit-appearance: none;
                    margin: 0;
                }
                input[type="number"] {
                    -moz-appearance: textfield;
                }
            `}</style>
        </div>
    );
}