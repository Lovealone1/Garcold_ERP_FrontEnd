// app/(comercial)/transacciones/page.tsx
"use client";

import { useEffect, useMemo, useState, CSSProperties } from "react";
import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";

import { MaterialIcon } from "@/components/ui/material-icon";
import DateRangeInput from "@/components/ui/DateRangePicker/DateRangePicker";

// === API (ajusta a tu servicio real) ===
import { fetchAllTransactions } from "@/services/sales/transaction.api";
type Tx = {
    id: number;
    amount: number;               // monto (+/-)
    created_at: string;           // ISO
    description?: string | null;  // texto principal (cliente, concepto, etc.)
    status?: "ok" | "pending" | "error" | string; // para el dot
};

// ===== Tokens visuales (consistentes) =====
const FRAME_BG = "color-mix(in srgb, var(--tg-bg) 90%, #fff 3%)";
const OUTER_BG = "color-mix(in srgb, var(--tg-bg) 55%, #000 45%)";
const INNER_BG = "color-mix(in srgb, var(--tg-bg) 95%, #fff 2%)";
const PILL_BG = "color-mix(in srgb, var(--tg-card-bg) 60%, #000 40%)";
const ACTION_BG = "color-mix(in srgb, var(--tg-primary) 28%, transparent)";
const BORDER = "var(--tg-border)";
const actionBtn =
    "h-8 w-8 grid place-items-center rounded-full text-[var(--tg-primary)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary";

const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

// ====== Card ======
function StatusDot({ status }: { status?: string }) {
    // verde por defecto, puedes mapear más estados si lo necesitas
    const color =
        status === "error" ? "#ef4444" : status === "pending" ? "#eab308" : "var(--tg-success, #22c55e)";
    return (
        <span
            aria-hidden
            className="inline-block h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: color, boxShadow: `0 0 0 6px color-mix(in srgb, ${color} 15%, transparent)` }}
        />
    );
}

