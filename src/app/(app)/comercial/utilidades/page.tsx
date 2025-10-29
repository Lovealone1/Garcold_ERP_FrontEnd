// app/(comercial)/utilidades/page.tsx
"use client";

import { useEffect, useMemo, useState, CSSProperties } from "react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { MaterialIcon } from "@/components/ui/material-icon";
import { fetchAllProfits } from "@/services/sales/profit.api";
import { getSaleById } from "@/services/sales/sale.api";
import type { Profit } from "@/types/profit";
import UtilidadView from "@/features/utilidades/ViewDetalleUtilidades";
import DateRangeInput from "@/components/ui/DateRangePicker/DateRangePicker";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export default function UtilidadesPage() {
    const [all, setAll] = useState<Profit[]>([]);
    const [loading, setLoading] = useState(true);

    // mapa sale_id -> nombre cliente
    const [clienteByVenta, setClienteByVenta] = useState<Record<number, string>>({});

    // filtros
    const [q, setQ] = useState("");
    const [range, setRange] = useState<DateRange | undefined>(undefined);

    // paginación
    const pageSize = 10;
    const [page, setPage] = useState(1);

    // modal
    const [openView, setOpenView] = useState(false);
    const [ventaToView, setVentaToView] = useState<number | null>(null);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const data = await fetchAllProfits(Date.now());
                if (alive) setAll(data);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    // Cargar nombres de clientes para ventas no cacheadas (lotes de 25)
    useEffect(() => {
        if (!all.length) return;
        const missing = Array.from(new Set(all.map(u => u.sale_id).filter(id => clienteByVenta[id] == null)));
        if (missing.length === 0) return;

        let cancelled = false;

        (async () => {
            const chunk = 25;
            const nextMap: Record<number, string> = {};
            for (let i = 0; i < missing.length; i += chunk) {
                const ids = missing.slice(i, i + chunk);
                const results = await Promise.allSettled(ids.map(id => getSaleById(id)));
                results.forEach((res, idx) => {
                    const id = ids[idx];
                    if (res.status === "fulfilled") nextMap[id] = res.value?.customer ?? "";
                    else nextMap[id] = "";
                });
                if (cancelled) return;
                setClienteByVenta(prev => ({ ...prev, ...nextMap }));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [all, clienteByVenta]);

    // filtros
    const filtered = useMemo(() => {
        const v = q.trim().toLowerCase();
        const byVentaOrCliente = (u: Profit) => {
            if (!v) return true;
            if (String(u.sale_id).includes(v)) return true;
            const nombre = (clienteByVenta[u.sale_id] ?? "").toLowerCase();
            return nombre.includes(v);
        };
        const byDate = (u: Profit) => {
            if (!range?.from || !range?.to) return true;
            const d = new Date(u.created_at);
            const from = startOfDay(range.from);
            const to = endOfDay(range.to);
            return isWithinInterval(d, { start: from, end: to });
        };
        return all.filter(u => byVentaOrCliente(u) && byDate(u));
    }, [all, q, range, clienteByVenta]);

    // total utilidades según filtros
    const totalProfitFiltered = useMemo(
        () => filtered.reduce((acc, u) => acc + (u.profit ?? 0), 0),
        [filtered]
    );

    useEffect(() => {
        setPage(1);
    }, [q, range]);

    // paginado en memoria
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const rows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    const from = useMemo(() => (total === 0 ? 0 : (safePage - 1) * pageSize + 1), [safePage, pageSize, total]);
    const to = useMemo(() => Math.min(safePage * pageSize, total), [safePage, pageSize, total]);

    // ventana de números
    const [startNum, endNum] = useMemo(() => {
        const win = 5;
        if (totalPages <= win) return [1, totalPages] as const;
        const s = Math.max(1, Math.min(safePage - 2, totalPages - (win - 1)));
        return [s, s + (win - 1)] as const;
    }, [safePage, totalPages]);

    const frameVars: CSSProperties = { ["--content-x" as any]: "16px" };

    function handleClearFilters() {
        setQ("");
        setRange(undefined);
    }

    function onView(ventaId: number) {
        setVentaToView(ventaId);
        setOpenView(true);
    }

    return (
        <>
            <div className="app-shell__frame" style={frameVars}>
                <div className="bg-[var(--page-bg)] rounded-xl h-full flex flex-col px-[var(--content-x)] pt-3 pb-5">
                    {/* Header + filtros */}
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-2xl font-semibold text-tg-fg">Utilidades</h2>

                            {/* Total utilidades basado en filtros */}
                            {loading ? (
                                <span className="h-7 w-40 rounded-full border border-tg bg-black/10 dark:bg-white/10 animate-pulse" />
                            ) : (
                                <span
                                    className="inline-flex items-center gap-2 rounded-full border border-tg px-3 h-7
                             bg-[color-mix(in_srgb,var(--panel-bg)_92%,transparent)] text-sm"
                                    title="Total utilidades del listado actual"
                                >
                                    <span className="opacity-70">Total utilidades</span>
                                    <span className="font-semibold text-tg">{money.format(totalProfitFiltered)}</span>
                                </span>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {/* Buscar */}
                            <label className="relative flex items-center flex-none h-10 w-[300px]">
                                <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
                                    <MaterialIcon name="search" size={18} />
                                </span>
                                <input
                                    type="search"
                                    placeholder="Buscar por venta o cliente"
                                    className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3
                  focus:outline-none focus:ring-tg-primary"
                                    value={q}
                                    onChange={(e) => setQ(e.target.value)}
                                />
                            </label>

                            {/* Rango fechas */}
                            <DateRangeInput value={range} onChange={setRange} className="ml-1" placeholder="dd/mm/aaaa / dd/mm/aaaa" />

                            {/* Limpiar */}
                            <span
                                onClick={handleClearFilters}
                                className="cursor-pointer text-sm text-tg-primary hover:underline ml-2 mr-2 select-none"
                                role="button"
                                tabIndex={0}
                            >
                                Limpiar filtros
                            </span>
                        </div>
                    </div>

                    {/* Tabla */}
                    <div className="rounded-xl border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-md flex-1 min-h-0 flex flex-col overflow-hidden">
                        <div className="flex-1 min-h-0 overflow-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                                        <th className="px-4 py-3 text-left">Venta / Cliente</th>
                                        <th className="px-4 py-3 text-right">Utilidad</th>
                                        <th className="px-4 py-3 text-left">Fecha</th>
                                        <th className="px-4 py-3 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        Array.from({ length: 10 }).map((_, i) => (
                                            <tr key={`sk-${i}`} className="border-t border-tg">
                                                {Array.from({ length: 4 }).map((__, j) => (
                                                    <td key={j} className="px-4 py-3">
                                                        <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
                                                    </td>
                                                ))}
                                            </tr>
                                        ))
                                    ) : rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-10 text-center text-tg-muted">
                                                Sin registros
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((r) => {
                                            const nombre = clienteByVenta[r.sale_id];
                                            return (
                                                <tr
                                                    key={`${r.sale_id}-${r.created_at}`}
                                                    className="border-t border-tg hover:bg-black/5 dark:hover:bg-white/5"
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className="font-medium">#{r.sale_id}</span>
                                                        <span className="opacity-70"> — {nombre ? nombre : "…"}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-right">{money.format(r.profit)}</td>
                                                    <td className="px-4 py-3">
                                                        {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                                                    </td>
                                                    <td className="px-2 py-2">
                                                        <div className="flex items-center justify-center">
                                                            <button
                                                                className="p-2 rounded-full text-tg-primary hover:bg-[color-mix(in_srgb,var(--tg-primary)_22%,transparent)]"
                                                                aria-label="ver detalle utilidad"
                                                                title="Ver detalle de utilidad"
                                                                onClick={() => onView(r.sale_id)}
                                                            >
                                                                <MaterialIcon name="visibility" size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Paginación */}
                        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-tg px-4 py-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">Líneas por página</span>
                                <select value={pageSize} disabled className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted">
                                    <option value={pageSize}>{pageSize}</option>
                                </select>
                            </div>

                            <nav className="flex items-center gap-1">
                                <button
                                    disabled={safePage <= 1}
                                    onClick={() => setPage(1)}
                                    className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                                    aria-label="Primera página"
                                    title="Primera página"
                                >
                                    <MaterialIcon name="first_page" size={18} />
                                </button>

                                <button
                                    disabled={safePage <= 1}
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                                    aria-label="Anterior"
                                    title="Anterior"
                                >
                                    <MaterialIcon name="chevron_left" size={18} />
                                </button>

                                {Array.from({ length: endNum - startNum + 1 }, (_, i) => startNum + i).map((p) => {
                                    const active = p === safePage;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => setPage(p)}
                                            className={`h-8 min-w-8 rounded px-2 text-sm ${active ? "bg-tg-primary text-tg-on-primary" : "hover:bg-black/10 dark:hover:bg-white/10"} focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary`}
                                            aria-current={active ? "page" : undefined}
                                        >
                                            {p}
                                        </button>
                                    );
                                })}

                                {endNum < totalPages && <span className="px-1">…</span>}

                                <button
                                    disabled={safePage >= totalPages}
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                                    aria-label="Próximo"
                                    title="Próximo"
                                >
                                    <MaterialIcon name="chevron_right" size={18} />
                                </button>

                                <button
                                    disabled={safePage >= totalPages}
                                    onClick={() => setPage(totalPages)}
                                    className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                                    aria-label="Última página"
                                    title="Última página"
                                >
                                    <MaterialIcon name="last_page" size={18} />
                                </button>
                            </nav>

                            <div className="text-sm text-tg-muted">Exhibiendo {from}-{to} de {total} registros</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <UtilidadView open={openView} onClose={() => setOpenView(false)} ventaId={ventaToView} />
        </>
    );
}
