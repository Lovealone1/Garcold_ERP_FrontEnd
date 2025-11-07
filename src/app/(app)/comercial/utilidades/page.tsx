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

/* -------- Tokens visuales -------- */
const FRAME_BG = "color-mix(in srgb, var(--tg-bg) 90%, #fff 3%)";
const OUTER_BG = "color-mix(in srgb, var(--tg-bg) 55%, #000 45%)";
const INNER_BG = "color-mix(in srgb, var(--tg-bg) 95%, #fff 2%)";
const PILL_BG = "color-mix(in srgb, var(--tg-card-bg) 60%, #000 40%)";
const ACTION_BG = "color-mix(in srgb, var(--tg-primary) 28%, transparent)";
const BORDER = "var(--tg-border)";
const actionBtn =
    "h-8 w-8 grid place-items-center rounded-full text-[var(--tg-primary)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary";

/* Estilo *inline* para el DateRangePicker (un solo “chip” con el icono adentro) */
const DPR_SOLID =
    "inline-flex items-stretch h-10 w-full rounded-md border border-tg bg-tg-card overflow-hidden " +
    // input
    "[&_input]:flex-1 [&_input]:h-10 [&_input]:bg-transparent [&_input]:border-0 [&_input]:px-3 [&_input]:text-tg-card " +
    // botón SIN divider
    "[&_button]:h-10 [&_button]:w-10 [&_button]:p-0 [&_button]:bg-transparent [&_button]:border-0 " +
    "[&_button]:outline-none [&_button]:shadow-none " +          // evita sombras/bordes de lib
    // svg sin márgenes
    "[&_button_svg]:!m-0";

/* Skeleton compacto */
const SKEL = "h-[56px] rounded-lg border border-white/10 bg-black/10 animate-pulse";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

