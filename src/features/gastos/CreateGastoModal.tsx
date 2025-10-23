"use client";
import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { listBanks } from "@/services/sales/bank.api";
import type { Bank } from "@/types/bank";

import { useExpenseCategories } from "@/hooks/categoria-gastos/useCategoriaGastos";
import { useCreateExpense } from "@/hooks/gastos/useCreateGasto";
import type { ExpenseCreate, Expense } from "@/types/expense";

import DateInput from "@/components/ui/DateRangePicker/DateInput";

type Props = { open: boolean; onClose: () => void; onCreated?: (e: Expense) => void };

export default function CreateExpenseModal({ open, onClose, onCreated }: Props) {
    const { items: categories } = useExpenseCategories();

    const [banks, setBanks] = useState<Bank[]>([]);
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await listBanks(Date.now());
                if (alive) setBanks(data);
            } catch {
                if (alive) setBanks([]);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const categoryOpts = useMemo(() => categories.map(c => ({ id: c.id, label: c.name })), [categories]);
    const bankOpts = useMemo(() => banks.map(b => ({ id: b.id, label: b.name })), [banks]);

    // mantener SIEMPRE yyyy-MM-dd
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const [dateStr, setDateStr] = useState<string | undefined>(todayStr);
    const [categoryId, setCategoryId] = useState<number | "">("");
    const [bankId, setBankId] = useState<number | "">("");
    const [amount, setAmount] = useState<string>("");

    useEffect(() => {
        if (!open) {
            setDateStr(todayStr);
            setCategoryId("");
            setBankId("");
            setAmount("");
        }
    }, [open, todayStr]);

    const { create, loading, error } = useCreateExpense(e => {
        onCreated?.(e);
        onClose();
    });
    const canSave = !!dateStr && categoryId !== "" && bankId !== "" && Number(amount) > 0;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!canSave || !dateStr) return;
        const payload: ExpenseCreate = {
            expense_category_id: Number(categoryId),
            bank_id: Number(bankId),
            amount: Number(amount),
            // envía EXACTO "yyyy-MM-dd"
            expense_date: dateStr,
        };
        await create(payload);
    }

    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onClick={e => {
                if (e.target === e.currentTarget && !loading) onClose();
            }}
            onKeyDown={e => {
                if (e.key === "Escape" && !loading) onClose();
            }}
        >
            <form
                onSubmit={handleSubmit}
                className="w-[560px] max-w-[95vw] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl"
            >
                <div className="px-4 py-3 border-b border-tg">
                    <h3 className="text-base font-semibold">Registrar gasto</h3>
                </div>

                <div className="px-4 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-tg-muted mb-1">Fecha</label>
                        {/* DateInput puede devolver "yyyy-MM-ddTHH:mm:ss"; normalizamos a "yyyy-MM-dd" */}
                        <DateInput value={dateStr} onChange={s => setDateStr(s ? s.slice(0, 10) : undefined)} />
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-tg-muted mb-1">Categoría</label>
                        <select
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            value={categoryId}
                            onChange={e => setCategoryId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">Selecciona categoría</option>
                            {categoryOpts.map(o => (
                                <option key={o.id} value={o.id}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-xs font-medium text-tg-muted mb-1">Banco</label>
                        <select
                            className="h-10 rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            value={bankId}
                            onChange={e => setBankId(e.target.value ? Number(e.target.value) : "")}
                        >
                            <option value="">Selecciona banco</option>
                            {bankOpts.map(o => (
                                <option key={o.id} value={o.id}>
                                    {o.label}
                                </option>
                            ))}
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
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            inputMode="numeric"
                        />
                    </div>

                    {error ? <div className="sm:col-span-2 text-sm text-red-600 mt-1">{error}</div> : null}
                </div>

                <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                    <button
                        type="button"
                        className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        className="h-9 rounded-md bg-tg-primary px-3 text-sm font-medium text-tg-on-primary disabled:opacity-60"
                        disabled={!canSave || loading}
                    >
                        {loading ? "Guardando…" : "Guardar"}
                    </button>
                </div>
            </form>
        </div>
    );
}
