"use client";
import { useMemo, useState, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import DateRangeInput from "@/components/ui/DateRangePicker/DateRangePicker";
import { useLoans } from "@/hooks/creditos/useCreditos";
import { useInvestments } from "@/hooks/inversiones/useInversiones";
import { useDeleteLoan } from "@/hooks/creditos/useDeleteCreditos";
import { useDeleteInvestment } from "@/hooks/inversiones/useDeleteInversion";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import LoanCard from "@/features/finanzas/CreditoCard";
import InvestmentCard from "@/features/finanzas/InversionCard";
import CreateAssetModal from "@/features/finanzas/CreateAssetModal";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";

function inRange(d: string, range?: DateRange) {
    if (!range?.from || !range?.to) return true;
    const t = new Date(d).getTime();
    return t >= range.from.getTime() && t <= range.to.getTime();
}

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const MAX_SHOW = 10;

export default function LoansInvestmentsPage() {
    const [pageLoan, setPageLoan] = useState(1);
    const [pageInv, setPageInv] = useState(1);
    const [rangeLoan, setRangeLoan] = useState<DateRange | undefined>();
    const [rangeInv, setRangeInv] = useState<DateRange | undefined>();
    const [openKind, setOpenKind] = useState<"loan" | "investment" | null>(null);
    const [selLoan, setSelLoan] = useState<Set<number>>(new Set());
    const [selInv, setSelInv] = useState<Set<number>>(new Set());

    const { data: loanData, items: loanItems, loading: loadingLoan, refresh: refreshLoan } = useLoans(pageLoan);
    const { data: invData, items: invItems, loading: loadingInv, refresh: refreshInv } = useInvestments(pageInv);
    const { remove: deleteLoan, loading: delLoanLoading } = useDeleteLoan(() => { setSelLoan(new Set()); refreshLoan(); });
    const { remove: deleteInvestment, loading: delInvLoading } = useDeleteInvestment(() => { setSelInv(new Set()); refreshInv(); });
    const { success, error } = useNotifications();

    const loanFiltered = useMemo(() => loanItems.filter(l => inRange(l.created_at, rangeLoan)), [loanItems, rangeLoan]);
    const invFiltered = useMemo(() => invItems.filter(i => inRange(i.maturity_date, rangeInv)), [invItems, rangeInv]);

    const loanShown = useMemo(() => loanFiltered.slice(0, MAX_SHOW), [loanFiltered]);
    const invShown = useMemo(() => invFiltered.slice(0, MAX_SHOW), [invFiltered]);

    const totalLoans = useMemo(() => loanFiltered.reduce((acc, l) => acc + (l.amount ?? 0), 0), [loanFiltered]);
    const totalInvestments = useMemo(() => invFiltered.reduce((acc, i) => acc + (i.balance ?? 0), 0), [invFiltered]);

    const onCreated = useCallback((kind: "loan" | "investment") => {
        setOpenKind(null);
        if (kind === "loan") {
            refreshLoan();
            success("Crédito creado");
        } else {
            refreshInv();
            success("Inversión creada");
        }
    }, [refreshLoan, refreshInv, success]);

    const ClearBtn = ({ onClick }: { onClick: () => void }) => (
        <button
            onClick={onClick}
            className="h-10 w-10 ml-1 grid place-items-center rounded border border-tg text-tg-muted hover:text-tg hover:bg-black/10 dark:hover:bg-white/10"
            title="Limpiar rango"
            aria-label="Limpiar rango"
            type="button"
        >
            <CloseIcon fontSize="small" />
        </button>
    );

    // ====== Confirmación de borrado ======
    const [confirmKind, setConfirmKind] = useState<null | "loan" | "investment">(null);
    const openConfirmLoan = () => setConfirmKind("loan");
    const openConfirmInv = () => setConfirmKind("investment");
    const closeConfirm = () => setConfirmKind(null);

    const deletingNow = delLoanLoading || delInvLoading;
    const confirmCount = confirmKind === "loan" ? selLoan.size : selInv.size;

    async function handleConfirmDelete() {
        try {
            if (confirmKind === "loan") {
                let ok = 0, fail = 0;
                for (const id of selLoan) {
                    try { await deleteLoan(id); ok++; } catch { fail++; }
                }
                closeConfirm();
                if (ok) success(`Se eliminaron ${ok} crédito(s)`);
                if (fail) error(`No se pudieron eliminar ${fail} crédito(s)`);
            } else if (confirmKind === "investment") {
                let ok = 0, fail = 0;
                for (const id of selInv) {
                    try { await deleteInvestment(id); ok++; } catch { fail++; }
                }
                closeConfirm();
                if (ok) success(`Se eliminaron ${ok} inversión(es)`);
                if (fail) error(`No se pudieron eliminar ${fail} inversión(es)`);
            }
        } catch (e: any) {
            const msg = e?.response?.data?.detail || e?.message || "Error al eliminar";
            error(msg);
        }
    }

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Créditos */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold">Créditos</h2>
                        <div className="flex items-center gap-3">
                            {selLoan.size > 0 && (
                                <button
                                    className="h-10 px-3 rounded-md border border-red-500 text-red-500 text-sm disabled:opacity-50"
                                    onClick={openConfirmLoan}
                                    disabled={delLoanLoading}
                                >
                                    Eliminar ({selLoan.size})
                                </button>
                            )}

                            {/* DateRange + Clear to the side */}
                            <div className="flex items-center">
                                <DateRangeInput value={rangeLoan} onChange={setRangeLoan} />
                                {(rangeLoan?.from || rangeLoan?.to) && <ClearBtn onClick={() => setRangeLoan(undefined)} />}
                            </div>

                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-sm text-tg-muted">
                                    Total: <span className="font-semibold text-tg">{money.format(totalLoans)}</span>
                                </span>
                                <div className="flex items-center">
                                    <button
                                        className="h-9 w-9 grid place-items-center rounded border border-tg text-sm disabled:opacity-50"
                                        onClick={() => setPageLoan(p => Math.max(1, p - 1))}
                                        disabled={!loanData?.has_prev}
                                        aria-label="Página anterior créditos"
                                    >
                                        <ChevronLeftIcon fontSize="small" />
                                    </button>
                                    <span className="mx-2 text-sm">{loanData?.page ?? pageLoan} / {loanData?.total_pages ?? 1}</span>
                                    <button
                                        className="h-9 w-9 grid place-items-center rounded border border-tg text-sm disabled:opacity-50"
                                        onClick={() => setPageLoan(p => p + 1)}
                                        disabled={!loanData?.has_next}
                                        aria-label="Página siguiente créditos"
                                    >
                                        <ChevronRightIcon fontSize="small" />
                                    </button>
                                </div>
                            </div>
                            <button
                                className="h-10 px-4 rounded-md bg-tg-primary text-tg-on-primary text-sm"
                                onClick={() => setOpenKind("loan")}
                            >
                                Nuevo crédito
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {loanShown.map(l => (
                            <LoanCard
                                key={l.id}
                                credito={l}
                                selected={selLoan.has(l.id)}
                                onSelect={(checked) => {
                                    const s = new Set(selLoan);
                                    if (checked) s.add(l.id); else s.delete(l.id);
                                    setSelLoan(s);
                                }}
                            />
                        ))}
                    </div>

                    {!loadingLoan && loanShown.length === 0 && (
                        <div className="text-sm text-tg-muted border border-tg rounded-md p-4">
                            Sin resultados en el rango seleccionado.
                        </div>
                    )}

                    {/* Footer compacto en móviles */}
                    <div className="flex sm:hidden items-center justify-between pt-2">
                        <span className="text-sm">
                            Total: <span className="font-semibold">{money.format(totalLoans)}</span>
                        </span>
                        <div className="flex items-center">
                            <button className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50" onClick={() => setPageLoan(p => Math.max(1, p - 1))} disabled={!loanData?.has_prev}><ChevronLeftIcon fontSize="small" /></button>
                            <span className="mx-2 text-sm">{loanData?.page ?? pageLoan} / {loanData?.total_pages ?? 1}</span>
                            <button className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50" onClick={() => setPageLoan(p => p + 1)} disabled={!loanData?.has_next}><ChevronRightIcon fontSize="small" /></button>
                        </div>
                    </div>
                </section>

                {/* Inversiones */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold">Inversiones</h2>
                        <div className="flex items-center gap-3">
                            {selInv.size > 0 && (
                                <button
                                    className="h-10 px-3 rounded-md border border-red-500 text-red-500 text-sm disabled:opacity-50"
                                    onClick={openConfirmInv}
                                    disabled={delInvLoading}
                                >
                                    Borrar ({selInv.size})
                                </button>
                            )}

                            {/* DateRange + Clear to the side */}
                            <div className="flex items-center">
                                <DateRangeInput value={rangeInv} onChange={setRangeInv} />
                                {(rangeInv?.from || rangeInv?.to) && <ClearBtn onClick={() => setRangeInv(undefined)} />}
                            </div>

                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-sm text-tg-muted">
                                    Total: <span className="font-semibold text-tg">{money.format(totalInvestments)}</span>
                                </span>
                                <div className="flex items-center">
                                    <button
                                        className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50"
                                        onClick={() => setPageInv(p => Math.max(1, p - 1))}
                                        disabled={!invData?.has_prev}
                                        aria-label="Página anterior inversiones"
                                    >
                                        <ChevronLeftIcon fontSize="small" />
                                    </button>
                                    <span className="mx-2 text-sm">{invData?.page ?? pageInv} / {invData?.total_pages ?? 1}</span>
                                    <button
                                        className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50"
                                        onClick={() => setPageInv(p => p + 1)}
                                        disabled={!invData?.has_next}
                                        aria-label="Página siguiente inversiones"
                                    >
                                        <ChevronRightIcon fontSize="small" />
                                    </button>
                                </div>
                            </div>
                            <button
                                className="h-10 px-4 rounded-md bg-tg-primary text-tg-on-primary text-sm"
                                onClick={() => setOpenKind("investment")}
                            >
                                Nueva inversión
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {invShown.map(i => (
                            <InvestmentCard
                                key={i.id}
                                inversion={i}
                                selected={selInv.has(i.id)}
                                onSelect={(checked) => {
                                    const s = new Set(selInv);
                                    if (checked) s.add(i.id); else s.delete(i.id);
                                    setSelInv(s);
                                }}
                            />
                        ))}
                    </div>

                    {!loadingInv && invShown.length === 0 && (
                        <div className="text-sm text-tg-muted border border-tg rounded-md p-4">
                            Sin resultados en el rango seleccionado.
                        </div>
                    )}

                    <div className="flex sm:hidden items-center justify-between pt-2">
                        <span className="text-sm">
                            Total: <span className="font-semibold">{money.format(totalInvestments)}</span>
                        </span>
                        <div className="flex items-center">
                            <button className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50" onClick={() => setPageInv(p => Math.max(1, p - 1))} disabled={!invData?.has_prev}><ChevronLeftIcon fontSize="small" /></button>
                            <span className="mx-2 text-sm">{invData?.page ?? pageInv} / {invData?.total_pages ?? 1}</span>
                            <button className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50" onClick={() => setPageInv(p => p + 1)} disabled={!invData?.has_next}><ChevronRightIcon fontSize="small" /></button>
                        </div>
                    </div>
                </section>
            </div>

            <CreateAssetModal
                open={openKind !== null}
                kind={openKind ?? "loan"}
                onClose={() => setOpenKind(null)}
                onCreated={onCreated}
            />

            {/* Modal Confirmación Borrado */}
            {confirmKind && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                    onKeyDown={(e) => { if (e.key === "Escape") closeConfirm(); }}
                    onClick={(e) => { if (e.target === e.currentTarget && !deletingNow) closeConfirm(); }}
                >
                    <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                        <div className="px-4 py-3 border-b border-tg flex items-center gap-2">
                            <span className="text-sm font-semibold">Confirmar eliminación</span>
                        </div>
                        <div className="px-4 py-4 text-sm">
                            ¿Seguro que deseas eliminar {confirmKind === "loan" ? "los crédito(s)" : "las inversión(es)"} seleccionad{confirmCount === 1 ? "a" : "as"} ({confirmCount})?
                            <br />
                            Esta acción no se puede deshacer.
                        </div>
                        <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                            <button
                                onClick={closeConfirm}
                                className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                                disabled={deletingNow}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="h-9 rounded-md bg-red-600 px-3 text-sm font-medium text-white disabled:opacity-60"
                                disabled={deletingNow}
                            >
                                {deletingNow ? "Eliminando…" : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
