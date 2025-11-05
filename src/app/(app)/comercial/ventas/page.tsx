"use client";

import { useMemo, useState, useEffect, useCallback, CSSProperties } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { MaterialIcon } from "@/components/ui/material-icon";

import VentaView from "@/features/ventas/ViewDetalleVentas";
import PagoVentaModal from "@/features/ventas/PagoVentaModal";

import { useVentas } from "@/hooks/ventas/useVentas";
import { useDeleteVenta } from "@/hooks/ventas/useDeleteVenta";
import { useVentaEstados } from "@/hooks/estados/useEstados";

import { getSaleById, listSales } from "@/services/sales/sale.api";
import { listBanks } from "@/services/sales/bank.api";

import type { Sale } from "@/types/sale";
import type { DateRange } from "react-day-picker";
import DateRangePicker from "@/components/ui/DateRangePicker/DateRangePicker";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import FacturaPreviewModal from "@/features/factura/FacturaPreviewModal";
/* -------- Tokens visuales -------- */
const FRAME_BG = "color-mix(in srgb, var(--tg-bg) 90%, #fff 3%)";
const OUTER_BG = "color-mix(in srgb, var(--tg-bg) 55%, #000 45%)";
const INNER_BG = "color-mix(in srgb, var(--tg-bg) 95%, #fff 2%)";
const PILL_BG = "color-mix(in srgb, var(--tg-card-bg) 60%, #000 40%)";
const ACTION_BG = "color-mix(in srgb, var(--tg-primary) 28%, transparent)";
const BORDER = "var(--tg-border)";
const pill = "min-w-[90px] h-8 px-2.5 rounded-md grid place-items-center text-[13px] text-white/90 border";
const actionBtn =
    "h-8 w-8 grid place-items-center rounded-full text-[var(--tg-primary)] hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary";

/* Desktop DRP compacto si lo necesitas en otro momento */
// const DPR_COMPACT = "...";

/* MÓVIL: forzar que el botón del calendario quede pegado al input */
const DPR_MOBILE =
    // contenedor del input
    "[&_input]:h-10 [&_input]:w-full [&_input]:rounded-l-md [&_input]:border [&_input]:border-tg " +
    "[&_input]:bg-tg-card [&_input]:px-3 [&_input]:text-[14px] [&_input]:text-tg-card " +
    // botón de calendario
    "[&_button]:h-10 [&_button]:w-10 [&_button]:rounded-r-md [&_button]:p-0 " +
    "[&_button]:border [&_button]:border-l-0 [&_button]:border-tg [&_button]:bg-tg-card " +
    // quita márgenes raros del svg
    "[&_button_svg]:!m-0 " +
    // elimina gaps internos del wrapper si tu componente renderiza un wrapper
    "inline-flex w-full";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const clip = (s?: string | null, n = 24) => (s ?? "—").length > n ? (s as string).slice(0, n).trimEnd() + "…" : (s ?? "—");
const SKELETON_COUNT = 8;

/* Indicador */
function Dot({ color }: { color: string }) {
    return <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: color }} />;
}

/* Header desktop */
const GRID_COLS = "30px 220px 1fr 150px 170px 170px 208px";
const HEADER_COLS = "160px 220px 1fr 160px 170px 240px 40px";
function HeaderRow() {
    return (
        <div className="hidden sm:grid items-center gap-3 mb-2 font-extrabold mx-2" style={{ gridTemplateColumns: HEADER_COLS }}>
            <span />
            <span className="text-white">Cliente</span>
            <span className="text-white text-right">Total</span>
            <span className="text-white text-right">Saldo</span>
            <span className="text-white text-right">Fecha</span>
            <span className="text-white text-right">Acciones</span>
        </div>
    );
}