/* ----------------- Card ----------------- */
function ProfitCard({
    r, customer, onView,
}: { r: Profit; customer?: string; onView: (saleId: number) => void }) {
    return (
        <div className="relative rounded-xl border shadow-sm" style={{ background: OUTER_BG, borderColor: BORDER }}>
            {/* Desktop */}
            <div className="hidden sm:block mx-1.5 my-2 rounded-md px-3 py-2.5" style={{ background: INNER_BG }}>
                <div className="grid items-center gap-3" style={{ gridTemplateColumns: "1fr 150px 150px 120px" }}>
                    <div className="min-w-0 text-[13px] text-white/90 truncate">{customer || "…"}</div>
                    <div className="min-w-[140px] h-8 px-2.5 rounded-md grid place-items-center text-[13px] font-semibold text-white/90 border justify-self-end"
                        style={{ background: PILL_BG, borderColor: BORDER }}>
                        {money.format(r.profit)}
                    </div>
                    <div className="min-w-[140px] h-8 px-2.5 rounded-md grid place-items-center text-[13px] text-white/90 border justify-self-end"
                        style={{ background: PILL_BG, borderColor: BORDER }}>
                        {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                    </div>
                    <div className="flex items-center justify-end gap-2">
                        <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="ver" onClick={() => onView(r.sale_id)}>
                            <MaterialIcon name="visibility" size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Móvil */}
            <div className="sm:hidden relative mx-2.5 my-3 rounded-md px-3 py-2 min-h-[72px]" style={{ background: INNER_BG }}>
                <button
                    className={actionBtn + " absolute right-2 top-1/2 -translate-y-1/2"}
                    style={{ background: ACTION_BG }}
                    aria-label="ver"
                    title="Ver detalle de utilidad"
                    onClick={() => onView(r.sale_id)}
                >
                    <MaterialIcon name="visibility" size={18} />
                </button>

                <div className="min-w-0 pr-12">
                    <div className="text-sm font-extrabold tracking-wide truncate">{customer || "…"}</div>
                    <div className="mt-1 grid grid-cols-2 gap-2">
                        <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                            <div className="uppercase opacity-70">Utilidad</div>
                            <div className="font-semibold">{money.format(r.profit)}</div>
                        </div>
                        <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                            <div className="uppercase opacity-70">Fecha</div>
                            <div className="font-medium">{format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ----------------- Página ----------------- */
export default function UtilidadesPage() {
    const [all, setAll] = useState<Profit[]>([]);
    const [loading, setLoading] = useState(true);
    const [clienteByVenta, setClienteByVenta] = useState<Record<number, string>>({});

    // filtros
    const [q, setQ] = useState("");
    const [range, setRange] = useState<DateRange | undefined>(undefined);

    // paginación fija a 16
    const pageSize = 16;
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
        return () => { alive = false; };
    }, []);

    // cargar nombres por lotes
    useEffect(() => {
        if (!all.length) return;
        const missing = Array.from(new Set(all.map(u => u.sale_id).filter(id => clienteByVenta[id] == null)));
        if (missing.length === 0) return;
        let cancelled = false;
        (async () => {
            const chunk = 25;
            for (let i = 0; i < missing.length; i += chunk) {
                const ids = missing.slice(i, i + chunk);
                const results = await Promise.allSettled(ids.map(id => getSaleById(id)));
                const next: Record<number, string> = {};
                results.forEach((res, idx) => { next[ids[idx]] = res.status === "fulfilled" ? res.value?.customer ?? "" : ""; });
                if (cancelled) return;
                setClienteByVenta(prev => ({ ...prev, ...next }));
            }
        })();
        return () => { cancelled = true; };
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
            return isWithinInterval(d, { start: startOfDay(range.from), end: endOfDay(range.to) });
        };
        return all.filter(u => byVentaOrCliente(u) && byDate(u));
    }, [all, q, range, clienteByVenta]);

    const totalProfitFiltered = useMemo(() => filtered.reduce((acc, u) => acc + (u.profit ?? 0), 0), [filtered]);

    useEffect(() => { setPage(1); }, [q, range]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const rows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    const from = useMemo(() => (total === 0 ? 0 : (safePage - 1) * pageSize + 1), [safePage, pageSize, total]);
    const to = useMemo(() => Math.min(safePage * pageSize, total), [safePage, pageSize, total]);

    const [startNum, endNum] = useMemo(() => {
        const win = 5;
        if (totalPages <= win) return [1, totalPages] as const;
        const s = Math.max(1, Math.min(safePage - 2, totalPages - (win - 1)));
        return [s, s + (win - 1)] as const;
    }, [safePage, totalPages]);

    const frameVars: CSSProperties = { ["--content-x" as any]: "16px" };

    function handleClearFilters() { setQ(""); setRange(undefined); }
    function onView(ventaId: number) { setVentaToView(ventaId); setOpenView(true); }

    return (
        <>
            <div className="app-shell__frame" style={frameVars}>
                {/* Toolbar */}
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
                    {/* Izquierda: buscador + total */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 min-w-0">
                        <label className="relative flex h-10 w-full sm:w-[380px]">
                            <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
                                <MaterialIcon name="search" size={18} />
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar por venta o cliente"
                                className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 focus:outline-none focus:ring-tg-primary"
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                        </label>

                        {loading ? (
                            <span className="h-7 w-44 rounded-full border border-tg bg-black/10 dark:bg-white/10 animate-pulse" />
                        ) : (
                            <span
                                className="inline-flex items-center h-7 px-3 rounded-full border border-tg bg-[color-mix(in_srgb,var(--panel-bg)_92%,transparent)] text-[13px] leading-tight"
                                title="Total utilidades del listado actual"
                            >
                                <span className="opacity-70 mr-2 whitespace-nowrap">Total utilidades</span>
                                <span className="font-semibold text-tg whitespace-nowrap">{money.format(totalProfitFiltered)}</span>
                            </span>
                        )}
                    </div>

                    {/* Derecha: datepicker inline + limpiar */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2 w-full sm:w-auto">
                        <DateRangeInput
                            value={range}
                            onChange={setRange}
                            placeholder="dd/mm/aaaa / dd/mm/aaaa"
                            className={`${DPR_SOLID} w-full sm:w-[300px]`}
                        />
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="h-10 rounded-md px-3 text-sm border border-tg bg-[var(--panel-bg)] w-full sm:w-auto"
                            title="Limpiar filtros"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                </div>

                {/* Contenedor: cards + paginación */}
                <div className="rounded-xl border flex-1 min-h-0 flex flex-col overflow-hidden" style={{ background: FRAME_BG, borderColor: BORDER }}>
                    <div className="flex-1 min-h-0 overflow-auto px-3 pt-2 pb-2">
                        {loading ? (
                            <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
                                {Array.from({ length: 16 }).map((_, i) => (
                                    <div key={`sk-${i}`} className={SKEL} />
                                ))}
                            </div>
                        ) : rows.length === 0 ? (
                            <div className="h-full grid place-items-center text-tg-muted text-sm">Sin registros</div>
                        ) : (
                            <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
                                {rows.map((r) => (
                                    <ProfitCard
                                        key={`${r.sale_id}-${r.created_at}`}
                                        r={r}
                                        customer={clienteByVenta[r.sale_id]}
                                        onView={onView}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Paginación */}
                    <div className="shrink-0 px-3 pb-2 pt-1 flex flex-wrap gap-3 items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Líneas por página</span>
                            <select value={pageSize} disabled className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted">
                                <option value={pageSize}>{pageSize}</option>
                            </select>
                        </div>

                        <nav className="flex items-center gap-1">
                            <button disabled={page <= 1} onClick={() => setPage(1)} className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary" aria-label="Primera página">
                                <MaterialIcon name="first_page" size={18} />
                            </button>
                            <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary" aria-label="Anterior">
                                <MaterialIcon name="chevron_left" size={18} />
                            </button>

                            {Array.from({ length: endNum - startNum + 1 }, (_, i) => startNum + i).map((p) => {
                                const active = p === page;
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

                            <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary" aria-label="Próximo">
                                <MaterialIcon name="chevron_right" size={18} />
                            </button>
                            <button disabled={page >= totalPages} onClick={() => setPage(totalPages)} className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary" aria-label="Última página">
                                <MaterialIcon name="last_page" size={18} />
                            </button>
                        </nav>

                        <div className="text-sm text-tg-muted">{from} - {to} de {total}</div>
                    </div>
                </div>
            </div>

            {/* Modal */}
            <UtilidadView open={openView} onClose={() => setOpenView(false)} ventaId={ventaToView} />
        </>
    );
}
