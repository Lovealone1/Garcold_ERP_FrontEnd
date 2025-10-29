"use client";

import { useEffect, useMemo, useState } from "react";
import type { Loan, LoanApplyPaymentIn } from "@/types/loan";
import { useBancos } from "@/hooks/bancos/useBancos";
import { useApplyLoanPayment } from "@/hooks/creditos/useApplyLoanPayment";

type ApplyPaymentResult = Loan | { deleted: true; loan_id: number };

type Props = {
    open: boolean;
    onClose: () => void;
    loan: Loan;                
    defaultBankId?: number;
    onDone?: (r: ApplyPaymentResult) => void | Promise<void>;
};

export default function ApplyLoanPaymentModal({
    open,
    onClose,
    loan,
    defaultBankId,
    onDone,
}: Props) {
    const { items: banks, loading: loadingBanks, reload } = useBancos();
    const { run, loading, error, reset } = useApplyLoanPayment();

    const [bankId, setBankId] = useState<number | "">("");
    const [amount, setAmount] = useState<number>(0);
    const [description, setDescription] = useState<string>("");

    useEffect(() => {
        if (!open) return;
        reset();
        setAmount(0);
        setBankId("");
    }, [open, reset]);

    const canSubmit = useMemo(
        () => bankId !== "" && amount > 0 && !loading && !loadingBanks,
        [bankId, amount, loading, loadingBanks]
    );

    async function handleSubmit() {
        if (bankId === "" || amount <= 0) return;

        const trimmed = description.trim();
        const payload: LoanApplyPaymentIn & { description?: string } = {
            loan_id: loan.id,
            bank_id: bankId as number,
            amount,
            ...(trimmed ? { description: trimmed } : {}),
        };

        const res = await run(payload);
        reload();
        await onDone?.(res as ApplyPaymentResult);
        onClose();
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
            <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                {/* Header */}
                <div className="px-4 py-3 border-b border-tg flex items-center justify-between">
                    <span className="text-sm font-semibold">Aplicar pago a crédito</span>
                    <button
                        type="button"
                        className="h-8 w-8 grid place-items-center rounded hover:bg-black/10 dark:hover:bg-white/10"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Cerrar"
                    >
                        ×
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 py-4 space-y-3">
                    {loan.name && <div className="text-sm text-tg-muted">{loan.name}</div>}

                    <label className="block text-sm">
                        <span className="mb-1 block text-tg-muted">Monto a pagar</span>
                        <input
                            type="number"
                            min={0}
                            step={1000}
                            value={Number.isFinite(amount) ? amount : 0}
                            onChange={(e) => setAmount(Number(e.target.value || 0))}
                            className="w-full h-10 rounded-md border border-tg bg-transparent px-3"
                            placeholder="0"
                        />
                    </label>

                    <label className="block text-sm">
                        <span className="mb-1 block text-tg-muted">Banco</span>
                        <select
                            value={bankId === "" ? "" : String(bankId)}
                            onChange={(e) => setBankId(e.target.value ? Number(e.target.value) : "")}
                            className="w-full h-10 rounded-md border border-tg bg-[var(--panel-bg)] px-3
             text-[var(--tg-fg)] focus:outline-none focus:ring-2
             focus:ring-[color-mix(in_srgb,var(--tg-primary)35%,transparent)]"
                            disabled={loadingBanks}
                            aria-label="Seleccione un banco"
                            style={{ colorScheme: "dark" }}           // ← corrige dropdown blanco en Chrome/Win
                        >
                            <option value="" disabled className="bg-[var(--panel-bg)] text-[var(--tg-fg)]">
                                Selecciona un banco
                            </option>
                            {banks.map((b) => (
                                <option
                                    key={b.id}
                                    value={b.id}
                                    className="bg-[var(--panel-bg)] text-[var(--tg-fg)]"
                                >
                                    {b.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <label className="block text-sm">
                        <span className="mb-1 block text-tg-muted">Descripción (opcional)</span>
                        <textarea
                            rows={3}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full rounded-md border border-tg bg-transparent px-3 py-2 resize-y"
                            placeholder="Referencia o nota..."
                        />
                    </label>

                    {error && (
                        <div className="text-sm text-red-500 bg-red-500/10 border border-red-500/30 rounded px-3 py-2">
                            {error.message || "Error al aplicar el pago"}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-60"
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit}
                        className="h-9 rounded-md px-3 text-sm font-medium
                       bg-[var(--tg-primary)] text-[var(--tg-on-primary)]
                       ring-2 ring-[color-mix(in_srgb,var(--tg-primary)35%,transparent)]
                       disabled:opacity-50"
                    >
                        {loading ? "Aplicando…" : "Aplicar pago"}
                    </button>
                </div>
            </div>
        </div>
    );
}
