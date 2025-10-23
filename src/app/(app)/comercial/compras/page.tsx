"use client";

import { useMemo, useState, CSSProperties, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useRouter } from "next/navigation";

import { usePurchases } from "@/hooks/compras/useCompras";
import { useDeleteCompra } from "@/hooks/compras/useDeleteCompra";
import type { Purchase } from "@/types/purchase";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { MaterialIcon } from "@/components/ui/material-icon";
import { listBanks } from "@/services/sales/bank.api";
import type { Bank } from "@/types/bank";
import { useCompraEstados } from "@/hooks/estados/useEstados";
import type { DateRange } from "react-day-picker";
import DateRangePicker from "@/components/ui/DateRangePicker/DateRangePicker";
import CompraView from "@/features/compras/ViewDetalleCompras";
import PagoCompraModal from "@/features/compras/PagoCompraModal";
import PurchaseReceiptModal from "@/features/compras/PurchaseReceiptModal";
import { getPurchaseById, listPurchases } from "@/services/sales/purchase.api";

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

type FrameVars = CSSProperties & { ["--content-x"]?: string };

export default function ComprasPage() {
    const router = useRouter();
    const { success, error } = useNotifications();

    const { items, page, setPage, pageSize, loading, reload, totalPages } = usePurchases();

    const [q, setQ] = useState("");
    const { options: estadoOptions } = useCompraEstados();
    const [estadoSel, setEstadoSel] = useState<string>("");

    const [bancos, setBancos] = useState<Bank[]>([]);
    const [bancoSel, setBancoSel] = useState<string>("");
    const [range, setRange] = useState<DateRange | undefined>();

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await listBanks(Date.now()); // Bank[]
                if (alive) setBancos(data);
            } catch {
                if (alive) setBancos([]);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const bancoOptions = useMemo(() => Array.from(new Set(bancos.map((b) => b.name))).sort(), [bancos]);

    const inRange = useCallback(
        (d: Date) => {
            if (!range?.from && !range?.to) return true;
            const from = range?.from
                ? new Date(range.from.getFullYear(), range.from.getMonth(), range.from.getDate(), 0, 0, 0, 0)
                : undefined;
            const to = range?.to
                ? new Date(range.to.getFullYear(), range.to.getMonth(), range.to.getDate(), 23, 59, 59, 999)
                : undefined;
            if (from && d < from) return false;
            if (to && d > to) return false;
            return true;
        },
        [range]
    );

    const [all, setAll] = useState<Purchase[] | null>(null);
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
                    Array.from({ length: totalPages }, (_, i) => listPurchases(i + 1, undefined, Date.now()))
                );
                const merged = pages.flatMap((p) => p.items);
                const map = new Map<number, Purchase>();
                for (const c of merged) map.set(c.id, c);
                if (alive) setAll(Array.from(map.values()));
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
        return dataset.filter((r: Purchase) => {
            if (
                v &&
                !(
                    String(r.id).includes(v) ||
                    r.supplier.toLowerCase().includes(v) ||
                    r.bank.toLowerCase().includes(v) ||
                    r.status.toLowerCase().includes(v)
                )
            )
                return false;
            if (bancoSel && r.bank !== bancoSel) return false;
            if (estadoSel && r.status !== estadoSel) return false;
            if (!inRange(new Date(r.purchase_date))) return false;
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

    const frameVars: FrameVars = { ["--content-x"]: "16px" };

    const [openView, setOpenView] = useState(false);
    const [compraSel, setCompraSel] = useState<Purchase | null>(null);
    const onView = (c: Purchase) => {
        setCompraSel(c);
        setOpenView(true);
    };

    const [openPay, setOpenPay] = useState(false);
    const [compraPay, setCompraPay] = useState<Purchase | null>(null);
    const onPay = (c: Purchase) => {
        setCompraPay(c);
        setOpenPay(true);
    };

    // nuevo: modal de comprobantes
    const [openReceipts, setOpenReceipts] = useState(false);
    const [purchaseForUpload, setPurchaseForUpload] = useState<Purchase | null>(null);
    const onUploadReceipts = (c: Purchase) => {
        setPurchaseForUpload(c);
        setOpenReceipts(true);
    };

    async function handlePaid(compraId: number) {
        const currentPage = page;
        const fresh = await getPurchaseById(compraId);
        setCompraPay(fresh);
        if (openView && compraSel?.id === compraId) setCompraSel(fresh);
        await reload();
        // no usar updater si no necesitas el valor previo
        setTimeout(() => {
            setPage(Math.min(currentPage, Math.max(1, clientTotalPages)));
        }, 0);
    }

    const { deleteCompra, loading: deleting } = useDeleteCompra();
    const [openDelete, setOpenDelete] = useState(false);
    const [compraDel, setCompraDel] = useState<Purchase | null>(null);

    async function confirmDelete() {
        if (!compraDel) return;
        const lastInPage = paged.length === 1 && page > 1;
        try {
            await deleteCompra(compraDel.id);
            success("Compra eliminada");
            setOpenDelete(false);
            setCompraDel(null);
            setAll(null);
            if (lastInPage) setPage(page - 1);
            else reload();
        } catch (e: unknown) {
            const msg =
                (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Error eliminando compra";
            error(msg);
        }
    }

    function handleClearFilters() {
        setQ("");
        setEstadoSel("");
        setBancoSel("");
        setRange(undefined);
        setPage(1);
    }

    return (
        <div className="app-shell__frame" style={frameVars}>
            <div className="bg-[var(--page-bg)] rounded-xl h-full flex flex-col px-[var(--content-x)] pt-3 pb-5">
                {/* Filtros */}
                <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h2 className="text-2xl font-semibold text-tg-fg">Compras</h2>
                    <div className="flex flex-wrap items-center gap-2">
                        <label className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-tg-muted">
                                <SearchIcon fontSize="small" />
                            </span>
                            <input
                                type="search"
                                placeholder="Buscar…"
                                className="h-10 w-[260px] rounded-md border border-tg bg-tg-card text-tg-card pl-9 pr-3 outline-none"
                                value={q}
                                onChange={(e) => {
                                    setQ(e.target.value);
                                    setPage(1);
                                }}
                            />
                        </label>

                        <select
                            value={estadoSel}
                            onChange={(e) => {
                                setEstadoSel(e.target.value);
                                setPage(1);
                            }}
                            className="h-10 min-w=[160px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            aria-label="Filtro por estado"
                            title="Filtrar por estado"
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
                            className="h-10 min-w-[180px] rounded-md border border-tg bg-tg-card px-3 text-sm text-tg-card"
                            aria-label="Filtro por banco"
                            title="Filtrar por banco"
                        >
                            <option value="">{bancoSel ? "Banco" : "Método pago"}</option>
                            {bancoOptions.map((nombre) => (
                                <option key={nombre} value={nombre}>
                                    {nombre}
                                </option>
                            ))}
                        </select>

                        <DateRangePicker
                            value={range}
                            onChange={(r) => {
                                setRange(r);
                                setPage(1);
                            }}
                        />

                        <span
                            onClick={handleClearFilters}
                            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClearFilters()}
                            className="cursor-pointer text-sm text-tg-primary hover:underline ml-2 mr-2 select-none"
                            role="button"
                            tabIndex={0}
                            aria-label="Limpiar filtros"
                            title="Limpiar filtros"
                        >
                            Limpiar filtros
                        </span>

                        <button
                            onClick={() => router.push("/comercial/compras/crear")}
                            className="h-10 rounded-md bg-tg-primary px-4 text-sm font-medium text-tg-on-primary shadow-sm"
                        >
                            Nueva compra
                        </button>
                    </div>
                </div>

                {/* Tabla */}
                <div className="rounded-xl overflow-visible border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow-md">
                    <div className="flex-1 min-h-0 overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                                    <th className="px-4 py-3 text-left">Proveedor</th>
                                    <th className="px-4 py-3 text-left">Banco</th>
                                    <th className="px-4 py-3 text-left">Estado</th>
                                    <th className="px-4 py-3 text-right">Total</th>
                                    <th className="px-4 py-3 text-right">Saldo restante</th>
                                    <th className="px-4 py-3 text-left">Fecha</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading || allLoading
                                    ? Array.from({ length: 10 }).map((_, i) => (
                                        <tr key={`sk-${i}`} className="border-t border-tg">
                                            {Array.from({ length: 8 }).map((__, j) => (
                                                <td key={j} className="px-4 py-3">
                                                    <div className="h-4 w-full animate-pulse rounded bg-black/10 dark:bg-white/10" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                    : paged.length === 0
                                        ? (
                                            <tr>
                                                <td colSpan={8} className="px-4 py-10 text-center text-tg-muted">
                                                    Sin registros
                                                </td>
                                            </tr>
                                        )
                                        : paged.map((r) => (
                                            <tr key={r.id} className="border-t border-tg hover:bg-black/5 dark:hover:bg-white/5">
                                                <td className="px-4 py-3">{r.supplier}</td>
                                                <td className="px-4 py-3">{r.bank}</td>
                                                <td className="px-4 py-3">{r.status}</td>
                                                <td className="px-4 py-3 text-right">{money.format(r.total)}</td>
                                                <td className="px-4 py-3 text-right">{money.format(r.balance)}</td>
                                                <td className="px-4 py-3">{format(new Date(r.purchase_date), "dd MMM yyyy", { locale: es })}</td>
                                                <td className="px-2 py-2">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Tooltip title="Ver detalles" arrow>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="ver detalles"
                                                                onClick={() => onView(r)}
                                                                sx={{
                                                                    color: "var(--tg-primary)",
                                                                    borderRadius: "9999px",
                                                                    "&:hover": { backgroundColor: "color-mix(in srgb, var(--tg-primary) 22%, transparent)" }
                                                                }}
                                                            >
                                                                <VisibilityOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Abonar / ver pagos" arrow>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="abonar pago"
                                                                onClick={() => onPay(r)}
                                                                sx={{
                                                                    color: "var(--tg-primary)",
                                                                    borderRadius: "9999px",
                                                                    "&:hover": { backgroundColor: "color-mix(in srgb, var(--tg-primary) 22%, transparent)" }
                                                                }}
                                                            >
                                                                <AttachMoneyOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        {/* nuevo botón: comprobantes / carga de archivos */}
                                                        <Tooltip title="Comprobantes / adjuntar archivos" arrow>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="adjuntar comprobantes"
                                                                onClick={() => onUploadReceipts(r)}
                                                                sx={{
                                                                    color: "var(--tg-primary)",
                                                                    borderRadius: "9999px",
                                                                    "&:hover": { backgroundColor: "color-mix(in srgb, var(--tg-primary) 22%, transparent)" }
                                                                }}
                                                            >
                                                                <FileUploadOutlinedIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>

                                                        <Tooltip title="Eliminar" arrow>
                                                            <IconButton
                                                                size="small"
                                                                aria-label="eliminar"
                                                                onClick={() => {
                                                                    setCompraDel(r);
                                                                    setOpenDelete(true);
                                                                }}
                                                                disabled={deleting}
                                                                sx={{
                                                                    color: "var(--tg-primary)",
                                                                    borderRadius: "9999px",
                                                                    "&:hover": { backgroundColor: "color-mix(in srgb, var(--tg-primary) 22%, transparent)" }
                                                                }}
                                                            >
                                                                <DeleteOutlineIcon fontSize="small" />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-tg px-4 py-3">
                        <div className="flex items-center gap-2">
                            <span className="text-sm">Líneas por página</span>
                            <select value={pageSize} disabled className="h-9 rounded-md border border-tg bg-[var(--panel-bg)] px-2 text-sm text-tg-muted">
                                <option value={pageSize}>{pageSize}</option>
                            </select>
                        </div>

                        <nav className="flex items-center gap-1">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(1)}
                                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                                aria-label="Primera página"
                                title="Primera página"
                            >
                                <MaterialIcon name="first_page" size={18} />
                            </button>
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage(page - 1)}
                                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                                aria-label="Anterior"
                                title="Anterior"
                            >
                                <MaterialIcon name="chevron_left" size={18} />
                            </button>

                            {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((p) => {
                                const active = p === page;
                                return (
                                    <button
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`h-8 min-w-8 rounded px-2 text-sm ${active ? "bg-tg-primary text-tg-on-primary" : "hover:bg-black/10 dark:hover:bg:white/10"
                                            } focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary`}
                                        aria-current={active ? "page" : undefined}
                                    >
                                        {p}
                                    </button>
                                );
                            })}

                            {end < clientTotalPages && <span className="px-1">…</span>}

                            <button
                                disabled={page >= clientTotalPages}
                                onClick={() => setPage(page + 1)}
                                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                                aria-label="Próximo"
                                title="Próximo"
                            >
                                <MaterialIcon name="chevron_right" size={18} />
                            </button>
                            <button
                                disabled={page >= clientTotalPages}
                                onClick={() => setPage(clientTotalPages)}
                                className="h-8 w-8 rounded text-sm disabled:opacity-40 hover:bg-black/10 dark:hover:bg-white/10 grid place-items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-tg-primary"
                                aria-label="Última página"
                                title="Última página"
                            >
                                <MaterialIcon name="last_page" size={18} />
                            </button>
                        </nav>

                        <div className="text-sm text-tg-muted">
                            Exhibiendo {Math.min(fromRow, clientTotal)}-{toRow} de {clientTotal} registros
                        </div>
                    </div>
                </div>
            </div>

            {openView && <CompraView open={openView} onClose={() => setOpenView(false)} compra={compraSel} />}

            {openPay && <PagoCompraModal open={openPay} onClose={() => setOpenPay(false)} compra={compraPay} onPaid={handlePaid} />}

            {/* nuevo modal: comprobantes */}
            {openReceipts && purchaseForUpload && (
                <PurchaseReceiptModal open={openReceipts} onClose={() => setOpenReceipts(false)} purchaseId={purchaseForUpload.id} max={6} ratio="3/4" />
            )}

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
                    <div className="w-[420px] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl">
                        <div className="px-4 py-3 border-b border-tg flex items-center gap-2">
                            <MaterialIcon name="warning" size={18} />
                            <h3 className="text-base font-semibold">Confirmar eliminación</h3>
                        </div>
                        <div className="px-4 py-4 text-sm">
                            ¿Seguro que deseas eliminar la compra #{compraDel?.id}? Esta acción no se puede deshacer.
                        </div>
                        <div className="px-4 py-3 border-t border-tg flex justify-end gap-2">
                            <button
                                onClick={() => setOpenDelete(false)}
                                className="h-9 rounded-md px-3 text-sm hover:bg-black/10 dark:hover:bg:white/10"
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
