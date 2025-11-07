"use client";
import { useMemo, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import GastoCard from "@/features/gastos/GastoCard";
import { useExpenses } from "@/hooks/gastos/useGastos";
import { useExpenseCategories } from "@/hooks/categoria-gastos/useCategoriaGastos";
import { useDeleteExpense } from "@/hooks/gastos/useDeleteGasto";
import DateRangePicker from "@/components/ui/DateRangePicker/DateRangePicker";
import type { DateRange } from "react-day-picker";
import CreateExpenseModal from "@/features/gastos/CreateGastoModal";
import { useNotifications } from "@/components/providers/NotificationsProvider";

function inRange(d: string, range?: DateRange) {
    if (!range?.from && !range?.to) return true;
    const t = new Date(d).getTime();
    const from = range?.from
        ? new Date(
            range.from.getFullYear(),
            range.from.getMonth(),
            range.from.getDate(),
            0,
            0,
            0,
            0
        ).getTime()
        : undefined;
    const to = range?.to
        ? new Date(
            range.to.getFullYear(),
            range.to.getMonth(),
            range.to.getDate(),
            23,
            59,
            59,
            999
        ).getTime()
        : undefined;
    if (from !== undefined && t < from) return false;
    if (to !== undefined && t > to) return false;
    return true;
}

export default function GastosPage() {
    const [range, setRange] = useState<DateRange | undefined>();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);

    const { success, error } = useNotifications();

    const {
        items,
        page,
        setPage,
        pageSize,
        totalPages,
        loading,
        error: loadError,
        reload,
        filters,
        setFilters,
        hasPrev,
        hasNext,
        loadMore,
        hasMoreServer,
    } = useExpenses({}, 8);

    const { items: categorias, loading: loadingCats } = useExpenseCategories();

    const { remove, loading: deleting } = useDeleteExpense(() => {
        setSelectedIds(new Set());
        reload();
    });

    const bancos = useMemo(
        () =>
            Array.from(
                new Set(items.map((g) => g.bank_name).filter(Boolean))
            ).sort((a, b) => a.localeCompare(b)),
        [items]
    );

    const filtered = useMemo(
        () =>
            items.filter((g) => {
                if (filters.category && g.category_name !== filters.category)
                    return false;
                if (filters.bank && g.bank_name !== filters.bank) return false;
                if (!inRange(g.expense_date, range)) return false;
                return true;
            }),
        [items, filters.category, filters.bank, range]
    );

    async function handleConfirmDelete() {
        try {
            for (const id of selectedIds) {
                // eslint-disable-next-line no-await-in-loop
                await remove(id);
            }
            success(
                selectedIds.size > 1
                    ? `Se eliminaron ${selectedIds.size} gastos correctamente.`
                    : "Gasto eliminado correctamente."
            );
        } catch (e) {
            error(e);
        } finally {
            setConfirmDelete(false);
        }
    }

    function clearFilters() {
        setFilters({});
        setRange(undefined);
        setPage(1);
        reload();
    }

    const handlePageChange = async (target: number) => {
        if (target <= 0 || target === page) return;

        if (target < page) {
            setPage(target);
            return;
        }

        if (hasMoreServer && target > totalPages) {
            await loadMore();
        }

        const max = totalPages && totalPages > 0 ? totalPages : target;
        const safe = Math.max(1, Math.min(target, max));
        if (safe !== page) setPage(safe);
    };

    return (
        <div className="p-4 space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col gap-3">
                <h2 className="text-4xl font-extrabold text-tg-fg">
                    Gastos
                </h2>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    {/* Filtros */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:flex-wrap">
                        <select
                            className="h-10 min-w-[220px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            value={filters.category ?? ""}
                            onChange={(e) => {
                                const val = e.target.value || undefined;
                                setFilters((f) => ({ ...f, category: val }));
                                setPage(1);
                            }}
                            disabled={loadingCats}
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((c) => (
                                <option key={c.id} value={c.name}>
                                    {c.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="h-10 min-w-[200px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            value={filters.bank ?? ""}
                            onChange={(e) => {
                                const val = e.target.value || undefined;
                                setFilters((f) => ({ ...f, bank: val }));
                                setPage(1);
                            }}
                            disabled={loading}
                        >
                            <option value="">Todos los bancos</option>
                            {bancos.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>

                        {/* Date + Limpiar en la misma fila también en móvil */}
                        <div className="flex gap-2 w-full sm:w-auto">
                            <div className="flex-1">
                                <DateRangePicker
                                    value={range}
                                    onChange={(r) => {
                                        setRange(r);
                                        setPage(1);
                                    }}
                                />
                            </div>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="h-10 px-3 rounded-md border border-tg bg-[var(--panel-bg)] text-sm text-tg-fg whitespace-nowrap"
                            >
                                Limpiar filtros
                            </button>
                        </div>

                        <button
                            type="button"
                            className="h-10 rounded-md bg-tg-primary px-4 text-sm font-medium text-tg-on-primary shadow-sm inline-flex items-center justify-center gap-1 w-full sm:w-auto"
                            onClick={() => setOpenCreate(true)}
                        >
                            <AddIcon fontSize="small" /> Registrar gasto
                        </button>
                    </div>

                    {/* Paginación (visible en móvil y desktop) */}
                    <div className="flex items-center justify-center gap-2">
                        <button
                            className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50"
                            onClick={() => handlePageChange(page - 1)}
                            disabled={!hasPrev || loading}
                            type="button"
                        >
                            <ChevronLeftIcon fontSize="small" />
                        </button>
                        <span className="mx-1 text-sm">
                            {page} / {totalPages || 1}
                        </span>
                        <button
                            className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50"
                            onClick={() => handlePageChange(page + 1)}
                            disabled={(!hasNext && !hasMoreServer) || loading}
                            type="button"
                        >
                            <ChevronRightIcon fontSize="small" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Barra de acciones selección */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="h-9 rounded-md border border-red-500 px-3 text-sm font-medium text-red-500 disabled:opacity-60"
                        onClick={() => setConfirmDelete(true)}
                        disabled={deleting}
                    >
                        {deleting
                            ? "Eliminando…"
                            : `Eliminar (${selectedIds.size})`}
                    </button>
                </div>
            )}

            {loadError && (
                <div className="text-sm text-red-600">
                    {String(loadError)}
                </div>
            )}

            {/* Grid de cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                {filtered.map((g) => {
                    const isSelected = selectedIds.has(g.id);

                    const toggle = () => {
                        setSelectedIds((prev) => {
                            const next = new Set(prev);
                            next.has(g.id) ? next.delete(g.id) : next.add(g.id);
                            return next;
                        });
                    };

                    return (
                        <div
                            key={g.id}
                            role="button"
                            tabIndex={0}
                            onClick={toggle}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    toggle();
                                }
                            }}
                            className={`relative rounded-xl transition-all cursor-pointer border overflow-hidden ${isSelected
                                    ? "border-[var(--tg-primary)] ring-2 ring-[var(--tg-primary)] bg-[color-mix(in_srgb,var(--tg-primary)_10%,var(--tg-card-bg))]"
                                    : "border-transparent hover:border-[var(--tg-primary)]"
                                }`}
                        >
                            {/* contenido de la card */}
                            <div className="relative z-10">
                                <GastoCard gasto={g} />
                            </div>

                            {/* capa extra de brillo al seleccionar */}
                            {isSelected && (
                                <div
                                    className="absolute inset-0 z-20 rounded-xl pointer-events-none"
                                    style={{
                                        background:
                                            "color-mix(in srgb, var(--tg-primary) 8%, transparent)",
                                        boxShadow:
                                            "0 0 10px 2px color-mix(in srgb, var(--tg-primary) 30%, transparent)",
                                    }}
                                />
                            )}
                        </div>
                    );
                })}
            </div>


            {!loading && filtered.length === 0 && (
                <div className="text-sm text-tg-muted border border-tg rounded-md p-4">
                    Sin resultados.
                </div>
            )}

            {/* Modal eliminar */}
            {confirmDelete && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !deleting) {
                            setConfirmDelete(false);
                        }
                    }}
                >
                    <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                        <div className="px-4 py-3 border-b border-tg">
                            <h3 className="text-base font-semibold">
                                Confirmar eliminación
                            </h3>
                        </div>
                        <div className="px-4 py-4 text-sm">
                            ¿Eliminar {selectedIds.size} gasto(s)? Esta acción no se puede deshacer.
                        </div>
                        <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                            <button
                                className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg:white/10"
                                onClick={() => setConfirmDelete(false)}
                                disabled={deleting}
                            >
                                Cancelar
                            </button>
                            <button
                                className="h-9 rounded-md bg-red-600 px-3 text-sm font-medium text-white disabled:opacity-60"
                                onClick={handleConfirmDelete}
                                disabled={deleting}
                            >
                                {deleting
                                    ? "Eliminando…"
                                    : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal crear */}
            <CreateExpenseModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onCreated={() => {
                    setOpenCreate(false);
                    reload();
                    success("Gasto registrado correctamente.");
                }}
            />
        </div>
    );
}
