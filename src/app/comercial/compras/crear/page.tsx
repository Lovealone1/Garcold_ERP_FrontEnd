// app/(comercial)/compras/nueva/page.tsx
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
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import ProductoAgregate, { ProductoAgregateDefaults } from "@/features/productos/ProductoAgregate";

// --------- Mock de datos (ajusta por tus APIs) ----------
type Producto = {
    id: number;
    referencia: string;
    descripcion: string;
    precio_venta: number;  // puedes mapear a precio_unitario sugerido
    stock: number;
    precio_compra: number;
};

const MOCK_PROD: Producto[] = [
    { id: 1, referencia: "REF-1001", descripcion: "Bulto concentrado 30kg", precio_venta: 98000, stock: 25, precio_compra: 76000 },
    { id: 2, referencia: "REF-2001", descripcion: "Arena para gato 10kg", precio_venta: 48000, stock: 40, precio_compra: 36000 },
    { id: 3, referencia: "REF-3005", descripcion: "Juguete cuerda grande", precio_venta: 24000, stock: 12, precio_compra: 15000 },
];

type Proveedor = { id: number; nombre: string };
const MOCK_PROVEEDORES: Proveedor[] = [
    { id: 1, nombre: "Suministros Andinos" },
    { id: 2, nombre: "Mayoristas del Valle" },
    { id: 3, nombre: "Distribuidora Central" },
];

type Banco = { id: number; nombre: string };
const MOCK_BANCOS: Banco[] = [
    { id: 1, nombre: "Bancolombia" },
    { id: 2, nombre: "Davivienda" },
    { id: 3, nombre: "BBVA" },
];

const ESTADOS = ["Compra contado", "Compra crédito"] as const;

// ---------------------- Tipos internos ----------------------
type ItemCompra = {
    idTmp: string;
    productoId: number;
    referencia: string;
    descripcion: string;
    precioUnit: number;
    cantidad: number;
};

const PAGE_SIZE = 8;

