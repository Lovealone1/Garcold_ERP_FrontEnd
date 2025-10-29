// features/finanzas/InvestmentAddBalanceModal.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Investment } from "@/types/investment";
import type { InvestmentAddBalanceIn } from "@/types/investment";
import { useAddInversionBalance } from "@/hooks/inversiones/useAddInversionBalance";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { useBancos } from "@/hooks/bancos/useBancos";

type Props = {
    open: boolean;
    investment: Investment | null;
    onClose: () => void;
    onDone: () => void;
};

export default function InvestmentAddBalanceModal({ open, investment, onClose, onDone }: Props) {
    const { success, error } = useNotifications();
    const { run, loading } = useAddInversionBalance(); // ← correcto

    const { items: banks, loading: loadingBanks } = useBancos();

    const [kind, setKind] = useState<"interest" | "topup">("interest");
    const [amount, setAmount] = useState<number | "">("");
    const [sourceBankId, setSourceBankId] = useState<number | "">("");

    useEffect(() => {
        if (!open) {
            setKind("interest");
            setAmount("");
            setSourceBankId("");
        }
    }, [open]);

    const canShow = open && !!investment;
    const isTopup = kind === "topup";
    const parsedAmount = typeof amount === "number" ? amount : 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!investment) return;

        const payload: InvestmentAddBalanceIn =
            isTopup
                ? { investment_id: investment.id, amount: parsedAmount || 0, kind: "topup", source_bank_id: Number(sourceBankId) }
                : { investment_id: investment.id, amount: parsedAmount || 0, kind: "interest" };

        try {
            await run(payload); // ← usar run
            success("Saldo agregado");
            onDone();
            onClose();
        } catch (err: any) {
            const msg = err?.response?.data?.detail ?? err?.message ?? "Error al agregar saldo";
            error(msg);
        }
    }

    const bankOptions = useMemo(() => banks.slice().sort((a, b) => a.name.localeCompare(b.name)), [banks]);
    if (!canShow) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <form onSubmit={handleSubmit} className="w-[520px] rounded-xl border border-[var(--tg-border)] bg-[var(--panel-bg)] shadow-xl">
                <div className="px-5 pt-4 pb-3 border-b border-[var(--tg-border)]">
                    <h3 className="text-base font-semibold">Agregar saldo a inversión</h3>
                    <div className="text-xs text-[var(--tg-muted)] mt-1">{investment?.name}</div>
                </div>

                <div className="px-5 py-4 space-y-3">
                    <label className="block text-sm text-[var(--tg-muted)]">
                        Tipo de movimiento
                        <select
                            value={kind}
                            onChange={(e) => setKind(e.target.value as "interest" | "topup")}
                            className="mt-1 w-full h-10 rounded-md px-3 outline-none bg-[var(--tg-card-bg)] text-[var(--tg-card-fg)]
                         border border-[var(--tg-border)] focus:border-[var(--tg-primary)]
                         focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tg-primary)40%,transparent)]"
                        >
                            <option value="interest">Interés</option>
                            <option value="topup">Agregar monto</option>
                        </select>
                    </label>

                    {isTopup && (
                        <label className="block text-sm text-[var(--tg-muted)]">
                            Banco de origen
                            <select
                                value={sourceBankId}
                                onChange={(e) => setSourceBankId(e.target.value ? Number(e.target.value) : "")}
                                disabled={loadingBanks}
                                className="mt-1 w-full h-10 rounded-md px-3 outline-none bg-[var(--tg-card-bg)] text-[var(--tg-card-fg)]
                           border border-[var(--tg-border)] focus:border-[var(--tg-primary)]
                           focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tg-primary)40%,transparent)]"
                            >
                                <option value="" disabled>{loadingBanks ? "Cargando bancos…" : "Seleccione un banco"}</option>
                                {bankOptions.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </label>
                    )}

                    <label className="block text-sm text-[var(--tg-muted)]">
                        Monto *
                        <input
                            type="number"
                            min={0}
                            step="1"
                            inputMode="numeric"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                            placeholder="0"
                            className="mt-1 w-full h-10 rounded-md px-3 outline-none bg-[var(--tg-card-bg)] text-[var(--tg-card-fg)]
                         border border-[var(--tg-border)] focus:border-[var(--tg-primary)]
                         focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tg-primary)40%,transparent)]"
                        />
                    </label>
                </div>

                <div className="px-5 py-3 border-t border-[var(--tg-border)] flex justify-end gap-2">
                    <button type="button" onClick={onClose} className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="h-9 rounded-md px-3 text-sm font-medium bg-[var(--tg-primary)] text-[var(--tg-on-primary)] shadow-sm
                       hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tg-primary)40%,transparent)]"
                        disabled={loading}
                    >
                        {loading ? "Guardando…" : "Agregar saldo"}
                    </button>
                </div>
            </form>
        </div>
    );
}
