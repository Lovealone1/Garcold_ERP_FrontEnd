"use client";
import { useMemo, useState, useCallback } from "react";
import type { DateRange } from "react-day-picker";
import DateRangeInput from "@/components/ui/DateRangePicker/DateRangePicker";
import { useCreditos } from "@/hooks/creditos/useCreditos";
import { useInversiones } from "@/hooks/inversiones/useInversiones";
import { useDeleteCredito } from "@/hooks/creditos/useDeleteCreditos";
import { useDeleteInversion } from "@/hooks/inversiones/useDeleteInversion";
import CreditoCard from "@/features/finanzas/CreditoCard";
import InversionCard from "@/features/finanzas/InversionCard";
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

export default function CreditosInversionesPage() {
    const [pageCred, setPageCred] = useState(1);
    const [pageInv, setPageInv] = useState(1);
    const [rangeCred, setRangeCred] = useState<DateRange | undefined>();
    const [rangeInv, setRangeInv] = useState<DateRange | undefined>();
    const [openKind, setOpenKind] = useState<"credito" | "inversion" | null>(null);
    const [selCred, setSelCred] = useState<Set<number>>(new Set());
    const [selInv, setSelInv] = useState<Set<number>>(new Set());

    const { data: credData, items: credItems, loading: loadingCred, refresh: refreshCred } = useCreditos(pageCred);
    const { data: invData, items: invItems, loading: loadingInv, refresh: refreshInv } = useInversiones(pageInv);
    const { remove: deleteCredito, loading: delCredLoading } = useDeleteCredito(() => { setSelCred(new Set()); refreshCred(); });
    const { remove: deleteInversion, loading: delInvLoading } = useDeleteInversion(() => { setSelInv(new Set()); refreshInv(); });

    const credFiltered = useMemo(() => credItems.filter(c => inRange(c.fecha_creacion, rangeCred)), [credItems, rangeCred]);
    const invFiltered = useMemo(() => invItems.filter(i => inRange(i.fecha_vencimiento, rangeInv)), [invItems, rangeInv]);

    const credShown = useMemo(() => credFiltered.slice(0, MAX_SHOW), [credFiltered]);
    const invShown = useMemo(() => invFiltered.slice(0, MAX_SHOW), [invFiltered]);

    const totalCreditos = useMemo(() => credFiltered.reduce((acc, c) => acc + (c.monto ?? 0), 0), [credFiltered]);
    const totalInversiones = useMemo(() => invFiltered.reduce((acc, i) => acc + (i.saldo ?? 0), 0), [invFiltered]);

    const onCreated = useCallback((kind: "credito" | "inversion") => {
        setOpenKind(null);
        if (kind === "credito") refreshCred(); else refreshInv();
    }, [refreshCred, refreshInv]);

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
    const [confirmKind, setConfirmKind] = useState<null | "credito" | "inversion">(null);
    const openConfirmCred = () => setConfirmKind("credito");
    const openConfirmInv = () => setConfirmKind("inversion");
    const closeConfirm = () => setConfirmKind(null);

    const deletingNow = delCredLoading || delInvLoading;
    const confirmCount = confirmKind === "credito" ? selCred.size : selInv.size;

    async function handleConfirmDelete() {
        if (confirmKind === "credito") {
            for (const id of selCred) { await deleteCredito(id); }
        } else if (confirmKind === "inversion") {
            for (const id of selInv) { await deleteInversion(id); }
        }
        closeConfirm();
    }

    return (
        <div className="p-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Créditos */}
                <section className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-semibold">Créditos</h2>
                        <div className="flex items-center gap-3">
                            {selCred.size > 0 && (
                                <button
                                    className="h-10 px-3 rounded-md border border-red-500 text-red-500 text-sm disabled:opacity-50"
                                    onClick={openConfirmCred}
                                    disabled={delCredLoading}
                                >
                                    Borrar ({selCred.size})
                                </button>
                            )}

                            {/* DateRange + Clear to the side */}
                            <div className="flex items-center">
                                <DateRangeInput value={rangeCred} onChange={setRangeCred} />
                                {(rangeCred?.from || rangeCred?.to) && <ClearBtn onClick={() => setRangeCred(undefined)} />}
                            </div>

                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-sm text-tg-muted">
                                    Total: <span className="font-semibold text-tg">{money.format(totalCreditos)}</span>
                                </span>
                                <div className="flex items-center">
                                    <button
                                        className="h-9 w-9 grid place-items-center rounded border border-tg text-sm disabled:opacity-50"
                                        onClick={() => setPageCred(p => Math.max(1, p - 1))}
                                        disabled={!credData?.has_prev}
                                        aria-label="Página anterior créditos"
                                    >
                                        <ChevronLeftIcon fontSize="small" />
                                    </button>
                                    <span className="mx-2 text-sm">{credData?.page ?? pageCred} / {credData?.total_pages ?? 1}</span>
                                    <button
                                        className="h-9 w-9 grid place-items-center rounded border border-tg text-sm disabled:opacity-50"
                                        onClick={() => setPageCred(p => p + 1)}
                                        disabled={!credData?.has_next}
                                        aria-label="Página siguiente créditos"
                                    >
                                        <ChevronRightIcon fontSize="small" />
                                    </button>
                                </div>
                            </div>
                            <button
                                className="h-10 px-4 rounded-md bg-tg-primary text-tg-on-primary text-sm"
                                onClick={() => setOpenKind("credito")}
                            >
                                Nuevo crédito
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {credShown.map(c => (
                            <CreditoCard
                                key={c.id}
                                credito={c}
                                selected={selCred.has(c.id)}
                                onSelect={(checked) => {
                                    const s = new Set(selCred);
                                    if (checked) s.add(c.id); else s.delete(c.id);
                                    setSelCred(s);
                                }}
                            />
                        ))}
                    </div>

                    {!loadingCred && credShown.length === 0 && (
                        <div className="text-sm text-tg-muted border border-tg rounded-md p-4">
                            Sin resultados en el rango seleccionado.
                        </div>
                    )}

                    {/* Footer compacto en móviles */}
                    <div className="flex sm:hidden items-center justify-between pt-2">
                        <span className="text-sm">
                            Total: <span className="font-semibold">{money.format(totalCreditos)}</span>
                        </span>
                        <div className="flex items-center">
                            <button className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50" onClick={() => setPageCred(p => Math.max(1, p - 1))} disabled={!credData?.has_prev}><ChevronLeftIcon fontSize="small" /></button>
                            <span className="mx-2 text-sm">{credData?.page ?? pageCred} / {credData?.total_pages ?? 1}</span>
                            <button className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50" onClick={() => setPageCred(p => p + 1)} disabled={!credData?.has_next}><ChevronRightIcon fontSize="small" /></button>
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
                                    Total: <span className="font-semibold text-tg">{money.format(totalInversiones)}</span>
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
                                onClick={() => setOpenKind("inversion")}
                            >
                                Nueva inversión
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {invShown.map(i => (
                            <InversionCard
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
                            Total: <span className="font-semibold">{money.format(totalInversiones)}</span>
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
                kind={openKind ?? "credito"}
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
                            {/* warning icon from MaterialIcon if you have it. If not, keep as text */}
                            <span className="text-sm font-semibold">Confirmar eliminación</span>
                        </div>
                        <div className="px-4 py-4 text-sm">
                            ¿Seguro que deseas eliminar {confirmKind === "credito" ? "los crédito(s)" : "las inversión(es)"} seleccionad{confirmCount === 1 ? "a" : "as"} ({confirmCount})?
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
