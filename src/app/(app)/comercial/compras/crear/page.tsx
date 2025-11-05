// app/(compras)/compras/crear/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Autocomplete from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Pagination from "@mui/material/Pagination";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

import ProductoAgregate from "@/features/productos/ProductoForm";
import DateInput from "@/components/ui/DateRangePicker/DateInput";

import { useProductosAll } from "@/hooks/productos/useProductosAll";
import { useSupplierOptions, type SupplierOption } from "@/hooks/proveedores/useProveedorOptions";
import { useCompraEstados } from "@/hooks/estados/useEstados";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { useRouter } from "next/navigation";
import { useCreateCompra } from "@/hooks/compras/useCreateCompra";
import { useBancos } from "@/hooks/bancos/useBancos";

import type { ProductDTO } from "@/types/product";
import type { PurchaseCreate, PurchaseItemInput } from "@/types/purchase";

type ItemCompra = {
    idTmp: string;
    productoId: number;
    reference: string;
    description: string;
    precioUnit: number;
    cantidad: number;
};
type Option = { value: number; label: string };
type ProductoAgregateDefaults = {
    referencia: string;
    descripcion: string;
    precio_unitario: number;
    cantidad: number;
    stock: number;
    precio_compra: number;
};

const PAGE_SIZE = 5;
const CARD_H = 76;
const CARD_GAP = 10;

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const BLOQUEADA_RE = /compra\s*cancelada/i;
const COMPRA_CONTADO_RE = /compra\s*contado/i;

function toLocalISOSec(d = new Date()): string {
    const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
    return t.toISOString().slice(0, 19);
}