function TxCard({ r, onView }: { r: Tx; onView: (txId: number) => void }) {
    const title = r.description?.trim() || "—";

    return (
        <div className="relative rounded-xl border shadow-sm" style={{ background: OUTER_BG, borderColor: BORDER }}>
            {/* Desktop */}
            <div className="hidden sm:block mx-1.5 my-2 rounded-md px-3 py-3" style={{ background: INNER_BG }}>
                <div className="grid items-center gap-3" style={{ gridTemplateColumns: "auto 1fr 160px 160px 136px" }}>
                    {/* Dot estado SIN número */}
                    <div className="flex items-center">
                        <StatusDot status={r.status} />
                    </div>

                    {/* Descripción */}
                    <div className="min-w-0 text-[13px] text-white/90 truncate">{title}</div>

                    {/* Monto */}
                    <div
                        className="min-w-[140px] h-8 px-2.5 rounded-md grid place-items-center text-[13px] font-semibold text-white/90 border justify-self-end"
                        style={{ background: PILL_BG, borderColor: BORDER }}
                        title="Monto"
                    >
                        {money.format(r.amount)}
                    </div>

                    {/* Fecha */}
                    <div
                        className="min-w-[140px] h-8 px-2.5 rounded-md grid place-items-center text-[13px] text-white/90 border justify-self-end"
                        style={{ background: PILL_BG, borderColor: BORDER }}
                        title="Fecha"
                    >
                        {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                    </div>

                    {/* Acción */}
                    <div className="flex items-center justify-end gap-2">
                        <button
                            className={actionBtn}
                            style={{ background: ACTION_BG }}
                            aria-label="ver transacción"
                            title="Ver detalle de la transacción"
                            onClick={() => onView(r.id)}
                        >
                            <MaterialIcon name="visibility" size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Móvil: acción libre centrada verticalmente y sin contenedor propio */}
            <div className="sm:hidden relative mx-2.5 my-3 rounded-md px-3 py-2 min-h-[84px]" style={{ background: INNER_BG }}>
                <button
                    className={actionBtn + " absolute right-2 top-1/2 -translate-y-1/2"}
                    style={{ background: ACTION_BG }}
                    aria-label="ver transacción"
                    title="Ver detalle de la transacción"
                    onClick={() => onView(r.id)}
                >
                    <MaterialIcon name="visibility" size={18} />
                </button>

                <div className="min-w-0 pr-12">
                    <div className="flex items-center gap-2">
                        <StatusDot status={r.status} />
                        <div className="text-sm font-extrabold tracking-wide truncate">{title}</div>
                    </div>

                    <div className="mt-1 grid grid-cols-2 gap-2">
                        <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                            <div className="uppercase opacity-70">Monto</div>
                            <div className="font-semibold">{money.format(r.amount)}</div>
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

// ====== Página ======
export default function TransaccionesPage() {
    const [all, setAll] = useState<Tx[]>([]);
    const [loading, setLoading] = useState(true);

    // filtros
    const [q, setQ] = useState("");
    const [range, setRange] = useState<DateRange | undefined>(undefined);

    // paginación fija a 8
    const pageSize = 8;
    const [page, setPage] = useState(1);

    useEffect(() => {
        let alive = true;
        const ac = new AbortController();

        (async () => {
            setLoading(true);
            try {
                const data = await fetchAllTransactions({ signal: ac.signal /*, maxPages: 200 */ });
                if (alive) setAll(data);
            } catch (e) {
                if (alive && (e as any).name !== "CanceledError") {
                    // opcional: setError(...)
                }
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => {
            alive = false;
            ac.abort();
        };
    }, []);

    // filtros
    const filtered = useMemo(() => {
        const v = q.trim().toLowerCase();
        const byText = (t: Tx) => {
            if (!v) return true;
            return (t.description ?? "").toLowerCase().includes(v);
        };
        const byDate = (t: Tx) => {
            if (!range?.from || !range?.to) return true;
            const d = new Date(t.created_at);
            return isWithinInterval(d, { start: startOfDay(range.from), end: endOfDay(range.to) });
        };
        return all.filter((t) => byText(t) && byDate(t));
    }, [all, q, range]);

    const totalAmount = useMemo(() => filtered.reduce((acc, t) => acc + (t.amount ?? 0), 0), [filtered]);

    useEffect(() => {
        setPage(1);
    }, [q, range]);

    // paginado
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const rows = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage]);

    const from = useMemo(() => (total === 0 ? 0 : (safePage - 1) * pageSize + 1), [safePage, total]);
    const to = useMemo(() => Math.min(safePage * pageSize, total), [safePage, total]);

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

    function onView(txId: number) {
        // abre modal o navega. Deja el hook/Modal que uses en ventas.
        console.debug("view tx", txId);
    }

    return (
        <div className="app-shell__frame" style={frameVars}>
            {/* Toolbar: fuera del contenedor */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                    <label className="relative flex items-center h-10 w-[320px] sm:w-[380px]">
                        <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
                            <MaterialIcon name="search" size={18} />
                        </span>
                        <input
                            type="search"
                            placeholder="Buscar por descripción"
                            className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 focus:outline-none focus:ring-tg-primary"
                            value={q}
                            onChange={(e) => setQ(e.target.value)}
                        />
                    </label>

                    {loading ? (
                        <span className="h-7 w-44 rounded-full border border-tg bg-black/10 dark:bg-white/10 animate-pulse" />
                    ) : (
                        <span
                            className="inline-flex items-center gap-2 rounded-full border border-tg px-3 h-10
                         bg-[color-mix(in_srgb,var(--panel-bg)_92%,transparent)] text-sm"
                            title="Suma de montos filtrados"
                        >
                            <span className="opacity-70">Total montos</span>
                            <span className="font-semibold text-tg">{money.format(totalAmount)}</span>
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <DateRangeInput value={range} onChange={setRange} placeholder="dd/mm/aaaa / dd/mm/aaaa" />
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="h-10 rounded-md px-3 text-sm border border-tg bg-[var(--panel-bg)]"
                        title="Limpiar filtros"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </div>

            {/* ÚNICO contenedor: cards + paginación */}
            <div className="rounded-xl border flex-1 min-h-0 flex flex-col overflow-hidden" style={{ background: FRAME_BG, borderColor: BORDER }}>
                <div className="flex-1 min-h-0 overflow-auto px-3 pt-2 pb-2">
                    {loading ? (
                        <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={`sk-${i}`} className="h-[84px] rounded-xl border bg-black/10 animate-pulse" />
                            ))}
                        </div>
                    ) : rows.length === 0 ? (
                        <div className="h-full grid place-items-center text-tg-muted text-sm">Sin registros</div>
                    ) : (
                        <div className="grid gap-3 sm:grid-cols-2 sm:gap-3.5">
                            {rows.map((r) => (
                                <TxCard key={`${r.id}-${r.created_at}`} r={r} onView={onView} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Paginación pegada al borde inferior */}
                <div className="shrink-0 px-3 pb-2 pt-1 flex flex-wrap gap-3 items-center justify-between">
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
                        >
                            <MaterialIcon name="first_page" size={18} />
                        </button>
                        <button
                            disabled={safePage <= 1}
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                            aria-label="Anterior"
                        >
                            <MaterialIcon name="chevron_left" size={18} />
                        </button>

                        {Array.from({ length: endNum - startNum + 1 }, (_, i) => startNum + i).map((p) => {
                            const active = p === safePage;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`h-8 min-w-8 rounded px-2 text-sm ${active ? "bg-tg-primary text-tg-on-primary" : "hover:bg-black/10 dark:hover:bg-white/10"
                                        } focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary`}
                                    aria-current={active ? "page" : undefined}
                                >
                                    {p}
                                </button>
                            );
                        })}

                        {endNum < totalPages && <span className="px-1">…</span>}

                        <button
                            disabled={safePage >= totalPages}
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                            aria-label="Próximo"
                        >
                            <MaterialIcon name="chevron_right" size={18} />
                        </button>
                        <button
                            disabled={safePage >= totalPages}
                            onClick={() => setPage(totalPages)}
                            className="h-8 w-8 rounded grid place-items-center disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                            aria-label="Última página"
                        >
                            <MaterialIcon name="last_page" size={18} />
                        </button>
                    </nav>

                    <div className="text-sm text-tg-muted">
                        {total === 0 ? "0 - 0 de 0 registros" : `${from} - ${to} de ${total} ${total === 1 ? "registro" : "registros"}`}
                    </div>
                </div>
            </div>
        </div>
    );
}
