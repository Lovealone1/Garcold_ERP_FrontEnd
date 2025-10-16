// features/compras/CompraView.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import type { Compra } from "@/types/compras";
import { getCompraById } from "@/services/sales/compras.api";
import { useCompraDetalles } from "@/hooks/compras/useCompraDetalles";
import type { DetalleCompraView } from "@/types/compras";

type Props = {
    open: boolean;
    onClose: () => void;
    compra?: Compra | null;
    compraId?: number | null;
};

const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

export default function CompraView({ open, onClose, compra: compraProp, compraId }: Props) {
    const [compra, setCompra] = useState<Compra | null>(compraProp ?? null);
    const [loadingCompra, setLoadingCompra] = useState(false);

    useEffect(() => {
        setCompra(compraProp ?? null);
    }, [compraProp]);

    useEffect(() => {
        if (compra || !compraId || !open) return;
        let alive = true;
        (async () => {
            try {
                setLoadingCompra(true);
                const c = await getCompraById(compraId);
                if (alive) setCompra(c);
            } finally {
                if (alive) setLoadingCompra(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [compra, compraId, open]);

    const { items, loading: loadingDetalles } = useCompraDetalles(compra?.id, { enabled: open && !!compra?.id });

    const isCredito = useMemo(
        () => (compra?.estado ?? "").toLowerCase().includes("credito") || (compra?.saldo ?? 0) > 0,
        [compra]
    );
    const isContado = useMemo(
        () => (compra?.estado ?? "").toLowerCase().includes("contado") && (compra?.saldo ?? 0) === 0,
        [compra]
    );

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            slotProps={{
                paper: {
                    sx: {
                        borderRadius: 2,
                        border: "1px solid var(--panel-border)",
                        bgcolor: "var(--tg-card-bg)",
                        color: "var(--tg-card-fg)",
                    },
                },
            }}
        >
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>Detalle de compra</DialogTitle>

            <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>
                {/* Encabezado */}
                <Box
                    sx={{
                        p: 2,
                        mb: 2,
                        border: "1px solid var(--panel-border)",
                        borderRadius: 2,
                        bgcolor: "color-mix(in srgb, var(--tg-card-bg) 92%, black 8%)",
                    }}
                >
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={2}>
                        <Box>
                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                {compra?.proveedor ?? (loadingCompra ? "Cargando…" : "—")}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                                ID interno: {compra?.id ?? (loadingCompra ? "…" : "—")}
                            </Typography>
                        </Box>

                        <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
                            {/* Estado */}
                            {compra && (
                                <Box
                                    sx={{
                                        px: 1.25,
                                        py: 0.5,
                                        borderRadius: 999,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        bgcolor: isContado ? "rgba(22,163,74,.15)" : "rgba(245,158,11,.15)",
                                        color: isContado ? "rgb(22,163,74)" : "rgb(245,158,11)",
                                        border: `1px solid ${isContado ? "rgba(22,163,74,.35)" : "rgba(245,158,11,.35)"}`,
                                    }}
                                >
                                    {isContado ? "Compra Contado" : "Compra Crédito"}
                                </Box>
                            )}

                            {/* Total */}
                            <Box
                                sx={{
                                    px: 1.25,
                                    py: 0.5,
                                    borderRadius: 999,
                                    fontSize: 12,
                                    fontWeight: 700,
                                    bgcolor: "rgba(59,130,246,.15)",
                                    color: "rgb(59,130,246)",
                                    border: "1px solid rgba(59,130,246,.35)",
                                }}
                            >
                                {compra ? money.format(compra.total) : "—"}
                            </Box>

                            {/* Saldo si aplica */}
                            {!!(compra && (compra.saldo ?? 0) > 0) && (
                                <Box
                                    sx={{
                                        px: 1.25,
                                        py: 0.5,
                                        borderRadius: 999,
                                        fontSize: 12,
                                        fontWeight: 700,
                                        bgcolor: "rgba(239,68,68,.15)",
                                        color: "rgb(239,68,68)",
                                        border: "1px solid rgba(239,68,68,.35)",
                                    }}
                                >
                                    Saldo: {money.format(compra.saldo ?? 0)}
                                </Box>
                            )}
                        </Stack>
                    </Stack>

                    {/* Línea 2 con fecha */}
                    {compra?.fecha && (
                        <Typography variant="caption" sx={{ display: "block", mt: 1, opacity: 0.7 }}>
                            Fecha de compra: {new Date(compra.fecha).toLocaleString()}
                        </Typography>
                    )}
                </Box>

                {/* Detalle (tipo factura) */}
                <Typography sx={{ fontWeight: 700, mb: 1 }}>Productos</Typography>

                <Box
                    component="div"
                    sx={{
                        border: "1px solid var(--panel-border)",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    {/* Header tabla */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1fr 120px 160px 160px",
                            gap: 0,
                            px: 2,
                            py: 1.25,
                            bgcolor: "var(--table-head-bg)",
                            color: "var(--table-head-fg)",
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        <span>Referencia</span>
                        <span style={{ textAlign: "right" }}>Cantidad</span>
                        <span style={{ textAlign: "right" }}>Precio</span>
                        <span style={{ textAlign: "right" }}>Subtotal</span>
                    </Box>

                    {/* Body */}
                    {loadingDetalles ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <Box
                                key={i}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 120px 160px 160px",
                                    px: 2,
                                    py: 1.25,
                                    borderTop: "1px solid var(--panel-border)",
                                }}
                            >
                                <Box sx={{ height: 14, bgcolor: "black", opacity: 0.08, borderRadius: 1 }} />
                                <Box sx={{ height: 14, bgcolor: "black", opacity: 0.08, borderRadius: 1, ml: "auto", width: 60 }} />
                                <Box sx={{ height: 14, bgcolor: "black", opacity: 0.08, borderRadius: 1, ml: "auto", width: 90 }} />
                                <Box sx={{ height: 14, bgcolor: "black", opacity: 0.08, borderRadius: 1, ml: "auto", width: 90 }} />
                            </Box>
                        ))
                    ) : items.length === 0 ? (
                        <Box sx={{ px: 2, py: 3, textAlign: "center", color: "var(--tg-muted)" }}>Sin ítems</Box>
                    ) : (
                        items.map((it: DetalleCompraView, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 120px 160px 160px",
                                    px: 2,
                                    py: 1.25,
                                    borderTop: "1px solid var(--panel-border)",
                                    alignItems: "center",
                                }}
                            >
                                <Typography variant="body2">{it.producto_referencia}</Typography>
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    {it.cantidad}
                                </Typography>
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    {money.format(it.precio)}
                                </Typography>
                                <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 600 }}>
                                    {money.format(it.total)}
                                </Typography>
                            </Box>
                        ))
                    )}

                    {/* Footer totales */}
                    {!loadingDetalles && items.length > 0 && (
                        <>
                            <Divider sx={{ borderColor: "var(--panel-border)" }} />
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 120px 160px 160px",
                                    px: 2,
                                    py: 1.25,
                                    alignItems: "center",
                                    fontWeight: 700,
                                }}
                            >
                                <span />
                                <span />
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    Total
                                </Typography>
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    {compra ? money.format(compra.total) : "—"}
                                </Typography>
                            </Box>
                        </>
                    )}
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
