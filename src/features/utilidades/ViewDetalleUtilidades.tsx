// features/ventas/UtilidadView.tsx
"use client";

import { useMemo } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";

import { useVenta } from "@/hooks/ventas/useVenta";
import { useProfitDetails } from "@/hooks/utilidades/useDetallesUtilidad";
import type { ProfitDetail } from "@/types/profit";

type Props = {
    open: boolean;
    onClose: () => void;
    ventaId: number | null;
};

const money = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
});

export default function UtilidadView({ open, onClose, ventaId }: Props) {
    const { venta, loading: loadingVenta } = useVenta(open ? ventaId : null);

    // ⬇️ refactor: llamado al nuevo hook
    const { details, loading: loadingDet } = useProfitDetails(ventaId, {
        enabled: open && !!ventaId,
    });

    // ⬇️ refactor: campos en inglés
    const totalUtilidad = useMemo(
        () => details.reduce((acc, d) => acc + (d.profit_total ?? 0), 0),
        [details]
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
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                {ventaId ? `Detalle de utilidad — Venta #${ventaId}` : "Detalle de utilidad"}
            </DialogTitle>

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
                                {venta?.customer ?? (loadingVenta ? "Cargando…" : "—")}
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8, display: "block" }}>
                                ID venta: {venta?.id ?? (loadingVenta ? "…" : "—")}
                            </Typography>
                            {venta?.created_at && (
                                <Typography variant="caption" sx={{ opacity: 0.7, display: "block", mt: 0.5 }}>
                                    Fecha: {new Date(venta.created_at).toLocaleString()}
                                </Typography>
                            )}
                        </Box>

                        {/* Totales rápidos */}
                        <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="flex-end">
                            <ChipBox label="Total:" color="rgb(59,130,246)" bg="rgba(59,130,246,.15)">
                                {venta ? money.format(venta.total) : "—"}
                            </ChipBox>
                            <ChipBox label="Utilidad:" color="rgb(22,163,74)" bg="rgba(22,163,74,.15)">
                                {money.format(totalUtilidad)}
                            </ChipBox>
                        </Stack>
                    </Stack>
                </Box>

                {/* Tabla de detalles */}
                <Typography sx={{ fontWeight: 700, mb: 1 }}>Detalle de utilidad</Typography>

                <Box
                    component="div"
                    sx={{
                        border: "1px solid var(--panel-border)",
                        borderRadius: 2,
                        overflow: "hidden",
                    }}
                >
                    {/* Header */}
                    <Box
                        sx={{
                            display: "grid",
                            gridTemplateColumns: "1.6fr 0.6fr 0.6fr 0.5fr 0.7fr",
                            px: 2,
                            py: 1.25,
                            bgcolor: "var(--table-head-bg)",
                            color: "var(--table-head-fg)",
                            fontSize: 13,
                            fontWeight: 600,
                        }}
                    >
                        <span>Descripción</span>
                        <span style={{ textAlign: "right" }}>Precio compra</span>
                        <span style={{ textAlign: "right" }}>Precio venta</span>
                        <span style={{ textAlign: "right" }}>Cant.</span>
                        <span style={{ textAlign: "right" }}>Utilidad</span>
                    </Box>

                    {/* Body */}
                    {loadingDet ? (
                        Array.from({ length: 4 }).map((_, i) => <RowSkeleton key={i} />)
                    ) : details.length === 0 ? (
                        <Box sx={{ px: 2, py: 3, textAlign: "center", color: "var(--tg-muted)" }}>
                            Sin detalles de utilidad
                        </Box>
                    ) : (
                        details.map((d: ProfitDetail, idx) => (
                            <Box
                                key={idx}
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1.6fr 0.6fr 0.6fr 0.5fr 0.7fr",
                                    px: 2,
                                    py: 1.1,
                                    borderTop: "1px solid var(--panel-border)",
                                    alignItems: "center",
                                }}
                            >
                                <Typography variant="body2">
                                    {d.reference ? `${d.reference} — ` : ""}
                                    {d.description ?? ""}
                                </Typography>
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    {money.format(d.purchase_price)}
                                </Typography>
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    {money.format(d.sale_price)}
                                </Typography>
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    {d.quantity}
                                </Typography>
                                <Typography variant="body2" sx={{ textAlign: "right", fontWeight: 600 }}>
                                    {money.format(d.profit_total)}
                                </Typography>
                            </Box>
                        ))
                    )}

                    {/* Footer total */}
                    {!loadingDet && details.length > 0 && (
                        <>
                            <Divider sx={{ borderColor: "var(--panel-border)" }} />
                            <Box
                                sx={{
                                    display: "grid",
                                    gridTemplateColumns: "1.6fr 0.6fr 0.6fr 0.5fr 0.7fr",
                                    px: 2,
                                    py: 1.2,
                                    alignItems: "center",
                                    fontWeight: 700,
                                }}
                            >
                                <span />
                                <span />
                                <span />
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    Total
                                </Typography>
                                <Typography variant="body2" sx={{ textAlign: "right" }}>
                                    {money.format(totalUtilidad)}
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

/* Helpers UI */
function ChipBox({
    label,
    color,
    bg,
    children,
}: {
    label: string;
    color: string;
    bg: string;
    children: React.ReactNode;
}) {
    return (
        <Box
            sx={{
                px: 1.25,
                py: 0.5,
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
                bgcolor: bg,
                color,
                display: "inline-flex",
                alignItems: "center",
                gap: 0.5,
                border: `1px solid ${color.replace("rgb", "rgba").replace(")", ",.35)")}`,
            }}
            title={label}
        >
            <span style={{ opacity: 0.9 }}>{label}</span>
            <span>{children}</span>
        </Box>
    );
}

function RowSkeleton() {
    return (
        <Box
            sx={{
                display: "grid",
                gridTemplateColumns: "1.6fr 0.6fr 0.6fr 0.5fr 0.7fr",
                px: 2,
                py: 1.1,
                borderTop: "1px solid var(--panel-border)",
                gap: 2,
                alignItems: "center",
            }}
        >
            {[200, 90, 90, 40, 100].map((w, i) => (
                <Box
                    key={i}
                    sx={{
                        height: 14,
                        width: w,
                        maxWidth: "100%",
                        bgcolor: "black",
                        opacity: 0.08,
                        borderRadius: 1,
                        ml: i > 0 ? "auto" : 0,
                    }}
                />
            ))}
        </Box>
    );
}
