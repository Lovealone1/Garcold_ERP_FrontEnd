// app/(comercial)/ventas/nueva/page.tsx
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

import { useProductosAll } from "@/hooks/productos/useProductosAll";
import { useClienteOptions, type ClienteOption } from "@/hooks/clientes/useClienteOptions";
import { useVentaEstados } from "@/hooks/estados/useVentaEstados";
import { listBancos } from "@/services/sales/bancos.api";
import type { Producto } from "@/types/productos";
import type { Banco } from "@/types/bancos";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { useRouter } from "next/navigation";

// ⬇️ nuevo hook
import { useCreateVenta } from "@/hooks/ventas/useCreateVenta";
import type { VentaCreate } from "@/types/ventas";

type ItemVenta = {
    idTmp: string;
    productoId: number;
    referencia: string;
    descripcion: string;
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

// ===== Config =====
const PAGE_SIZE = 5;            // 5 por página (fijas)
const CARD_H = 80;              // alto de cada card
const CARD_GAP = 10;            // separación vertical entre cards
const SHOW_EMPTY_HINT = true;   // mostrar placeholder cuando no hay productos

const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
const BLOQUEADA_RE = /venta\s*cancelada/i;

export default function VentaCrearPage() {
    const router = useRouter();
    const { error } = useNotifications();

    const { items: catalogo, loading: loadingProd } = useProductosAll();
    const { options: clienteOptions } = useClienteOptions();
    const { options: estadoOptions, byName: estadoByName } = useVentaEstados();

    const [bancos, setBancos] = useState<Banco[]>([]);
    const bancoOptions: Option[] = useMemo(
        () => bancos.map((b) => ({ value: b.id, label: b.nombre })),
        [bancos]
    );

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const data = await listBancos(Date.now());
                if (alive) setBancos(data);
            } catch {
                setBancos([]);
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const [clienteSel, setClienteSel] = useState<ClienteOption | null>(null);
    const [bancoSel, setBancoSel] = useState<Option | null>(null);
    const [estadoSel, setEstadoSel] = useState<string | null>(null);

    const [queryProd, setQueryProd] = useState("");
    const [selProd, setSelProd] = useState<Producto | null>(null);

    const [confirmOpen, setConfirmOpen] = useState(false);
    const [modalDefaults, setModalDefaults] = useState<ProductoAgregateDefaults | null>(null);
    const [editIdTmp, setEditIdTmp] = useState<string | null>(null);

    const [items, setItems] = useState<ItemVenta[]>([]);
    const total = useMemo(() => items.reduce((a, it) => a + it.precioUnit * it.cantidad, 0), [items]);

    const [page, setPage] = useState(1);
    const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    useEffect(() => {
        if (page > pageCount) setPage(pageCount);
    }, [page, pageCount, items.length]);
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = Math.min(page * PAGE_SIZE, items.length);
    const pagedItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex]);

    // ¿hay algo que limpiar?
    const hasDirty =
        items.length > 0 ||
        Boolean(clienteSel) ||
        Boolean(bancoSel) ||
        Boolean(estadoSel) ||
        queryProd.trim().length > 0;

    // estilos inputs
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
        paper: {
            sx: {
                bgcolor: "var(--tg-card-bg)",
                color: "var(--tg-card-fg)",
                border: "1px solid var(--tg-border)",
            },
        },
        listbox: {
            sx: {
                "& .MuiAutocomplete-option.Mui-focused, & .MuiAutocomplete-option[aria-selected='true']": {
                    bgcolor: "color-mix(in srgb, var(--tg-primary) 18%, transparent)",
                    color: "var(--tg-card-fg)",
                },
            },
        },
    } as const;

    const openConfirm = (p: Producto) => {
        setSelProd(p);
        setEditIdTmp(null);
        setModalDefaults({
            referencia: p.referencia,
            descripcion: p.descripcion,
            precio_unitario: p.precio_venta,
            cantidad: 1,
            stock: p.cantidad,
            precio_compra: p.precio_compra,
        });
        setConfirmOpen(true);
    };

    // helpers cantidad
    const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));
    function incQty(idTmp: string) {
        setItems(prev => prev.map(it => it.idTmp === idTmp ? { ...it, cantidad: it.cantidad + 1 } : it));
    }
    function decQty(idTmp: string) {
        setItems(prev => prev.map(it => it.idTmp === idTmp ? { ...it, cantidad: clamp(it.cantidad - 1, 1, 1e9) } : it));
    }
    function setQty(idTmp: string, v: number) {
        const q = clamp(Number.isFinite(v) ? Math.trunc(v) : 1, 1, 1e9);
        setItems(prev => prev.map(it => it.idTmp === idTmp ? { ...it, cantidad: q } : it));
    }

    // merge si se repite producto
    const onConfirmProducto = (data: { precio_unitario: number; cantidad: number }) => {
        if (!selProd || !modalDefaults) return;

        if (editIdTmp) {
            setItems(prev =>
                prev.map(x => (x.idTmp === editIdTmp ? { ...x, precioUnit: data.precio_unitario, cantidad: data.cantidad } : x))
            );
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
                        referencia: selProd.referencia,
                        descripcion: selProd.descripcion,
                        precioUnit: data.precio_unitario,
                        cantidad: data.cantidad,
                    },
                ];
            });
            setPage(p => Math.max(1, Math.ceil((items.length + 1) / PAGE_SIZE)));
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
        setClienteSel(null);
        setBancoSel(null);
        setEstadoSel(null);
        setPage(1);
    };

    // bloquear “Venta cancelada”
    const estadoOptionsFiltradas = useMemo(
        () => estadoOptions.filter(n => !BLOQUEADA_RE.test(String(n))),
        [estadoOptions]
    );

    const puedeFinalizar = useMemo(
        () => items.length > 0 && !!clienteSel && !!bancoSel && !!estadoSel,
        [items.length, clienteSel, bancoSel, estadoSel]
    );

    // ⬇️ usar hook para crear la venta
    const { create: createVenta, loading: creating } = useCreateVenta({
        onSuccess: () => {
            limpiar();
            router.push("/comercial/ventas");
        },
    });

    async function finalizarVenta() {
        if (!puedeFinalizar) return;
        const estado_id = estadoSel ? estadoByName?.[estadoSel] : undefined;
        if (!estado_id) {
            error("No se pudo identificar el estado seleccionado");
            return;
        }

        // construir el carrito EXACTAMENTE como lo requiere el backend
        const carrito: VentaCreate["carrito"] = items.map(it => ({
            producto_id: it.productoId,
            cantidad: it.cantidad,
            precio_producto: it.precioUnit,
        }));

        const payload: VentaCreate = {
            cliente_id: Number(clienteSel!.value),
            banco_id: Number(bancoSel!.value),
            estado_id,
            carrito, // [{ producto_id, cantidad, precio_producto }, ...]
        };

        await createVenta(payload);
    }

    return (
        // Pantalla completa y sin scroll
        <div className="app-shell__frame overflow-hidden">
            <div className="bg-[var(--page-bg)] rounded-xl h-full flex flex-col px-4 md:px-5 pb-5 pt-4">
                <Typography variant="h5" sx={{ mb: 1.25, fontWeight: 600 }}>
                    Nueva venta
                </Typography>

                <Box sx={{ maxWidth: 1800, mb: 1.0 }}>
                    <Stack direction={{ xs: "column", md: "row" }} gap={1.2} flexWrap="wrap" alignItems="flex-end">
                        <Box sx={{ flex: 1, minWidth: 240 }}>
                            <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>
                                Cliente
                            </Typography>
                            <Autocomplete
                                options={clienteOptions}
                                value={clienteSel}
                                onChange={(_, v) => setClienteSel(v)}
                                getOptionLabel={(o) => (o?.label ?? "") as string}
                                slotProps={autoSlotProps}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Selecciona o busca un cliente…" sx={textFieldSx} />
                                )}
                            />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 210 }}>
                            <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>
                                Banco
                            </Typography>
                            <Autocomplete
                                options={bancoOptions}
                                value={bancoSel}
                                onChange={(_, v) => setBancoSel(v)}
                                getOptionLabel={(o) => (o?.label ?? "") as string}
                                slotProps={autoSlotProps}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Selecciona banco…" sx={textFieldSx} />
                                )}
                            />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>
                                Estado
                            </Typography>
                            <Autocomplete
                                options={estadoOptionsFiltradas}
                                value={estadoSel}
                                onChange={(_, v) => {
                                    if (v && BLOQUEADA_RE.test(String(v))) {
                                        error("Estado no permitido");
                                        return;
                                    }
                                    setEstadoSel(v);
                                }}
                                slotProps={autoSlotProps}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Venta contado / crédito…" sx={textFieldSx} />
                                )}
                            />
                        </Box>

                        <Box sx={{ flex: 1.3, minWidth: 310, maxWidth: { md: 510 } }}>
                            <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>
                                Producto
                            </Typography>
                            <Autocomplete
                                value={selProd}
                                inputValue={queryProd}
                                options={catalogo}
                                loading={loadingProd}
                                isOptionEqualToValue={(o, v) => o.id === v.id}
                                getOptionLabel={(o) => `${o.referencia} — ${o.descripcion}`}
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
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Busca por referencia o descripción…" sx={textFieldSx} />
                                )}
                            />
                        </Box>
                    </Stack>
                </Box>

                {/* Línea divisoria */}
                <div className="h-px w-full" style={{ background: "var(--tg-border)" }} />

                {/* ===== Área fija de 5 filas: mismo tamaño/posición siempre ===== */}
                <div
                    className="flex-1 overflow-hidden mt-2"
                    style={{
                        display: "grid",
                        gridTemplateRows: `repeat(${PAGE_SIZE}, ${CARD_H}px)`,
                        rowGap: `${CARD_GAP}px`,
                    }}
                >
                    {/* placeholder (configurable) cuando no hay items */}
                    {SHOW_EMPTY_HINT && items.length === 0 ? (
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
                            <Typography sx={{ color: "var(--tg-muted)" }}>
                                Agrega productos para construir tu venta.
                            </Typography>
                        </div>
                    ) : (
                        <>
                            {pagedItems.map((it, i) => {
                                const number = startIndex + i + 1;
                                const subtotal = it.precioUnit * it.cantidad;
                                return (
                                    <div
                                        key={it.idTmp}
                                        className="rounded-xl border p-3 md:p-4"
                                        style={{
                                            height: CARD_H,
                                            borderColor: "var(--tg-border)",
                                            background: "var(--tg-card-bg)", // mismo bg que inputs
                                        }}
                                    >
                                        <div className="grid items-center gap-3" style={{ gridTemplateColumns: "1fr 140px 180px 160px" }}>
                                            {/* info */}
                                            <div className="flex items-start gap-3 overflow-hidden">
                                                <div
                                                    className="h-7 min-w-7 rounded-full border text-xs flex items-center justify-center mt-0.5"
                                                    style={{ borderColor: "var(--tg-border)", color: "var(--tg-muted)" }}
                                                    aria-label={`producto-${number}`}
                                                >
                                                    {number}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-semibold text-[var(--tg-card-fg)] truncate">{it.descripcion}</div>
                                                    <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Ref: {it.referencia}</div>
                                                </div>
                                            </div>

                                            {/* precio */}
                                            <div className="text-right">
                                                <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Precio</div>
                                                <div className="font-medium">{money.format(it.precioUnit)}</div>
                                            </div>

                                            {/* cantidad */}
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    type="button"
                                                    className="h-8 w-8 rounded border"
                                                    style={{ borderColor: "var(--tg-border)", color: "var(--tg-card-fg)" }}
                                                    onClick={() => decQty(it.idTmp)}
                                                    aria-label="decrementar"
                                                >
                                                    –
                                                </button>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    className="h-8 w-16 rounded border bg-transparent text-center"
                                                    style={{ borderColor: "var(--tg-border)", color: "var(--tg-card-fg)" }}
                                                    value={it.cantidad}
                                                    onChange={(e) => setQty(it.idTmp, Number(e.target.value))}
                                                />
                                                <button
                                                    type="button"
                                                    className="h-8 w-8 rounded border"
                                                    style={{ borderColor: "var(--tg-border)", color: "var(--tg-card-fg)" }}
                                                    onClick={() => incQty(it.idTmp)}
                                                    aria-label="incrementar"
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* subtotal + borrar */}
                                            <div className="flex items-center justify-end gap-3">
                                                <div className="text-right">
                                                    <div className="text-sm" style={{ color: "var(--tg-muted)" }}>Subtotal</div>
                                                    <div className="font-semibold">{money.format(subtotal)}</div>
                                                </div>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => removeItem(it.idTmp)}
                                                    aria-label="eliminar"
                                                    sx={{ color: "var(--tg-muted)", "&:hover": { color: "var(--tg-primary)" } }}
                                                >
                                                    <DeleteOutlineIcon fontSize="small" />
                                                </IconButton>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* placeholders invisibles para completar las 5 filas */}
                            {Array.from({ length: Math.max(0, PAGE_SIZE - pagedItems.length) }).map((_, idx) => (
                                <div
                                    key={`ph-${idx}`}
                                    aria-hidden
                                    className="rounded-xl border"
                                    style={{
                                        height: CARD_H,
                                        opacity: 0,
                                        pointerEvents: "none",
                                        borderColor: "var(--tg-border)",
                                        background: "var(--tg-card-bg)",
                                    }}
                                />
                            ))}
                        </>
                    )}
                </div>

                {/* Paginación: flechas visibles, números ocultos + indicador numérico al lado */}
                {items.length > PAGE_SIZE && (
                    <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1.25} sx={{ mt: 1 }}>
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
                                // Oculta los números, deja solo las flechas
                                "& .MuiPaginationItem-text": { display: "none" },
                                "& .MuiPaginationItem-previousNext": { display: "inline-flex" },
                            }}
                        />
                        <div
                            className="px-3 py-1 rounded-md border"
                            style={{ borderColor: "var(--tg-border)", color: "var(--tg-muted)" }}
                            aria-label="page-indicator"
                        >
                            {page} / {pageCount}
                        </div>
                        <Typography variant="body2" sx={{ ml: 1, color: "var(--tg-muted)" }}>
                            Mostrando {startIndex + 1}-{endIndex} de {items.length}
                        </Typography>
                    </Stack>
                )}

                {items.length > 0 && (
                    <div className="mt-2 flex justify-end">
                        <div
                            className="rounded-lg border px-4 py-3 w-full max-w-sm"
                            style={{ borderColor: "var(--tg-border)", background: "var(--tg-card-bg)" }}
                        >
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

                <Stack direction="row" justifyContent="flex-end" gap={1.25} sx={{ mt: 2 }}>
                    {hasDirty && (
                        <Button onClick={limpiar} variant="text" sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                            Limpiar
                        </Button>
                    )}

                    {puedeFinalizar && (
                        <Button
                            variant="contained"
                            onClick={finalizarVenta}
                            disabled={creating}
                            sx={{
                                textTransform: "none",
                                bgcolor: "var(--tg-primary)",
                                color: "var(--tg-primary-fg)",
                                "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                            }}
                        >
                            {creating ? "Guardando…" : "Finalizar venta"}
                        </Button>
                    )}
                </Stack>
            </div>

            {modalDefaults && (
                <ProductoAgregate
                    open={confirmOpen}
                    onClose={() => {
                        setConfirmOpen(false);
                        setEditIdTmp(null);
                    }}
                    loading={false}
                    defaults={modalDefaults}
                    onConfirm={onConfirmProducto}
                    addToSale
                />
            )}
        </div>
    );
}
