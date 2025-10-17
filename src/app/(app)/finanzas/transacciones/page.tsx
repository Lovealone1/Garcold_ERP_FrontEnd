"use client";

import { useMemo, useState, CSSProperties } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { MaterialIcon } from "@/components/ui/material-icon";

import { useTransactions } from "@/hooks/transacciones/useTransacciones";
import { useDeleteTransaction } from "@/hooks/transacciones/useDeleteTransaccion";
import { useCreateTransaction } from "@/hooks/transacciones/useCreateTransaccion";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import NewTransactionModal from "@/features/transacciones/NuevaTransaccionModal";
import DateRangeInput from "@/components/ui/DateRangePicker/DateRangePicker";
import type { TransactionCreate } from "@/types/transaction";

const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

export default function TransactionsPage() {
    const {
        items,
        page,
        setPage,
        loading,
        refresh,
        has_prev,
        has_next,
        total_pages,
        page_size,
        total,
        filters,
        setFilters,
        options,
    } = useTransactions(1, 10);

    const { remove, loading: deleting } = useDeleteTransaction();
    const { create, loading: creating } = useCreateTransaction();
    const { success, error } = useNotifications();

    const [openCreate, setOpenCreate] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [range, setRange] = useState<DateRange | undefined>(undefined);

    const pageSize = page_size ?? 10;
    const bancos = options.banks;
    const tipos = options.types;

    const from = useMemo(
        () => (total === 0 ? 0 : (page - 1) * pageSize + 1),
        [page, pageSize, total]
    );
    const to = useMemo(
        () => Math.min(page * pageSize, total ?? 0),
        [page, pageSize, total]
    );

    const frameVars: CSSProperties = { ["--content-x" as any]: "16px" };

    // Eliminar transacción
    async function confirmDelete() {
        if (!deleteId) return;
        try {
            await remove(deleteId);
            success(`Transacción #${deleteId} eliminada correctamente`);
            setDeleteId(null);
            refresh();
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ||
                e?.message ||
                "Error al eliminar la transacción";
            error(msg);
        }
    }

    // Crear transacción
    async function handleCreateSubmit(payload: TransactionCreate) {
        try {
            await create(payload);
            success("Transacción creada exitosamente");
            setOpenCreate(false);
            setPage(1);
            refresh();
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ||
                e?.message ||
                "Error al crear la transacción";
            error(msg);
        }
    }

    function clearFilters() {
        setFilters({ q: "", bank: "", type: "", origin: "all" });
        setRange(undefined);
    }

    // Filtrar por fecha localmente
    const filteredItems = useMemo(() => {
        if (!range?.from || !range?.to) return items;
        const fromTime = range.from.getTime();
        const toTime = range.to.getTime();
        return items.filter((t) => {
            const d = new Date(t.created_at).getTime();
            return d >= fromTime && d <= toTime;
        });
    }, [items, range]);

    return (
        <div className="app-shell__frame" style={frameVars}>
            <div className="bg-[var(--page-bg)] rounded-xl h-full flex flex-col px-[var(--content-x)] pt-3 pb-5">
                {/* Header + filtros */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold text-tg-fg">Transacciones</h2>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Buscar */}
                        <label className="relative flex items-center flex-none h-10 w-[260px]">
                            <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
                                <MaterialIcon name="search" size={18} />
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar"
                                className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3
                focus:outline-none focus:ring-tg-primary"
                                value={filters.q ?? ""}
                                onChange={(e) => {
                                    setPage(1);
                                    setFilters((f) => ({ ...f, q: e.target.value }));
                                }}
                            />
                        </label>

                        {/* Banco */}
                        <select
                            value={filters.bank ?? ""}
                            onChange={(e) => {
                                setPage(1);
                                setFilters((f) => ({ ...f, bank: e.target.value }));
                            }}
                            className="h-10 flex-none w-[180px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                        >
                            <option value="">Banco</option>
                            {bancos.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>

                        {/* Tipo */}
                        <select
                            value={filters.type ?? ""}
                            onChange={(e) => {
                                setPage(1);
                                setFilters((f) => ({ ...f, type: e.target.value }));
                            }}
                            className="h-10 flex-none w-[180px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                        >
                            <option value="">Tipo</option>
                            {tipos.map((t) => (
                                <option key={t} value={t}>
                                    {t}
                                </option>
                            ))}
                        </select>

                        {/* Origen */}
                        <select
                            value={filters.origin ?? "all"}
                            onChange={(e) =>
                                setFilters((f) => ({
                                    ...f,
                                    origin: e.target.value as "all" | "auto" | "manual",
                                }))
                            }
                            className="h-10 flex-none w-[160px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                        >
                            <option value="all">Origen</option>
                            <option value="manual">Manual</option>
                            <option value="auto">Automática</option>
                        </select>

                        {/* Filtro por fechas */}
                        <DateRangeInput
                            value={range}
                            onChange={(r) => {
                                setRange(r);
                                setPage(1);
                            }}
                            className="ml-1"
                        />

                        {/* Limpiar */}
                        <span
                            onClick={clearFilters}
                            className="cursor-pointer text-sm text-tg-primary hover:underline ml-2 mr-2 select-none"
                            role="button"
                            tabIndex={0}
                        >
                            Limpiar filtros
                        </span>

                        <button
                            onClick={() => setOpenCreate(true)}
                            className="h-10 rounded-md bg-tg-primary px-4 text-sm font-medium text-tg-on-primary shadow-sm"
                            disabled={creating}
                        >
                            Nueva transacción
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-md flex-1 min-h-0 flex flex-col overflow-hidden">
                    <div className="flex-1 min-h-0 overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                                    <th className="px-4 py-3 text-left">#</th>
                                    <th className="px-4 py-3 text-left">Banco</th>
                                    <th className="px-4 py-3 text-left">Tipo</th>
                                    <th className="px-4 py-3 text-right">Monto</th>
                                    <th className="px-4 py-3 text-left">Descripción</th>
                                    <th className="px-4 py-3 text-left">Creación</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    Array.from({ length: pageSize }).map((_, i) => (
                                        <tr key={`sk-${i}`} className="border-t border-tg">
                                            {Array.from({ length: 7 }).map((__, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filteredItems.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-4 py-10 text-center text-tg-muted"
                                        >
                                            Sin registros
                                        </td>
                                    </tr>
                                ) : (
                                    filteredItems.map((r) => (
                                        <tr
                                            key={r.id}
                                            className="border-t border-tg hover:bg-black/5 dark:hover:bg-white/5"
                                        >
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className={`inline-block h-2.5 w-2.5 rounded-full ${r.is_auto ? "bg-red-500" : "bg-emerald-500"
                                                            }`}
                                                        aria-label={r.is_auto ? "Automática" : "Manual"}
                                                        title={r.is_auto ? "Automática" : "Manual"}
                                                    />
                                                    <span>{r.id}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">{r.bank}</td>
                                            <td className="px-4 py-3">{r.type_str}</td>
                                            <td className="px-4 py-3 text-right">
                                                {money.format(r.amount)}
                                            </td>
                                            <td className="px-4 py-3">
                                                {r.description || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {format(new Date(r.created_at), "dd MMM yyyy", {
                                                    locale: es,
                                                })}
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button
                                                        className={`rounded p-2 ${r.is_auto
                                                                ? "text-tg-muted cursor-not-allowed"
                                                                : "text-tg-primary hover:bg-black/10 dark:hover:bg-white/10"
                                                            }`}
                                                        aria-label="eliminar"
                                                        onClick={() => !r.is_auto && setDeleteId(r.id)}
                                                        disabled={r.is_auto || deleting}
                                                        title={
                                                            r.is_auto
                                                                ? "Automática: no se puede eliminar"
                                                                : "Eliminar"
                                                        }
                                                    >
                                                        <MaterialIcon name="delete" size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-tg px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Líneas por página</span>
                            <select
                                value={pageSize}
                                disabled
                                className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted"
                            >
                                <option value={pageSize}>{pageSize}</option>
                            </select>
                        </div>

                        <div className="text-sm text-tg-muted">
                            Mostrando {from}-{to} de {total} registros
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal Crear */}
            <NewTransactionModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                loading={creating}
                onSubmit={handleCreateSubmit}
            />

            {/* Confirmar eliminar */}
            {deleteId != null && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") setDeleteId(null);
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !deleting) setDeleteId(null);
                    }}
                >
                    <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                        <div className="px-4 py-3 border-b border-tg flex items-center gap-2">
                            <MaterialIcon name="warning" size={18} />
                            <h3 className="text-base font-semibold">Confirmar eliminación</h3>
                        </div>
                        <div className="px-4 py-4 text-sm">
                            ¿Seguro que deseas eliminar esta transacción manual? Esta acción
                            no se puede deshacer.
                        </div>
                        <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteId(null)}
                                className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10"
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="h-9 rounded-md bg-red-600 px-3 text-sm font-medium text-white disabled:opacity-60"
                                disabled={deleting}
                            >
                                {deleting ? "Eliminando…" : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
