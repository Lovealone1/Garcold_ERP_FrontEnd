// app/(comercial)/transacciones/page.tsx
"use client";

import { useMemo, useState, CSSProperties } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { MaterialIcon } from "@/components/ui/material-icon";

import { useTransactions } from "@/hooks/transacciones/useTransacciones";
import { useDeleteTransaction } from "@/hooks/transacciones/useDeleteTransaccion";
import { useCreateTransaction } from "@/hooks/transacciones/useCreateTransaccion";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import NewTransactionModal from "@/features/transacciones/NuevaTransaccionModal";
import DateRangePicker from "@/components/ui/DateRangePicker/DateRangePicker";
import type { TransactionCreate, TransactionView } from "@/types/transaction";

/* -------- Tokens visuales -------- */
const FRAME_BG = "color-mix(in srgb, var(--tg-bg) 90%, #fff 3%)";
const OUTER_BG = "color-mix(in srgb, var(--tg-bg) 55%, #000 45%)";
const INNER_BG = "color-mix(in srgb, var(--tg-bg) 95%, #fff 2%)";
const PILL_BG = "color-mix(in srgb, var(--tg-card-bg) 60%, #000 40%)";
const ACTION_BG = "color-mix(in srgb, var(--tg-primary) 28%, transparent)";
const ACTION_BG_DISABLED = "color-mix(in srgb, var(--tg-card-bg) 75%, #000 25%)";
const BORDER = "var(--tg-border)";
const pill =
    "min-w-[90px] h-8 px-2.5 rounded-md grid place-items-center text-[13px] text-white/90 border";
const actionBtn =
    "h-8 w-8 grid place-items-center rounded-full text-[var(--tg-primary)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary";

/* MISMO estilo del DateRangePicker usado en Ventas */
const DPR_MOBILE =
    // input
    "[&_input]:h-10 [&_input]:w-full [&_input]:rounded-l-md [&_input]:border [&_input]:border-tg " +
    "[&_input]:bg-tg-card [&_input]:px-3 [&_input]:text-[14px] [&_input]:text-tg-card " +
    // botón calendario
    "[&_button]:h-10 [&_button]:w-10 [&_button]:rounded-r-md [&_button]:p-0 " +
    "[&_button]:border [&_button]:border-l-0 [&_button]:border-tg [&_button]:bg-tg-card " +
    // svg sin margen
    "[&_button_svg]:!m-0 inline-flex";

/* utilidades */
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const clip = (s?: string | null, n = 28) => (s ?? "—").length > n ? (s as string).slice(0, n).trimEnd() + "…" : (s ?? "—");
const SKELETON_COUNT = 8;

/* Indicador */
function Dot({ auto }: { auto: boolean }) {
    const color = auto ? "#ef4444" : "var(--tg-primary)";
    return <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />;
}

/* Header sin label de Acciones */
const GRID_COLS = "30px 200px 160px 150px 1fr 160px 40px";
const HEADER_COLS = "30px 200px 160px 150px 1fr 160px 50px";
function HeaderRow() {
    return (
        <div className="hidden sm:grid items-center gap-4 mb-2 font-extrabold mx-2" style={{ gridTemplateColumns: HEADER_COLS }}>
            <span />
            <span className="text-white">Banco</span>
            <span className="text-white text-center">Tipo</span>
            <span className="text-white text-center">Monto</span>
            <span className="text-white text-center">Descripción</span>
            <span className="text-white text-center">Fecha</span>
            <span />
        </div>
    );
}