export default function CompraCrearPage() {
    const router = useRouter();
    const { error } = useNotifications();

    const { items: catalogo, loading: loadingProd } = useProductosAll();
    const { options: proveedorOptions } = useSupplierOptions();
    const { options: estadoOptions, byName: estadoByName } = useCompraEstados();

    const { items: bancos, loading: loadingBancos } = useBancos();
    const bancoOptions: Option[] = useMemo(() => bancos.map(b => ({ value: b.id, label: b.name })), [bancos]);

    const [proveedorSel, setProveedorSel] = useState<SupplierOption | null>(null);
    const [bancoSel, setBancoSel] = useState<Option | null>(null);
    const [estadoSel, setEstadoSel] = useState<string | null>(null);
    const [purchaseAt, setPurchaseAt] = useState<string | undefined>(undefined);

    useEffect(() => {
        if (!bancoSel && bancos.length) {
            const eff = bancos.find(b => b.name?.toLowerCase().includes("efectivo"));
            if (eff) setBancoSel({ value: eff.id, label: eff.name });
        }
    }, [bancos, bancoSel]);

    useEffect(() => {
        if (!estadoSel && estadoOptions.length) {
            const target = estadoOptions.find(n => COMPRA_CONTADO_RE.test(String(n)) && !BLOQUEADA_RE.test(String(n)));
            if (target) setEstadoSel(target);
        }
    }, [estadoOptions, estadoSel]);

    useEffect(() => {
        if (!purchaseAt) setPurchaseAt(toLocalISOSec());
    }, [purchaseAt]);

    const [queryProd, setQueryProd] = useState("");
    const [selProd, setSelProd] = useState<ProductDTO | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [modalDefaults, setModalDefaults] = useState<ProductoAgregateDefaults | null>(null);
    const [editIdTmp, setEditIdTmp] = useState<string | null>(null);

    const [items, setItems] = useState<ItemCompra[]>([]);
    const total = useMemo(() => items.reduce((a, it) => a + it.precioUnit * it.cantidad, 0), [items]);

    // paginación ítems
    const [page, setPage] = useState(1);
    const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount, items.length]);
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = Math.min(page * PAGE_SIZE, items.length);
    const pagedItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex]);

    const hasDirty =
        items.length > 0 || Boolean(proveedorSel) || Boolean(bancoSel) || Boolean(estadoSel) || queryProd.trim().length > 0 || Boolean(purchaseAt);

    const textFieldSx = {
        mt: 0.5,
        "& .MuiOutlinedInput-root": {
            height: 46,
            background: "var(--tg-card-bg)",
            color: "var(--tg-card-fg)",
            borderRadius: 1,
            "& fieldset": { borderColor: "var(--tg-border)" },
            "&:hover fieldset": { borderColor: "var(--tg-border)" },
            "&.Mui-focused fieldset": {
                borderColor: "var(--tg-primary)",
                boxShadow: "0 0 0 2px color-mix(in srgb, var(--tg-primary) 25%, transparent)",
            },
        },
        "& .MuiInputBase-input::placeholder": {
            color: "var(--tg-placeholder, rgba(115,115,115,0.9))",
            opacity: 1,
        },
        "& .MuiSvgIcon-root": { color: "var(--tg-muted)" },
    } as const;

    const autoSlotProps = {
        paper: { sx: { bgcolor: "var(--tg-card-bg)", color: "var(--tg-card-fg)", border: "1px solid var(--tg-border)" } },
        listbox: {
            sx: {
                "& .MuiAutocomplete-option.Mui-focused, & .MuiAutocomplete-option[aria-selected='true']": {
                    bgcolor: "color-mix(in srgb, var(--tg-primary) 18%, transparent)",
                    color: "var(--tg-card-fg)",
                },
            },
        },
    } as const;

    const openConfirm = (p: ProductDTO) => {
        setSelProd(p);
        setEditIdTmp(null);
        setModalDefaults({
            referencia: p.reference,
            descripcion: p.description,
            precio_unitario: p.purchase_price,
            cantidad: 1,
            stock: p.quantity,
            precio_compra: p.purchase_price,
        });
        setConfirmOpen(true);
    };

    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    function incQty(idTmp: string) { setItems(prev => prev.map(it => (it.idTmp === idTmp ? { ...it, cantidad: it.cantidad + 1 } : it))); }
    function decQty(idTmp: string) { setItems(prev => prev.map(it => (it.idTmp === idTmp ? { ...it, cantidad: clamp(it.cantidad - 1, 1, 1e9) } : it))); }
    function setQty(idTmp: string, v: number) {
        const q = clamp(Number.isFinite(v) ? Math.trunc(v) : 1, 1, 1e9);
        setItems(prev => prev.map(it => (it.idTmp === idTmp ? { ...it, cantidad: q } : it)));
    }

    const onConfirmProducto = (data: { precio_unitario: number; cantidad: number }) => {
        if (!selProd || !modalDefaults) return;

        if (editIdTmp) {
            setItems(prev => prev.map(x => (x.idTmp === editIdTmp ? { ...x, precioUnit: data.precio_unitario, cantidad: data.cantidad } : x)));
        } else {
            setItems(prev => {
                const idx = prev.findIndex(r => r.productoId === selProd.id);
                if (idx >= 0) {
                    const next = [...prev];
                    next[idx] = { ...next[idx], cantidad: next[idx].cantidad + data.cantidad, precioUnit: data.precio_unitario };
                    return next;
                }
                return [
                    ...prev,
                    {
                        idTmp: crypto.randomUUID(),
                        productoId: selProd.id,
                        reference: selProd.reference,
                        description: selProd.description,
                        precioUnit: data.precio_unitario,
                        cantidad: data.cantidad,
                    },
                ];
            });
            setPage(Math.max(1, Math.ceil((items.length + 1) / PAGE_SIZE)));
        }

        setConfirmOpen(false);
        setSelProd(null);
        setModalDefaults(null);
        setEditIdTmp(null);
        setQueryProd("");
    };

    const removeItem = (idTmp: string) => {
        const newLen = items.length - 1;
        const wouldBeEmpty = startIndex >= newLen && page > 1;
        setItems(prev => prev.filter(i => i.idTmp !== idTmp));
        if (wouldBeEmpty) setPage(p => Math.max(1, p - 1));
    };

    const limpiar = () => {
        setItems([]);
        setSelProd(null);
        setModalDefaults(null);
        setEditIdTmp(null);
        setQueryProd("");
        setProveedorSel(null);
        setBancoSel(null);
        setEstadoSel(null);
        setPurchaseAt(toLocalISOSec());
        setPage(1);
    };

    const estadoOptionsFiltradas = useMemo(
        () => estadoOptions.filter(n => !BLOQUEADA_RE.test(String(n))),
        [estadoOptions]
    );

    const puedeFinalizar = useMemo(
        () => items.length > 0 && !!proveedorSel && !!bancoSel && !!estadoSel,
        [items.length, proveedorSel, bancoSel, estadoSel]
    );

    const { create: createCompra, loading: creating } = useCreateCompra({
        onSuccess: () => { limpiar(); router.push("/comercial/compras"); },
    });

    async function finalizarCompra() {
        if (!puedeFinalizar) return;
        const estado_id = estadoSel ? estadoByName?.[estadoSel] : undefined;
        if (!estado_id) { error("No se pudo identificar el estado seleccionado"); return; }

        const itemsInput: PurchaseItemInput[] = items.map(it => ({
            product_id: it.productoId,
            quantity: it.cantidad,
            unit_price: it.precioUnit,
        }));

        const payload: PurchaseCreate = {
            supplier_id: Number(proveedorSel!.value),
            bank_id: Number(bancoSel!.value),
            status_id: estado_id,
            items: itemsInput,
        };

        await createCompra(payload, purchaseAt);
    }

    return (
        <div className="app-shell__frame overflow-hidden">
            {/* padding/gap móvil igual a ventas */}
            <div className="bg-[var(--page-bg)] rounded-xl h-full flex flex-col px-3 sm:px-4 md:px-5 pb-5 pt-3 sm:pt-4 gap-2">
                <Typography variant="h5" sx={{ mb: { xs: 0.5, sm: 1.25 }, fontWeight: 600 }}>
                    Nueva compra
                </Typography>

                {/* FORM */}
                <Box
                    sx={{
                        mb: 1.0,
                        display: "grid",
                        gap: 1.2,
                        gridTemplateColumns: {
                            xs: "1fr 1fr",
                            md: "minmax(260px,1.2fr) 0.8fr 0.8fr 0.7fr minmax(320px,1.3fr)",
                            lg: "minmax(320px,1.2fr) 0.8fr 0.8fr 0.7fr minmax(420px,1.4fr)",
                        },
                        gridTemplateAreas: {
                            xs: `
                "proveedor proveedor"
                "banco     estado"
                "fecha     fecha"
                "producto  producto"
              `,
                            md: `"proveedor banco estado fecha producto"`,
                        },
                        alignItems: "end",
                        maxWidth: 1800,
                    }}
                >
                    <Box sx={{ gridArea: "proveedor", minWidth: { xs: 220, md: 260 } }}>
                        <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>Proveedor</Typography>
                        <Autocomplete
                            options={proveedorOptions}
                            value={proveedorSel}
                            onChange={(_, v) => setProveedorSel(v)}
                            getOptionLabel={(o) => (o?.label ?? "") as string}
                            slotProps={autoSlotProps}
                            renderInput={(params) => <TextField {...params} placeholder="Selecciona o busca un proveedor…" sx={textFieldSx} />}
                        />
                    </Box>

                    <Box sx={{ gridArea: "banco", minWidth: { xs: 0, md: 180 } }}>
                        <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>Banco</Typography>
                        <Autocomplete
                            options={bancoOptions}
                            value={bancoSel}
                            loading={loadingBancos}
                            onChange={(_, v) => setBancoSel(v)}
                            getOptionLabel={(o) => (o?.label ?? "") as string}
                            slotProps={autoSlotProps}
                            renderInput={(params) => <TextField {...params} placeholder="Selecciona banco…" sx={textFieldSx} />}
                        />
                    </Box>

                    <Box sx={{ gridArea: "estado", minWidth: { xs: 0, md: 180 } }}>
                        <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>Estado</Typography>
                        <Autocomplete
                            options={estadoOptionsFiltradas}
                            value={estadoSel}
                            onChange={(_, v) => {
                                if (v && BLOQUEADA_RE.test(String(v))) { error("Estado no permitido"); return; }
                                setEstadoSel(v);
                            }}
                            slotProps={autoSlotProps}
                            renderInput={(params) => <TextField {...params} placeholder="Compra contado / crédito…" sx={textFieldSx} />}
                        />
                    </Box>

                    <Box sx={{ gridArea: "fecha", minWidth: { xs: 0, md: 170 } }}>
                        <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>Fecha de la compra</Typography>
                        <DateInput value={purchaseAt} onChange={setPurchaseAt} placeholder="dd/mm/aaaa" />
                    </Box>

                    <Box sx={{ gridArea: "producto", minWidth: 240, maxWidth: { md: 560, lg: 680 } }}>
                        <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>Producto</Typography>
                        <Autocomplete
                            value={selProd}
                            inputValue={queryProd}
                            options={catalogo}
                            loading={loadingProd}
                            isOptionEqualToValue={(o, v) => o.id === v.id}
                            getOptionLabel={(o) => `${o.reference} — ${o.description}`}
                            clearOnBlur
                            onChange={(_, val, reason) => {
                                if (reason === "clear") { setSelProd(null); setQueryProd(""); return; }
                                if (val) openConfirm(val);
                            }}
                            onInputChange={(_, val, reason) => {
                                if (reason === "clear") { setQueryProd(""); return; }
                                setQueryProd(val);
                            }}
                            slotProps={autoSlotProps}
                            renderInput={(params) => <TextField {...params} placeholder="Busca por referencia o descripción…" sx={textFieldSx} />}
                        />
                    </Box>
                </Box>

                <div className="h-px w-full" style={{ background: "var(--tg-border)" }} />

                {/* LISTA / CARRITO */}
                <div className="mt-2">
                    {/* Desktop grid */}
                    <div
                        className="hidden md:grid flex-1 overflow-hidden"
                        style={{ gridTemplateRows: `repeat(${PAGE_SIZE}, ${CARD_H}px)`, rowGap: `${CARD_GAP}px` }}
                    >
                        {items.length === 0 ? (
                            <div
                                className="rounded-xl border"
                                style={{
                                    gridRow: `span ${PAGE_SIZE}`,
                                    height: `calc(${CARD_H}px * ${PAGE_SIZE} + ${CARD_GAP}px * ${PAGE_SIZE - 1})`,
                                    borderColor: "var(--tg-border)",
                                    background: "var(--tg-card-bg)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Typography sx={{ color: "var(--tg-muted)" }}>Agrega productos para construir tu compra.</Typography>
                            </div>
                        ) : (
                            <>
                                {pagedItems.map((it, i) => {
                                    const number = startIndex + i + 1;
                                    const subtotal = it.precioUnit * it.cantidad;
                                    return (
                                        <div
                                            key={it.idTmp}
                                            className="rounded-xl border p-4"
                                            style={{ height: CARD_H, borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}
                                        >
                                            <div
                                                className="grid items-center gap-3"
                                                style={{ gridTemplateColumns: "minmax(0,1fr) 120px 168px 200px" }}
                                            >
                                                <div className="flex items-start gap-3 overflow-hidden">
                                                    <div
                                                        className="h-7 min-w-7 rounded-full border text-xs flex items-center justify-center mt-0.5"
                                                        style={{ borderColor: "var(--tg-border)", color: "var(--tg-muted)" }}
                                                    >
                                                        {number}
                                                    </div>
                                                    <div className="min-w-0 pr-8">
                                                        <div className="font-semibold text-[var(--tg-card-fg)] truncate">{it.description}</div>
                                                        <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Ref: {it.reference}</div>
                                                    </div>
                                                </div>

                                                <div className="text-right">
                                                    <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Precio</div>
                                                    <div className="font-medium">{money.format(it.precioUnit)}</div>
                                                </div>

                                                <div className="flex items-center justify-center gap-2">
                                                    <button type="button" className="h-8 w-8 rounded border" style={{ borderColor: "var(--tg-border)", color: "var(--tg-card-fg)" }} onClick={() => decQty(it.idTmp)}>–</button>
                                                    <input type="number" min={1} className="h-8 w-16 rounded border bg-transparent text-center" style={{ borderColor: "var(--tg-border)", color: "var(--tg-card-fg)" }} value={it.cantidad} onChange={(e) => setQty(it.idTmp, Number(e.target.value))} />
                                                    <button type="button" className="h-8 w-8 rounded border" style={{ borderColor: "var(--tg-border)", color: "var(--tg-card-fg)" }} onClick={() => incQty(it.idTmp)}>+</button>
                                                </div>

                                                <div className="flex items-center justify-end gap-3">
                                                    <div className="text-right">
                                                        <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Subtotal</div>
                                                        <div className="font-semibold">{money.format(subtotal)}</div>
                                                    </div>
                                                    <IconButton size="small" onClick={() => removeItem(it.idTmp)} aria-label="eliminar" sx={{ color: "var(--tg-muted)", "&:hover": { color: "var(--tg-primary)" } }}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </>
                        )}
                    </div>

                    {/* Mobile list */}
                    <div className="md:hidden flex flex-col gap-2">
                        {items.length === 0 ? (
                            <div className="rounded-xl border px-3 py-6 text-center" style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)", color: "var(--tg-muted)" }}>
                                Agrega productos para construir tu compra.
                            </div>
                        ) : (
                            pagedItems.map((it, i) => {
                                const subtotal = it.precioUnit * it.cantidad;
                                const number = startIndex + i + 1;
                                return (
                                    <div key={it.idTmp} className="rounded-xl border px-3 py-3" style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}>
                                        <div className="grid grid-cols-[1fr_auto] items-start gap-2">
                                            <div className="min-w-0 pr-2">
                                                <div className="flex items-start gap-2">
                                                    <div className="h-6 min-w-6 rounded-full border text-[11px] flex items-center justify-center mt-0.5" style={{ borderColor: "var(--tg-border)", color: "var(--tg-muted)" }}>
                                                        {number}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="font-semibold truncate">{it.description}</div>
                                                        <div className="text-xs" style={{ color: "var(--tg-muted)" }}>Ref: {it.reference}</div>
                                                        <div className="text-xs mt-0.5" style={{ color: "var(--tg-muted)" }}>Precio {money.format(it.precioUnit)}</div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-end gap-2">
                                                <button type="button" className="h-8 w-8 rounded border" style={{ borderColor: "var(--tg-border)" }} onClick={() => decQty(it.idTmp)}>–</button>
                                                <input type="number" min={1} className="h-8 w-14 rounded border bg-transparent text-center" style={{ borderColor: "var(--tg-border)" }} value={it.cantidad} onChange={(e) => setQty(it.idTmp, Number(e.target.value))} />
                                                <button type="button" className="h-8 w-8 rounded border" style={{ borderColor: "var(--tg-border)" }} onClick={() => incQty(it.idTmp)}>+</button>
                                            </div>
                                        </div>

                                        <div className="mt-2 flex items-center justify-end gap-3">
                                            <div className="text-right">
                                                <div className="text-xs" style={{ color: "var(--tg-muted)" }}>Subtotal</div>
                                                <div className="font-semibold">{money.format(subtotal)}</div>
                                            </div>
                                            <IconButton size="small" onClick={() => removeItem(it.idTmp)} aria-label="eliminar" sx={{ color: "var(--tg-muted)", "&:hover": { color: "var(--tg-primary)" } }}>
                                                <DeleteOutlineIcon fontSize="small" />
                                            </IconButton>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Paginación móvil */}
                    {items.length > PAGE_SIZE && (
                        <Stack
                            direction="row"
                            alignItems="center"
                            justifyContent="space-between"
                            gap={1.0}
                            sx={{ mt: 1, display: { xs: "flex", md: "none" } }}
                        >
                            <Pagination
                                page={page}
                                count={pageCount}
                                onChange={(_, p) => setPage(p)}
                                siblingCount={0}
                                boundaryCount={0}
                                size="small"
                                sx={{ "& .MuiPaginationItem-root": { color: "var(--tg-muted)" } }}
                            />
                            <div className="px-2 py-1 rounded-md border" style={{ borderColor: "var(--tg-border)", color: "var(--tg-muted)" }} aria-label="page-indicator-xs">
                                {page} / {pageCount}
                            </div>
                        </Stack>
                    )}
                </div>

                {/* Paginación desktop */}
                {items.length > PAGE_SIZE && (
                    <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1.25} sx={{ mt: 1, display: { xs: "none", md: "flex" } }}>
                        <Pagination
                            page={page}
                            count={pageCount}
                            onChange={(_, p) => setPage(p)}
                            siblingCount={0}
                            boundaryCount={0}
                            showFirstButton={false}
                            showLastButton={false}
                            size="small"
                            sx={{
                                "& .MuiPaginationItem-root": { color: "var(--tg-muted)" },
                                "& .MuiPaginationItem-text": { display: "none" },
                                "& .MuiPaginationItem-previousNext": { display: "inline-flex" },
                            }}
                        />
                        <div className="px-3 py-1 rounded-md border" style={{ borderColor: "var(--tg-border)", color: "var(--tg-muted)" }}>
                            {page} / {pageCount}
                        </div>
                        <Typography variant="body2" sx={{ ml: 1, color: "var(--tg-muted)" }}>
                            Mostrando {startIndex + 1}-{endIndex} de {items.length}
                        </Typography>
                    </Stack>
                )}

                {/* Totales */}
                {items.length > 0 && (
                    <div className="mt-1 sm:mt-2 flex justify-end">
                        <div className="rounded-lg border px-3 py-3 w-full max-w-full sm:max-w-sm" style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}>
                            <div className="flex items-center justify-between">
                                <span className="text-sm" style={{ color: "var(--tg-muted)" }}>Subtotal</span>
                                <span className="font-medium">{money.format(total)}</span>
                            </div>
                            <div className="mt-2 flex items-center justify-between">
                                <span className="text-sm" style={{ color: "var(--tg-muted)" }}>Total</span>
                                <span className="font-semibold text-[var(--tg-card-fg)]">{money.format(total)}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Acciones */}
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="flex-end" alignItems={{ xs: "stretch", sm: "center" }} gap={1.25} sx={{ mt: 2 }}>
                    {hasDirty && (
                        <>
                            <Button
                                onClick={limpiar}
                                variant="outlined"
                                fullWidth
                                sx={{ textTransform: "none", color: "var(--tg-muted)", borderColor: "var(--tg-border)", display: { xs: "inline-flex", sm: "none" } }}
                            >
                                Limpiar
                            </Button>
                            <Button
                                onClick={limpiar}
                                variant="text"
                                sx={{ textTransform: "none", color: "var(--tg-muted)", display: { xs: "none", sm: "inline-flex" } }}
                            >
                                Limpiar
                            </Button>
                        </>
                    )}

                    {puedeFinalizar && (
                        <Button
                            variant="contained"
                            onClick={finalizarCompra}
                            disabled={creating}
                            fullWidth
                            sx={{
                                textTransform: "none",
                                bgcolor: "var(--tg-primary)",
                                color: "var(--tg-primary-fg)",
                                "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                                maxWidth: { sm: 240 },
                            }}
                        >
                            {creating ? "Guardando…" : "Finalizar compra"}
                        </Button>
                    )}
                </Stack>
            </div>

            {modalDefaults && (
                <ProductoAgregate
                    open={confirmOpen}
                    onClose={() => { setConfirmOpen(false); setEditIdTmp(null); }}
                    loading={false}
                    variant="compra"
                    defaults={modalDefaults}
                    onConfirm={onConfirmProducto}
                />
            )}
        </div>
    );
}