/* Card/Fila */
function SaleRow({
    v,
    onView,
    onPay,
    onPreview,
    onDelete,
}: {
    v: Sale;
    onView: (row: Sale) => void;
    onPay: (row: Sale) => void;
    onPreview: (id: number) => void;
    onDelete: (row: Sale) => void;
}) {
    const dotColor = (v.remaining_balance ?? 0) > 0 ? "#d97706" : "var(--tg-primary)";
    return (
        <div className="relative rounded-xl border shadow-sm" style={{ background: OUTER_BG, borderColor: BORDER }}>
            {/* Desktop */}
            <div className="hidden sm:block mx-1.5 my-2 rounded-md px-3 py-2.5" style={{ background: INNER_BG }}>
                <div className="grid items-center gap-3" style={{ gridTemplateColumns: GRID_COLS }}>
                    <div className="grid place-items-center">
                        <Dot color={dotColor} />
                    </div>

                    <div className="flex items-center gap-2 min-w-0">
                        <div className={`${pill} font-extrabold tracking-wide`} style={{ background: PILL_BG, borderColor: BORDER }}>
                            {v.id}
                        </div>
                        <div className="text-[13px] text-white/90 truncate">{clip(v.customer, 42)}</div>
                    </div>

                    <div
                        className={`${pill} max-w-[260px] min-w-[200px] whitespace-nowrap overflow-hidden text-ellipsis`}
                        style={{ background: PILL_BG, borderColor: BORDER }}
                        title={v.bank || "—"}
                    >
                        {clip(v.bank, 24)}
                    </div>

                    <div className={`${pill} font-semibold text-right`} style={{ background: PILL_BG, borderColor: BORDER }}>
                        {money.format(v.total)}
                    </div>

                    <div className={`${pill} font-semibold text-right`} style={{ background: PILL_BG, borderColor: BORDER }}>
                        {money.format(v.remaining_balance)}
                    </div>

                    <div className={`${pill} text-center`} style={{ background: PILL_BG, borderColor: BORDER }}>
                        {format(new Date(v.created_at), "dd MMM yyyy", { locale: es })}
                    </div>

                    <div className="flex items-center justify-end gap-2">
                        <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="ver" onClick={() => onView(v)}>
                            <MaterialIcon name="visibility" size={18} />
                        </button>
                        <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="factura" onClick={() => onPreview(v.id)}>
                            <MaterialIcon name="download" size={18} />
                        </button>
                        <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="abonar" onClick={() => onPay(v)}>
                            <MaterialIcon name="payments" size={18} />
                        </button>
                        <button className="h-8 w-8 grid place-items-center rounded-full" style={{ background: "#7a1010" }} aria-label="eliminar" onClick={() => onDelete(v)}>
                            <MaterialIcon name="delete" size={16} className="text-[#ff4d4f]" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Móvil */}
            <div className="sm:hidden mx-2.5 my-3 rounded-md px-3 py-2 min-h-[84px]" style={{ background: INNER_BG }}>
                <div className="flex items-start gap-2">
                    <Dot color={dotColor} />
                    <div className="min-w-0 flex-1">
                        <div className="flex items-baseline gap-2 min-w-0">
                            <span className={`${pill} !h-6 !min-w-[64px] !text-[12px]`} style={{ background: PILL_BG, borderColor: BORDER }}>
                                {v.id}
                            </span>
                            <span className="text-sm font-extrabold tracking-wide truncate">{v.customer}</span>
                        </div>
                        <div className="mt-1 grid grid-cols-3 gap-2">
                            <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                                <div className="uppercase opacity-70">Método</div>
                                <div className="font-medium whitespace-nowrap overflow-hidden text-ellipsis">{clip(v.bank, 16)}</div>
                            </div>
                            <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                                <div className="uppercase opacity-70">Total</div>
                                <div className="font-semibold">{money.format(v.total)}</div>
                            </div>
                            <div className="rounded-md border px-2 py-1 text-center text-[12px]" style={{ background: PILL_BG, borderColor: BORDER }}>
                                <div className="uppercase opacity-70">Saldo</div>
                                <div className="font-semibold">{money.format(v.remaining_balance)}</div>
                            </div>
                        </div>
                        <div className="mt-1 text-[12px] opacity-80">
                            {format(new Date(v.created_at), "dd MMM yyyy", { locale: es })}
                        </div>
                    </div>

                    <div className="ml-2 flex items-center gap-2 shrink-0">
                        <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="ver" onClick={() => onView(v)}>
                            <MaterialIcon name="visibility" size={18} />
                        </button>
                        <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="factura" onClick={() => onPreview(v.id)}>
                            <MaterialIcon name="download" size={18} />
                        </button>
                        <button className={actionBtn} style={{ background: ACTION_BG }} aria-label="abonar" onClick={() => onPay(v)}>
                            <MaterialIcon name="payments" size={18} />
                        </button>
                        <button className="h-8 w-8 grid place-items-center rounded-full" style={{ background: "#7a1010" }} aria-label="eliminar" onClick={() => onDelete(v)}>
                            <MaterialIcon name="delete" size={16} className="text-[#ff4d4f]" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

/* ----------------- Página ----------------- */
export default function VentasPage() {
    const router = useRouter();
    const { success, error } = useNotifications();

    const { items, page, setPage, pageSize, loading, reload, totalPages } = useVentas();

    const [q, setQ] = useState("");
    const { options: estadoOptions } = useVentaEstados();
    const [estadoSel, setEstadoSel] = useState<string>("");
    const [bancoSel, setBancoSel] = useState<string>("");
    const [range, setRange] = useState<DateRange | undefined>();

    const [bancos, setBancos] = useState<string[]>([]);
    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await listBanks(Date.now());
                if (!alive) return;
                const unique = Array.from(new Set((data ?? []).map((b: { name: string }) => b.name))).sort();
                setBancos(unique);
            } catch {
                if (alive) setBancos([]);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const inRange = useCallback(
        (d: Date) => {
            if (!range?.from && !range?.to) return true;
            const from = range?.from ? new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), 0, 0, 0, 0) : undefined;
            const to = range?.to ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 23, 59, 59, 999) : undefined;
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
        },
        [range]
    );

    const [all, setAll] = useState<Sale[] | null>(null);
    const [allLoading, setAllLoading] = useState(false);

    useEffect(() => {
        let alive = true;
        async function hydrateAll() {
            if (loading) return;
            if (!totalPages || totalPages < 1) {
                if (alive) setAll(items);
                return;
            }
            setAllLoading(true);
            try {
                const pages = await Promise.all(
                    Array.from({ length: totalPages }, (_, i) => listSales(i + 1, undefined, Date.now()))
                );
                const merged = pages.flatMap((p) => p.items);
                const dedup = Array.from(new Map(merged.map((r: Sale) => [r.id, r])).values());
                if (alive) setAll(dedup);
            } catch {
                if (alive) setAll(items);
            } finally {
                if (alive) setAllLoading(false);
            }
        }
        hydrateAll();
        return () => {
            alive = false;
        };
    }, [loading, totalPages, items]);

    const dataset = all ?? items;

    const filtered = useMemo(() => {
        const v = q.trim().toLowerCase();
        return dataset.filter((r: Sale) => {
            if (
                v &&
                !(String(r.id).includes(v) || r.customer.toLowerCase().includes(v) || r.bank.toLowerCase().includes(v) || r.status.toLowerCase().includes(v))
            )
                return false;
            if (bancoSel && r.bank !== bancoSel) return false;
            if (estadoSel && r.status !== estadoSel) return false;
            if (!inRange(new Date(r.created_at))) return false;
            return true;
        });
    }, [dataset, q, bancoSel, estadoSel, inRange]);

    const clientTotal = filtered.length;
    const clientTotalPages = Math.max(1, Math.ceil(clientTotal / pageSize));
    useEffect(() => {
        if (page > clientTotalPages) setPage(clientTotalPages);
    }, [clientTotalPages, page, setPage]);

    const paged = useMemo(() => {
        const startIdx = (page - 1) * pageSize;
        return filtered.slice(startIdx, startIdx + pageSize);
    }, [filtered, page, pageSize]);

    const fromRow = useMemo(() => (clientTotal === 0 ? 0 : (page - 1) * pageSize + 1), [page, pageSize, clientTotal]);
    const toRow = useMemo(() => Math.min(page * pageSize, clientTotal), [page, pageSize, clientTotal]);

    const [start, end] = useMemo(() => {
        const win = 5;
        if (clientTotalPages <= win) return [1, clientTotalPages] as const;
        const s = Math.max(1, Math.min(page - 2, clientTotalPages - (win - 1)));
        return [s, s + (win - 1)] as const;
    }, [page, clientTotalPages]);

    const [openView, setOpenView] = useState(false);
    const [ventaSel, setVentaSel] = useState<Sale | null>(null);

    const [openPay, setOpenPay] = useState(false);
    const [ventaPay, setVentaPay] = useState<Sale | null>(null);

    const { deleteVenta, loading: deleting } = useDeleteVenta();
    const [openDelete, setOpenDelete] = useState(false);
    const [ventaDel, setVentaDel] = useState<Sale | null>(null);

    const [openPreview, setOpenPreview] = useState(false);
    const [previewVentaId, setPreviewVentaId] = useState<number | null>(null);

    async function handlePaid(ventaId: number) {
        const currentPage = page;
        const fresh = await getSaleById(ventaId);
        setVentaPay(fresh);
        if (openView && ventaSel?.id === ventaId) setVentaSel(fresh);
        await reload();
        setTimeout(() => setPage(Math.min(currentPage, Math.max(1, clientTotalPages))), 0);
        success("Venta actualizada");
    }

    function handleClearFilters() {
        setQ("");
        setEstadoSel("");
        setBancoSel("");
        setRange(undefined);
        setPage(1);
    }

    const frameVars: CSSProperties = { ["--content-x" as any]: "8px" };

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
                        placeholder="Buscar venta por cliente, método o #..."
                        className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 focus:outline-none"
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setPage(1);
                        }}
                    />
                </label>

                <div className="flex items-center gap-2">
                    <select
                        value={estadoSel}
                        onChange={(e) => {
                            setEstadoSel(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 min-w-[160px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                        aria-label="Filtro por estado"
                    >
                        <option value="">Estado</option>
                        {estadoOptions.map((nombre) => (
                            <option key={nombre} value={nombre}>
                                {nombre}
                            </option>
                        ))}
                    </select>

                    <select
                        value={bancoSel}
                        onChange={(e) => {
                            setBancoSel(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 min-w-[180px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                        aria-label="Filtro por banco"
                    >
                        <option value="">{bancoSel ? "Banco" : "Método pago"}</option>
                        {bancos.map((nombre) => (
                            <option key={nombre} value={nombre}>
                                {nombre}
                            </option>
                        ))}
                    </select>

                    <DateRangePicker value={range} onChange={(r) => { setRange(r); setPage(1); }} />

                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="h-10 rounded-md px-3 text-sm border border-tg bg-[var(--panel-bg)]"
                    >
                        Limpiar filtros
                    </button>

                    <button
                        onClick={() => router.push("/comercial/ventas/crear")}
                        className="h-10 rounded-md px-4 text-sm font-extrabold shadow-sm inline-flex items-center gap-2"
                        style={{ background: "var(--tg-primary)", color: "#fff" }}
                    >
                        <MaterialIcon name="add_circle" size={18} />
                        Nueva venta
                    </button>
                </div>
            </div>

            {/* Toolbar MÓVIL (AJUSTADA) */}
            <div className="sm:hidden mb-3 space-y-2">
                <label className="relative flex h-10 w-full">
                    <span className="absolute inset-y-0 left-3 flex items-center text-tg-muted pointer-events-none">
                        <MaterialIcon name="search" size={18} />
                    </span>
                    <input
                        type="search"
                        placeholder="Buscar venta por cliente..."
                        className="h-10 w-full rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 focus:outline-none"
                        value={q}
                        onChange={(e) => {
                            setQ(e.target.value);
                            setPage(1);
                        }}
                    />
                </label>

                <div className="grid grid-cols-2 gap-2">
                    <select
                        value={estadoSel}
                        onChange={(e) => {
                            setEstadoSel(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                    >
                        <option value="">Estado</option>
                        {estadoOptions.map((nombre) => (
                            <option key={nombre} value={nombre}>
                                {nombre}
                            </option>
                        ))}
                    </select>

                    <select
                        value={bancoSel}
                        onChange={(e) => {
                            setBancoSel(e.target.value);
                            setPage(1);
                        }}
                        className="h-10 w-full rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-muted"
                    >
                        <option value="">{bancoSel ? "Banco" : "Método pago"}</option>
                        {bancos.map((nombre) => (
                            <option key={nombre} value={nombre}>
                                {nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* DateRange + Limpiar */}
                <div className="grid grid-cols-[1fr_auto] gap-2">
                    {/* Icono pegado al input gracias a DPR_MOBILE */}
                    <DateRangePicker
                        className={DPR_MOBILE}
                        value={range}
                        onChange={(r) => {
                            setRange(r);
                            setPage(1);
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleClearFilters}
                        className="h-10 rounded-md px-4 text-[14px] font-semibold border border-tg bg-[var(--panel-bg)]"
                    >
                        Limpiar
                    </button>
                </div>

                <button
                    onClick={() => router.push("/comercial/ventas/crear")}
                    className="h-10 w-full rounded-md px-4 text-sm font-extrabold shadow-sm inline-flex items-center justify-center gap-2"
                    style={{ background: "var(--tg-primary)", color: "#fff" }}
                >
                    <MaterialIcon name="add_circle" size={18} />
                    Nueva venta
                </button>
            </div>

            {/* Marco + lista */}
            <div className="rounded-xl border flex-1 min-h-0 flex flex-col overflow-hidden mb-1" style={{ background: FRAME_BG, borderColor: BORDER }}>
                <div className="px-3 pt-3">
                    <HeaderRow />
                </div>

                <div className="flex-1 min-h-0 overflow-auto px-3 pb-1 space-y-4 sm:space-y-3.5">
                    {(loading || allLoading)
                        ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                            <div key={`sk-${i}`} className="h-[60px] rounded-xl border bg-black/10 animate-pulse" />
                        ))
                        : paged.length === 0
                            ? <div className="h-full grid place-items-center text-tg-muted text-sm">Sin registros</div>
                            : paged.map((r) => (
                                <SaleRow
                                    key={r.id}
                                    v={r}
                                    onView={(row) => { setVentaSel(row); setOpenView(true); }}
                                    onPay={(row) => { setVentaPay(row); setOpenPay(true); }}
                                    onPreview={(id) => {
                                        setPreviewVentaId(id);
                                        setOpenPreview(true);
                                    }}
                                    onDelete={(row) => { setVentaDel(row); setOpenDelete(true); }}
                                />
                            ))}
                </div>

                {/* Paginación */}
                <div className="shrink-0 px-3 pt-1 pb-2 flex flex-wrap gap-3 items-center justify-between">
                    <div className="flex items-center gap-2">
                        <span className="text-sm">Líneas por página</span>
                        <select value={pageSize} disabled className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted">
                            <option value={pageSize}>{pageSize}</option>
                        </select>
                    </div>

                    <nav className="flex items-center gap-1">
                        <button disabled={page <= 1} onClick={() => setPage(1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
                            <MaterialIcon name="first_page" size={16} />
                        </button>
                        <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
                            <MaterialIcon name="chevron_left" size={16} />
                        </button>

                        {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => {
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

                        <button disabled={page >= clientTotalPages} onClick={() => setPage(page + 1)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
                            <MaterialIcon name="chevron_right" size={16} />
                        </button>
                        <button disabled={page >= clientTotalPages} onClick={() => setPage(clientTotalPages)} className="h-9 w-9 grid place-items-center rounded bg-[color-mix(in_srgb,var(--tg-bg)_70%,#000)] border border-white/10 disabled:opacity-40">
                            <MaterialIcon name="last_page" size={16} />
                        </button>

                        <div className="h-9 min-w-[120px] grid place-items-center text-sm font-medium">
                            {fromRow} - {toRow} de {clientTotal}
                        </div>
                    </nav>
                </div>
            </div>

            {/* Ver */}
            {openView && <VentaView open={openView} onClose={() => setOpenView(false)} venta={ventaSel} />}

            {/* Pagar */}
            {openPay && (
                <PagoVentaModal
                    open={openPay}
                    onClose={() => setOpenPay(false)}
                    venta={ventaPay}
                    onPaid={async () => {
                        if (ventaPay?.id) await handlePaid(ventaPay.id);
                    }}
                />
            )}

            {openPreview && (
                <FacturaPreviewModal
                    open={openPreview}
                    onClose={() => setOpenPreview(false)}
                    ventaId={previewVentaId}
                // Si necesitas rutas distintas, descomenta y ajusta:
                // facturaHref={`${FACTURA_PAGE_BASE}/${previewVentaId}?embed=1`}
                // pdfHref={`${FACTURA_PDF_BASE}/${previewVentaId}/pdf?download=1`}
                />
            )}

            {/* Eliminar */}
            {openDelete && (
                <div
                    role="dialog"
                    aria-modal="true"
                    className="fixed inset-0 z-50 grid place-items-center bg-black/50"
                    onKeyDown={(e) => {
                        if (e.key === "Escape") setOpenDelete(false);
                    }}
                    onClick={(e) => {
                        if (e.target === e.currentTarget && !deleting) setOpenDelete(false);
                    }}
                >
                    <div className="w-[420px] rounded-lg border bg-[var(--panel-bg)] shadow-xl" style={{ borderColor: BORDER }}>
                        <div className="px-4 py-3 border-b flex items-center gap-2" style={{ borderColor: BORDER }}>
                            <MaterialIcon name="warning" size={18} />
                            <h3 className="text-base font-semibold">Confirmar eliminación</h3>
                        </div>
                        <div className="px-4 py-4 text-sm">
                            ¿Seguro que deseas eliminar la venta #{ventaDel?.id}? Esta acción no se puede deshacer.
                        </div>
                        <div className="px-4 py-3 border-t flex justify-end gap-2" style={{ borderColor: BORDER }}>
                            <button onClick={() => setOpenDelete(false)} className="h-9 rounded-md px-3 text-sm hover:bg-black/10" disabled={deleting}>
                                Cancelar
                            </button>
                            <button
                                onClick={async () => {
                                    if (!ventaDel) return;
                                    try {
                                        await deleteVenta(ventaDel.id);
                                        setOpenDelete(false);
                                        success("Venta eliminada");
                                        await reload?.();
                                    } catch (e: any) {
                                        error(e?.response?.data?.detail ?? "Error eliminando venta");
                                    }
                                }}
                                className="h-9 rounded-md px-3 text-sm font-medium text-white disabled:opacity-60"
                                style={{ background: "#7a1010" }}
                                disabled={deleting}
                            >
                                {deleting ? "Eliminando..." : "Eliminar"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