/* Fila */
function TxRow({ r, onDelete }: { r: TransactionView; onDelete: (id: number) => void }) {
    const isAuto = !!r.is_auto;

    return (
        <div className="relative rounded-xl border shadow-sm" style={{ background: OUTER_BG, borderColor: BORDER }}>
            {/* Desktop */}
            <div className="hidden sm:block mx-1.5 my-2 rounded-md px-3 py-2.5" style={{ background: INNER_BG }}>
                <div className="grid items-center gap-4" style={{ gridTemplateColumns: GRID_COLS }}>
                    <div className="grid place-items-center">
                        <Dot auto={isAuto} />
                    </div>

                    <div className="text-[13px] text-white/90 truncate">{clip(r.bank, 36)}</div>

                    <div className={pill} style={{ background: PILL_BG, borderColor: BORDER }}>
                        {clip(r.type_str, 18)}
                    </div>

                    <div className={`${pill} font-semibold text-right`} style={{ background: PILL_BG, borderColor: BORDER }}>
                        {money.format(r.amount)}
                    </div>

                    <div
                        className="min-w-0 rounded-md border px-3 h-8 grid place-items-center text-[13px] text-white/90"
                        style={{ background: PILL_BG, borderColor: BORDER }}
                        title={r.description || "—"}
                    >
                        <span className="w-full truncate text-center">{clip(r.description, 64)}</span>
                    </div>

                    <div className={`${pill} text-center`} style={{ background: PILL_BG, borderColor: BORDER }}>
                        {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                    </div>

                    <div className="flex items-center justify-end">
                        <button
                            className={`${actionBtn} ${isAuto ? "hover:opacity-100 focus-visible:ring-0" : ""}`}
                            style={{ background: isAuto ? ACTION_BG_DISABLED : ACTION_BG, color: isAuto ? "rgba(255,255,255,0.45)" : "var(--tg-primary)" }}
                            aria-label="eliminar"
                            title={isAuto ? "Automática: no se puede eliminar" : "Eliminar"}
                            disabled={isAuto}
                            onClick={() => !isAuto && onDelete(r.id)}
                        >
                            <MaterialIcon name="delete" size={18} className={isAuto ? "text-white/40" : undefined} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Móvil */}
            <div className="sm:hidden mx-2.5 my-3 rounded-md px-3 py-2 min-h-[84px]" style={{ background: INNER_BG }}>
                <div className="flex items-start gap-3">
                    <Dot auto={isAuto} />

                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 min-w-0">
                            <span className={`${pill} !h-6 !min-w-[64px] !text-[12px]`} style={{ background: PILL_BG, borderColor: BORDER }}>
                                {clip(r.type_str, 18)}
                            </span>
                            <span className="text-sm font-extrabold tracking-wide truncate">{r.bank}</span>
                        </div>

                        <div className="mt-1 grid grid-cols-3 gap-2">
                            <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                                <div className="uppercase opacity-70">Monto</div>
                                <div className="font-semibold">{money.format(r.amount)}</div>
                            </div>
                            <div className="rounded-md border px-2 py-1 col-span-2 text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                                <div className="uppercase opacity-70 text-center sm:text-left">Descripción</div>
                                <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis text-center sm:text-left">
                                    {clip(r.description, 48)}
                                </div>
                            </div>
                        </div>

                        <div className="mt-1 text-[12px] opacity-80">
                            {format(new Date(r.created_at), "dd MMM yyyy", { locale: es })}
                        </div>
                    </div>

                    <div className="ml-2 flex items-center gap-2 shrink-0">
                        <button
                            className={`${actionBtn} ${isAuto ? "hover:opacity-100 focus-visible:ring-0" : ""}`}
                            style={{ background: isAuto ? ACTION_BG_DISABLED : ACTION_BG, color: isAuto ? "rgba(255,255,255,0.45)" : "var(--tg-primary)" }}
                            aria-label="eliminar"
                            title={isAuto ? "Automática: no se puede eliminar" : "Eliminar"}
                            disabled={isAuto}
                            onClick={() => !isAuto && onDelete(r.id)}
                        >
                            <MaterialIcon name="delete" size={18} className={isAuto ? "text-white/40" : undefined} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ----------------- Página ----------------- */
export default function TransactionsPage() {
    const {
        items, page, setPage, loading, refresh,
        total_pages, page_size, total, filters, setFilters, options,
    } = useTransactions(1, 8);

    const { remove } = useDeleteTransaction();
    const { create, loading: creating } = useCreateTransaction();
    const { success, error } = useNotifications();

    const [openCreate, setOpenCreate] = useState(false);
    const [range, setRange] = useState<DateRange | undefined>(undefined);

    const bancos = options.banks;
    const tipos = options.types;

    const frameVars: CSSProperties = { ["--content-x" as any]: "8px" };

    const filtered = useMemo(() => {
        if (!range?.from || !range?.to) return items;
        const from = new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), 0, 0, 0, 0).getTime();
        const to = new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 23, 59, 59, 999).getTime();
        return items.filter((t) => {
            const d = new Date(t.created_at).getTime();
            return d >= from && d <= to;
        });
    }, [items, range]);

    const [start, end] = useMemo(() => {
        const win = 5;
        if (!total_pages || total_pages <= win) return [1, total_pages || 1] as const;
        const s = Math.max(1, Math.min(page - 2, (total_pages || 1) - (win - 1)));
        return [s, s + (win - 1)] as const;
    }, [page, total_pages]);

    const fromRow = useMemo(() => (total === 0 ? 0 : (page - 1) * (page_size || 8) + 1), [page, page_size, total]);
    const toRow = useMemo(() => Math.min(page * (page_size || 8), total || 0), [page, page_size, total]);

    async function handleDelete(id: number) {
        try {
            await remove(id);
            success("Transacción eliminada");
            refresh();
        } catch (e: any) {
            error(e?.response?.data?.detail ?? "Error eliminando transacción");
        }
    }

    function clearFilters() {
        setFilters({ q: "", bank: "", type: "", origin: "all" });
        setRange(undefined);
        setPage(1);
    }

    return (
        <div className="app-shell__frame overflow-hidden" style={frameVars}>
            {/* Toolbar DESKTOP */}
            <div className="hidden sm:flex mb-3 items-center justify-between gap-3">
                <label className="relative flex h-10 w-full max-w-[440px]">
                    <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
                        <MaterialIcon name="search" size={18} />
                    </span>
                    <input
                        type="search"
                        placeholder="Buscar por banco, tipo o descripción…"
                        className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 focus:outline-none"
                        value={filters.q ?? ""}
                        onChange={(e) => {
                            setFilters((f) => ({ ...f, q: e.target.value }));
                            setPage(1);
                        }}
                    />
                </label>

                <div className="flex items-center gap-2">
                    <select
                        value={filters.bank ?? ""}
                        onChange={(e) => { setFilters((f) => ({ ...f, bank: e.target.value })); setPage(1); }}
                        className="h-10 min-w-[180px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                    >
                        <option value="">Banco</option>
                        {bancos.map((b) => (<option key={b} value={b}>{b}</option>))}
                    </select>

                    <select
                        value={filters.type ?? ""}
                        onChange={(e) => { setFilters((f) => ({ ...f, type: e.target.value })); setPage(1); }}
                        className="h-10 min-w-[160px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                    >
                        <option value="">Tipo</option>
                        {tipos.map((t) => (<option key={t} value={t}>{t}</option>))}
                    </select>

                    <select
                        value={filters.origin ?? "all"}
                        onChange={(e) => { setFilters((f) => ({ ...f, origin: e.target.value as "all" | "auto" | "manual" })); setPage(1); }}
                        className="h-10 min-w-[140px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                    >
                        <option value="all">Origen</option>
                        <option value="manual">Manual</option>
                        <option value="auto">Automática</option>
                    </select>

                    {/* MISMO estilo que Ventas */}
                    <DateRangePicker className={DPR_MOBILE + " whitespace-nowrap"} value={range} onChange={(r) => { setRange(r); setPage(1); }} />

                    <button
                        type="button"
                        onClick={clearFilters}
                        className="h-10 rounded-md px-4 text-sm border border-tg bg-[var(--panel-bg)] whitespace-nowrap"
                    >
                        Limpiar filtros
                    </button>

                    <button
                        onClick={() => setOpenCreate(true)}
                        className="h-10 rounded-md px-5 text-sm font-extrabold shadow-sm inline-flex items-center gap-2 whitespace-nowrap"
                        style={{ background: "var(--tg-primary)", color: "#fff" }}
                        disabled={creating}
                    >
                        <MaterialIcon name="add_circle" size={18} />
                        Nueva transacción
                    </button>
                </div>
            </div>

            {/* Toolbar MÓVIL */}
            <div className="sm:hidden mb-3 space-y-2">
                <label className="relative flex h-10 w-full">
                    <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
                        <MaterialIcon name="search" size={18} />
                    </span>
                    <input
                        type="search"
                        placeholder="Buscar por banco o tipo…"
                        className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 focus:outline-none"
                        value={filters.q ?? ""}
                        onChange={(e) => { setFilters((f) => ({ ...f, q: e.target.value })); setPage(1); }}
                    />
                </label>

                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={filters.bank ?? ""}
                        onChange={(e) => { setFilters((f) => ({ ...f, bank: e.target.value })); setPage(1); }}
                        className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                    >
                        <option value="">Banco</option>
                        {bancos.map((b) => (<option key={b} value={b}>{b}</option>))}
                    </select>

                    <select
                        value={filters.type ?? ""}
                        onChange={(e) => { setFilters((f) => ({ ...f, type: e.target.value })); setPage(1); }}
                        className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                    >
                        <option value="">Tipo</option>
                        {tipos.map((t) => (<option key={t} value={t}>{t}</option>))}
                    </select>
                </div>

                <div className="grid grid-cols-[1fr_auto] gap-2">
                    <DateRangePicker className={DPR_MOBILE} value={range} onChange={(r) => { setRange(r); setPage(1); }} />
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="h-10 rounded-md px-4 text-[14px] font-semibold border border-tg bg-[var(--panel-bg)] whitespace-nowrap"
                    >
                        Limpiar filtros
                    </button>
                </div>

                <button
                    onClick={() => setOpenCreate(true)}
                    className="h-10 w-full rounded-md px-4 text-sm font-extrabold shadow-sm inline-flex items-center justify-center gap-2 whitespace-nowrap"
                    style={{ background: "var(--tg-primary)", color: "#fff" }}
                    disabled={creating}
                >
                    <MaterialIcon name="add_circle" size={18} />
                    Nueva transacción
                </button>
            </div>

            {/* Contenedor: cards + paginación */}
            <div className="rounded-xl border flex-1 min-h-0 flex flex-col overflow-hidden mb-1" style={{ background: FRAME_BG, borderColor: BORDER }}>
                <div className="px-3 pt-3">
                    <HeaderRow />
                </div>

                <div className="flex-1 min-h-0 overflow-auto px-3 pb-1 space-y-4 sm:space-y-3.5">
                    {loading
                        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                            <div key={`sk-${i}`} className="h-[60px] rounded-xl border bg-black/10 animate-pulse" />
                        ))
                        : filtered.length === 0
                            ? <div className="h-full grid place-items-center text-tg-muted text-sm">Sin registros</div>
                            : filtered.map((r) => <TxRow key={r.id} r={r} onDelete={handleDelete} />)}
                </div>

                {/* Paginación */}
                <div className="shrink-0 px-3 pt-1 pb-2 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Líneas por página</span>
                        <select value={page_size || 8} disabled className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted">
                            <option value={page_size || 8}>{page_size || 8}</option>
                        </select>
                    </div>

                    <nav className="flex items-center gap-1">
                        <button disabled={page <= 1} onClick={() => setPage(1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
                            <MaterialIcon name="first_page" size={16} />
                        </button>
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
                            <MaterialIcon name="chevron_left" size={16} />
                        </button>

                        {Array.from({ length: (end - start + 1) || 1 }, (_, i) => (start ?? 1) + i).map((p) => {
                            const active = p === page;
                            return (
                                <button
                                    key={p}
                                    onClick={() => setPage(p)}
                                    className={`h-9 min-w-9 px-3 rounded border ${active ? "bg-tg-primary text-white border-transparent" : "bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] text-white/90 border-white/10"} font-semibold`}
                                    aria-current={active ? "page" : undefined}
                                >
                                    {p}
                                </button>
                            );
                        })}

                        <button disabled={!!total_pages && page >= total_pages} onClick={() => setPage(page + 1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
                            <MaterialIcon name="chevron_right" size={16} />
                        </button>
                        <button disabled={!!total_pages && page >= total_pages} onClick={() => setPage(total_pages || page)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
                            <MaterialIcon name="last_page" size={16} />
                        </button>

                        <div className="h-9 min-w-[120px] grid place-items-center text-sm font-medium">
                            {fromRow} - {toRow} de {total ?? 0}
                        </div>
                    </nav>
                </div>
            </div>

            {/* Modal Crear */}
            <NewTransactionModal
                open={openCreate}
                onClose={() => setOpenCreate(false)}
                loading={creating}
                onSubmit={async (payload: TransactionCreate) => {
                    try {
                        await create(payload);
                        success("Transacción creada");
                        setOpenCreate(false);
                        setPage(1);
                        refresh();
                    } catch (e: any) {
                        error(e?.response?.data?.detail ?? "Error al crear transacción");
                    }
                }}
            />
        </div>
    );
}