export default function CompraCrearPage() {
    // catálogos
    const [catalogo] = useState<Producto[]>(MOCK_PROD);
    const [proveedores] = useState<Proveedor[]>(MOCK_PROVEEDORES);
    const [bancos] = useState<Banco[]>(MOCK_BANCOS);

    // cabecera
    const [proveedorSel, setProveedorSel] = useState<Proveedor | null>(null);
    const [bancoSel, setBancoSel] = useState<Banco | null>(null);
    const [estadoSel, setEstadoSel] = useState<string | null>(null);

    // buscador producto
    const [queryProd, setQueryProd] = useState("");
    const [selProd, setSelProd] = useState<Producto | null>(null);

    // modal ProductoAgregate (reutilizado)
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [modalDefaults, setModalDefaults] = useState<ProductoAgregateDefaults | null>(null);
    const [editIdTmp, setEditIdTmp] = useState<string | null>(null);

    // ítems
    const [items, setItems] = useState<ItemCompra[]>([]);
    const total = useMemo(() => items.reduce((a, it) => a + it.precioUnit * it.cantidad, 0), [items]);

    // paginación front
    const [page, setPage] = useState(1);
    const pageCount = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
    useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount, items.length]);
    const startIndex = (page - 1) * PAGE_SIZE;
    const endIndex = Math.min(page * PAGE_SIZE, items.length);
    const pagedItems = useMemo(() => items.slice(startIndex, endIndex), [items, startIndex, endIndex]);

    // estilos (flechas claras + placeholders + iconos)
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

    const iconButtonSx = {
        color: "var(--tg-muted)",
        "&:hover": { color: "var(--tg-primary)" },
    } as const;

    // abrir modal (agregar)
    const openConfirm = (p: Producto) => {
        setSelProd(p);
        setEditIdTmp(null);
        setModalDefaults({
            referencia: p.referencia,
            descripcion: p.descripcion,
            precio_unitario: p.precio_compra || p.precio_venta, // en compras sugerimos precio_compra
            cantidad: 1,
            stock: p.stock,
            precio_compra: p.precio_compra,
        });
        setConfirmOpen(true);
    };

    // editar ítem
    const editItem = (it: ItemCompra) => {
        const p = catalogo.find((x) => x.id === it.productoId);
        setSelProd(p ?? null);
        setEditIdTmp(it.idTmp);
        setModalDefaults({
            referencia: it.referencia,
            descripcion: it.descripcion,
            precio_unitario: it.precioUnit,
            cantidad: it.cantidad,
            stock: p?.stock ?? 0,
            precio_compra: p?.precio_compra ?? 0,
        });
        setConfirmOpen(true);
    };

    // confirmar modal
    const onConfirmProducto = (data: { precio_unitario: number; cantidad: number }) => {
        if (!selProd || !modalDefaults) return;

        if (editIdTmp) {
            setItems(prev => prev.map(x => x.idTmp === editIdTmp ? { ...x, precioUnit: data.precio_unitario, cantidad: data.cantidad } : x));
        } else {
            const newLen = items.length + 1;
            setItems(prev => [
                ...prev,
                {
                    idTmp: crypto.randomUUID(),
                    productoId: selProd.id,
                    referencia: selProd.referencia,
                    descripcion: selProd.descripcion,
                    precioUnit: data.precio_unitario,
                    cantidad: data.cantidad,
                },
            ]);
            setPage(Math.max(1, Math.ceil(newLen / PAGE_SIZE)));
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
        setPage(1);
    };

    const puedeFinalizar = items.length > 0 && !!proveedorSel && !!bancoSel && !!estadoSel;

    return (
        <div className="app-shell__frame min-h-screen">
            <div className="bg-[var(--page-bg)] rounded-xl px-[var(--content-l)] pb-[var(--content-b)] pt-4">
                <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                    Nueva compra
                </Typography>

                {/* Cabecera: Proveedor / Banco / Estado */}
                <Box sx={{ maxWidth: 1100, mb: 2 }}>
                    <Stack direction={{ xs: "column", md: "row" }} gap={2}>
                        <Box sx={{ flex: 1, minWidth: 260 }}>
                            <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>
                                Proveedor
                            </Typography>
                            <Autocomplete
                                options={proveedores}
                                value={proveedorSel}
                                onChange={(_, v) => setProveedorSel(v)}
                                getOptionLabel={(o) => o?.nombre ?? ""}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Selecciona o busca un proveedor…" sx={textFieldSx} />
                                )}
                            />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 220 }}>
                            <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>
                                Banco
                            </Typography>
                            <Autocomplete
                                options={bancos}
                                value={bancoSel}
                                onChange={(_, v) => setBancoSel(v)}
                                getOptionLabel={(o) => o?.nombre ?? ""}
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
                                options={[...ESTADOS]}
                                value={estadoSel}
                                onChange={(_, v) => setEstadoSel(v)}
                                renderInput={(params) => (
                                    <TextField {...params} placeholder="Compra contado / crédito…" sx={textFieldSx} />
                                )}
                            />
                        </Box>
                    </Stack>
                </Box>

                {/* Selector de producto */}
                <Box sx={{ maxWidth: 800 }}>
                    <Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>
                        Producto
                    </Typography>
                    <Autocomplete
                        value={selProd}
                        onChange={(_, val) => val && openConfirm(val)}
                        inputValue={queryProd}
                        onInputChange={(_, val) => setQueryProd(val)}
                        options={catalogo}
                        getOptionLabel={(o) => `${o.referencia} — ${o.descripcion}`}
                        renderInput={(params) => (
                            <TextField {...params} placeholder="Busca por referencia o descripción…" sx={textFieldSx} />
                        )}
                    />
                </Box>

                {/* Tabla de ítems */}
                <div className="mt-4 rounded-xl overflow-hidden border border-[var(--panel-border)] bg-[var(--panel-bg)] shadow">
                    <div className="overflow-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-[var(--table-head-bg)] text-[var(--table-head-fg)]">
                                    <th className="px-4 py-3 text-left">Referencia</th>
                                    <th className="px-4 py-3 text-left">Descripción</th>
                                    <th className="px-4 py-3 text-right">Precio</th>
                                    <th className="px-4 py-3 text-right">Cantidad</th>
                                    <th className="px-4 py-3 text-right">Subtotal</th>
                                    <th className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-4 py-8 text-center text-tg-muted">
                                            Agrega productos para construir la compra.
                                        </td>
                                    </tr>
                                ) : (
                                    pagedItems.map((it) => (
                                        <tr key={it.idTmp} className="border-t border-tg hover:bg-black/5 dark:hover:bg-white/5">
                                            <td className="px-4 py-3">{it.referencia}</td>
                                            <td className="px-4 py-3">{it.descripcion}</td>
                                            <td className="px-4 py-3 text-right">{it.precioUnit.toLocaleString("es-CO")}</td>
                                            <td className="px-4 py-3 text-right">{it.cantidad}</td>
                                            <td className="px-4 py-3 text-right">
                                                {(it.precioUnit * it.cantidad).toLocaleString("es-CO")}
                                            </td>
                                            <td className="px-2 py-2">
                                                <div className="flex items-center justify-center gap-1">
                                                    <IconButton size="small" onClick={() => editItem(it)} aria-label="editar" sx={iconButtonSx}>
                                                        <EditOutlinedIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => removeItem(it.idTmp)} aria-label="eliminar" sx={iconButtonSx}>
                                                        <DeleteOutlineIcon fontSize="small" />
                                                    </IconButton>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>

                            {items.length > 0 && (
                                <tfoot>
                                    <tr className="border-t border-tg">
                                        <td colSpan={4} />
                                        <td className="px-4 py-3 text-right font-semibold">Total</td>
                                        <td className="px-4 py-3 text-right font-semibold">{total.toLocaleString("es-CO")}</td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>

                {/* Navegación de página */}
                {items.length > PAGE_SIZE && (
                    <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1.5} sx={{ mt: 1.5, flexWrap: "wrap" }}>
                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page <= 1}
                            sx={{ textTransform: "none", borderColor: "var(--tg-border)", color: "var(--tg-muted)" }}
                        >
                            Anterior
                        </Button>

                        <Pagination
                            page={page}
                            count={pageCount}
                            onChange={(_, p) => setPage(p)}
                            siblingCount={1}
                            boundaryCount={1}
                            size="small"
                            sx={{
                                "& .MuiPaginationItem-root": { color: "var(--tg-muted)" },
                                "& .MuiPaginationItem-root.Mui-selected": {
                                    bgcolor: "var(--tg-primary)",
                                    color: "var(--tg-primary-fg)",
                                    "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                                },
                                "& .MuiPaginationItem-previousNext": { color: "var(--tg-muted)" },
                            }}
                        />

                        <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                            disabled={page >= pageCount}
                            sx={{ textTransform: "none", borderColor: "var(--tg-border)", color: "var(--tg-muted)" }}
                        >
                            Próximo
                        </Button>

                        <Typography variant="body2" sx={{ ml: 1, color: "var(--tg-muted)" }}>
                            Mostrando {startIndex + 1}-{endIndex} de {items.length}
                        </Typography>
                    </Stack>
                )}

                {/* Acciones */}
                <Stack direction="row" justifyContent="flex-end" gap={1.5} sx={{ mt: 3 }}>
                    <Button onClick={limpiar} variant="text" sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                        Limpiar
                    </Button>

                    {puedeFinalizar && (
                        <Button
                            variant="contained"
                            sx={{
                                textTransform: "none",
                                bgcolor: "var(--tg-primary)",
                                color: "var(--tg-primary-fg)",
                                "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                            }}
                        >
                            Finalizar compra
                        </Button>
                    )}
                </Stack>
            </div>

            {/* Modal de producto (mismo componente) */}
            {modalDefaults && (
                <ProductoAgregate
                    open={confirmOpen}
                    onClose={() => { setConfirmOpen(false); setEditIdTmp(null); }}
                    loading={false}
                    defaults={modalDefaults}
                    onConfirm={onConfirmProducto}
                />
            )}
        </div>
    );
}
