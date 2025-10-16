"use client";
import { useMemo, useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import GastoCard from "@/features/gastos/GastoCard";
import { useGastos } from "@/hooks/gastos/useGastos";
import { useCategoriasGastos } from "@/hooks/categoria-gastos/useCategoriaGastos";
import { useDeleteGasto } from "@/hooks/gastos/useDeleteGasto";
import DateRangePicker from "@/components/ui/DateRangePicker/DateRangePicker";
import type { DateRange } from "react-day-picker";
import CreateGastoModal from "@/features/gastos/CreateGastoModal";

function inRange(d: string, range?: DateRange) {
    if (!range?.from && !range?.to) return true;
    const t = new Date(d).getTime();
    const from = range?.from
        ? new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), 0, 0, 0, 0).getTime()
        : undefined;
    const to = range?.to
        ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 23, 59, 59, 999).getTime()
        : undefined;
    if (from !== undefined && t < from) return false;
    if (to !== undefined && t > to) return false;
    return true;
}

export default function GastosPage() {
    const [page, setPage] = useState(1);
    const [categoria, setCategoria] = useState<string | undefined>(undefined);
    const [banco, setBanco] = useState<string | undefined>(undefined);
    const [range, setRange] = useState<DateRange | undefined>();
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [openCreate, setOpenCreate] = useState(false);

    const params = useMemo(() => {
        const p: Record<string, any> = {};
        if (categoria) p.categoria = categoria;
        if (banco) p.banco = banco;
        return Object.keys(p).length ? p : undefined;
    }, [categoria, banco]);

    const { data, items, loading, error, refresh } = useGastos(page, params);
    const { items: categorias, loading: loadingCats } = useCategoriasGastos();
    const { remove, loading: deleting } = useDeleteGasto(() => {
        setSelectedIds(new Set());
        refresh();
    });

    const bancos = useMemo(
        () => Array.from(new Set(items.map((g) => g.nombre_banco).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
        [items]
    );

    const filtered = useMemo(
        () =>
            items.filter((g) => {
                if (categoria && g.categoria_gasto_id !== categoria) return false;
                if (banco && g.nombre_banco !== banco) return false;
                if (!inRange(g.fecha_gasto, range)) return false;
                return true;
            }),
        [items, categoria, banco, range]
    );

    async function handleConfirmDelete() {
        for (const id of selectedIds) {
            await remove(id);
        }
        setConfirmDelete(false);
    }

    function clearFilters() {
        setCategoria(undefined);
        setBanco(undefined);
        setRange(undefined);
        setPage(1);
        refresh();
    }

    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <h2 className="text-4xl font-extrabold text-tg-fg">Gastos</h2>

                <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <select
                            className="h-10 min-w-[220px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            value={categoria ?? ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                setPage(1);
                                setCategoria(val ? val : undefined);
                            }}
                            disabled={loadingCats}
                            aria-label="Filtro por categoría"
                            title="Filtrar por categoría"
                        >
                            <option value="">Todas las categorías</option>
                            {categorias.map((c) => (
                                <option key={c.id} value={c.nombre}>
                                    {c.nombre}
                                </option>
                            ))}
                        </select>

                        <select
                            className="h-10 min-w-[200px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            value={banco ?? ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                setPage(1);
                                setBanco(val ? val : undefined);
                            }}
                            disabled={loading}
                            aria-label="Filtro por banco"
                            title="Filtrar por banco"
                        >
                            <option value="">Todos los bancos</option>
                            {bancos.map((b) => (
                                <option key={b} value={b}>
                                    {b}
                                </option>
                            ))}
                        </select>

                        <DateRangePicker value={range} onChange={(r) => { setRange(r); setPage(1); }} />

                        <span
                            role="button"
                            tabIndex={0}
                            onClick={clearFilters}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && clearFilters()}
                            className="cursor-pointer text-sm text-tg-primary hover:underline ml-2 select-none"
                            title="Limpiar filtros"
                            aria-label="Limpiar filtros"
                        >
                            Limpiar filtros
                        </span>

                        <button
                            type="button"
                            className="h-10 rounded-md bg-tg-primary px-4 text-sm font-medium text-tg-on-primary shadow-sm inline-flex items-center gap-1"
                            onClick={() => setOpenCreate(true)}
                        >
                            <AddIcon fontSize="small" /> Registrar gasto
                        </button>
                    </div>

                    <div className="hidden sm:flex items-center">
                        <button
                            className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={!data?.has_prev || loading}
                            aria-label="Página anterior"
                            type="button"
                        >
                            <ChevronLeftIcon fontSize="small" />
                        </button>
                        <span className="mx-2 text-sm">
                            {data?.page ?? page} / {data?.total_pages ?? 1}
                        </span>
                        <button
                            className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50"
                            onClick={() => setPage((p) => p + 1)}
                            disabled={!data?.has_next || loading}
                            aria-label="Página siguiente"
                            type="button"
                        >
                            <ChevronRightIcon fontSize="small" />
                        </button>
                    </div>
                </div>
            </div>

            {selectedIds.size > 0 ? (
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        className="h-9 rounded-md border border-red-500 px-3 text-sm font-medium text-red-500 disabled:opacity-60"
                        onClick={() => setConfirmDelete(true)}
                        disabled={deleting}
                    >
                        {deleting ? "Eliminando…" : `Eliminar (${selectedIds.size})`}
                    </button>
                </div>
            ) : null}

            {error ? <div className="text-sm text-red-600">{error}</div> : null}

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                {filtered.map((g) => {
                    const isSelected = selectedIds.has(g.id);
                    return (
                        <div
                            key={g.id}
                            role="button"
                            tabIndex={0}
                            onClick={() =>
                                setSelectedIds((prev) => {
                                    const next = new Set(prev);
                                    if (next.has(g.id)) next.delete(g.id);
                                    else next.add(g.id);
                                    return next;
                                })
                            }
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    setSelectedIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(g.id)) next.delete(g.id);
                                        else next.add(g.id);
                                        return next;
                                    });
                                }
                            }}
                            className={`rounded-xl transition-colors ${isSelected ? "ring-2 ring-[var(--tg-primary)]" : "ring-0"}`}
                        >
                            <GastoCard gasto={g} />
                        </div>
                    );
                })}
            </div>

            {!loading && filtered.length === 0 ? (
                <div className="text-sm text-tg-muted border border-tg rounded-md p-4">Sin resultados.</div>
            ) : null}

            <div className="flex sm:hidden items-center justify-end pt-2">
                <button
                    className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!data?.has_prev || loading}
                    type="button"
                >
                    <ChevronLeftIcon fontSize="small" />
                </button>
                <span className="mx-2 text-sm">
                    {data?.page ?? page} / {data?.total_pages ?? 1}
                </span>
                <button
                    className="h-9 w-9 grid place-items-center rounded border border-tg disabled:opacity-50"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!data?.has_next || loading}
                    type="button"
                >
                    <ChevronRightIcon fontSize="small" />
                </button>
            </div>

            {confirmDelete ? (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                    onClick={(e) => { if (e.target === e.currentTarget && !deleting) setConfirmDelete(false); }}
                    onKeyDown={(e) => { if (e.key === "Escape" && !deleting) setConfirmDelete(false); }}
                >
                    <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                        <div className="px-4 py-3 border-b border-tg">
                            <h3 className="text-base font-semibold">Confirmar eliminación</h3>
                        </div>
                        <div className="px-4 py-4 text-sm">¿Eliminar {selectedIds.size} gasto(s)? Esta acción no se puede deshacer.</div>
                        <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                            <button
                                className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg-white/10"
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
                                {deleting ? "Eliminando…" : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            <CreateGastoModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                onCreated={() => {
                    setOpenCreate(false);
                    refresh();
                }}
            />
        </div>
    );
}
