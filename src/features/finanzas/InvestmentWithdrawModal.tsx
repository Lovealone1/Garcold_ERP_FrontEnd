"use client";

import { useEffect, useMemo, useState } from "react";
import type { Investment } from "@/types/investment";
import type { InvestmentWithdrawIn } from "@/types/investment";
import { useWithdrawInversion } from "@/hooks/inversiones/useWithdrawInversion";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { useBancos } from "@/hooks/bancos/useBancos";

type Props = {
    open: boolean;
    onClose: () => void;
    investment: Investment | null;
    onDone?: (res: Investment | { deleted: true; investment_id: number }) => void;
};

export default function InvestmentWithdrawModal({ open, onClose, investment, onDone }: Props) {
    const { run, loading } = useWithdrawInversion();
    const { items: banks, loading: loadingBanks } = useBancos();
    const { success, error } = useNotifications();

    const [kind, setKind] = useState<"partial" | "full">("partial");
    const [amount, setAmount] = useState<number | "">("");
    const [destBankId, setDestBankId] = useState<number | "">("");

    const invId = investment?.id ?? 0;
    const invBalance = Number(investment?.balance ?? 0);
    const money = useMemo(
        () => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),
        []
    );

    useEffect(() => {
        if (!open) return;
        setKind("partial");
        setAmount("");
        setDestBankId("");
    }, [open]);

    const canSubmit = useMemo(() => {
        if (!invId) return false;
        if (kind === "full") return true;
        if (amount === "" || Number(amount) <= 0) return false;
        if (Number(amount) > invBalance) return false;
        return true;
    }, [invId, kind, amount, invBalance]);

    function fillFull() {
        setAmount(invBalance);
        setKind("full");
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!investment || !canSubmit) return;

        const payload: InvestmentWithdrawIn =
            kind === "full"
                ? {
                    investment_id: invId,
                    kind: "full",
                    ...(destBankId ? { destination_bank_id: Number(destBankId) } : {}),
                }
                : {
                    investment_id: invId,
                    kind: "partial",
                    amount: Number(amount),
                    ...(destBankId ? { destination_bank_id: Number(destBankId) } : {}),
                };

        try {
            const res = await run(payload);
            success(kind === "full" ? "Inversión liquidada" : "Retiro aplicado");
            onDone?.(res);
            onClose();
        } catch (e: any) {
            const msg = e?.response?.data?.detail ?? e?.message ?? "Error al retirar";
            error(msg);
        }
    }

    if (!open || !investment) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onClick={(e) => {
                if (e.target === e.currentTarget && !loading) onClose();
            }}
            onKeyDown={(e) => {
                if (e.key === "Escape" && !loading) onClose();
            }}
        >
            <form
                onSubmit={handleSubmit}
                className="w-[520px] rounded-xl border border-[var(--tg-border)] bg-[var(--panel-bg)] shadow-xl"
            >
                <div className="px-5 pt-4 pb-3 border-b border-[var(--tg-border)]">
                    <h3 className="text-base font-semibold">Retirar de inversión</h3>
                    <div className="text-xs text-[var(--tg-muted)] mt-1">{investment.name}</div>
                </div>

                <div className="px-5 py-4 space-y-3">
                    {/* Tipo de retiro */}
                    <label className="block text-sm text-[var(--tg-muted)]">
                        Tipo de retiro
                        <select
                            value={kind}
                            onChange={(e) => setKind(e.target.value as "partial" | "full")}
                            className="mt-1 w-full h-10 rounded-md px-3 outline-none
                         bg-[var(--tg-card-bg)] text-[var(--tg-card-fg)]
                         border border-[var(--tg-border)]
                         focus:border-[var(--tg-primary)]
                         focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tg-primary)40%,transparent)]"
                        >
                            <option value="partial">Parcial</option>
                            <option value="full">Valor total</option>
                        </select>
                    </label>

                    {/* Monto si es parcial */}
                    {kind === "partial" ? (
                        <label className="block text-sm text-[var(--tg-muted)]">
                            Monto a retirar *
                            <div className="mt-1 flex items-center gap-2">
                                <input
                                    type="number"
                                    min={0}
                                    step="1"
                                    inputMode="numeric"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value === "" ? "" : Number(e.target.value))}
                                    placeholder="0"
                                    className="w-full h-10 rounded-md px-3 outline-none
                             bg-[var(--tg-card-bg)] text-[var(--tg-card-fg)]
                             border border-[var(--tg-border)]
                             focus:border-[var(--tg-primary)]
                             focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tg-primary)40%,transparent)]"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={fillFull}
                                    className="h-10 shrink-0 rounded-md px-3 text-sm
                             border border-[var(--tg-border)]
                             bg-[var(--tg-card-bg)] text-[var(--tg-card-fg)]
                             hover:bg-black/10 dark:hover:bg-white/10"
                                >
                                    Valor total
                                </button>
                            </div>
                        </label>
                    ) : (
                        <div className="flex items-center justify-between text-sm px-1">
                            <span className="text-[var(--tg-muted)]">Se retirará el total:</span>
                            <span className="font-semibold">{money.format(invBalance)}</span>
                        </div>
                    )}

                    {/* Banco destino opcional */}
                    <label className="block text-sm text-[var(--tg-muted)]">
                        Banco destino (opcional)
                        <select
                            value={destBankId}
                            onChange={(e) => setDestBankId(e.target.value ? Number(e.target.value) : "")}
                            disabled={loadingBanks}
                            className="mt-1 w-full h-10 rounded-md px-3 outline-none
                         bg-[var(--tg-card-bg)] text-[var(--tg-card-fg)]
                         border border-[var(--tg-border)]
                         focus:border-[var(--tg-primary)]
                         focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tg-primary)40%,transparent)]"
                        >
                            <option value="">
                                {loadingBanks ? "Cargando bancos…" : "Seleccione un banco"}
                            </option>
                            {banks
                                .slice()
                                .sort((a, b) => a.name.localeCompare(b.name))
                                .map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                        </select>
                    </label>
                </div>

                <div className="px-5 py-3 border-t border-[var(--tg-border)] flex justify-end gap-2">
                    <button
                        type="button"
                        className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10 disabled:opacity-60"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="h-9 rounded-md px-3 text-sm font-medium bg-[var(--tg-primary)] text-[var(--tg-on-primary)] shadow-sm
                       hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[color-mix(in_srgb,var(--tg-primary)40%,transparent)] disabled:opacity-60"
                        disabled={!canSubmit || loading}
                    >
                        {loading ? "Procesando…" : "Retirar"}
                    </button>
                </div>
            </form>
        </div>
    );
}
