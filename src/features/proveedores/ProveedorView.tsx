"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Skeleton from "@mui/material/Skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Proveedor } from "@/types/proveedores";
import * as React from "react";

type Props = {
    open: boolean;
    onClose: () => void;
    proveedor: Proveedor | null;
    loading?: boolean;
};

export default function ProveedorView({ open, onClose, proveedor, loading }: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
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
            <DialogTitle sx={{ fontWeight: 600, pb: 1.5 }}>Detalle de proveedor</DialogTitle>

            <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>
                {loading ? (
                    <Stack gap={2}>
                        <Skeleton variant="rounded" height={64} />
                        <Skeleton variant="rounded" height={64} />
                        <Skeleton variant="rounded" height={64} />
                    </Stack>
                ) : !proveedor ? (
                    <Typography variant="body2" color="text.secondary">Sin datos</Typography>
                ) : (
                    <Stack gap={2}>
                        {/* Encabezado compacto */}
                        <Box
                            sx={{
                                p: 2,
                                borderRadius: 2,
                                border: "1px solid var(--tg-border)",
                                bgcolor: "color-mix(in srgb, var(--tg-card-bg) 92%, black 8%)",
                            }}
                        >
                            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={2}>
                                <Stack>
                                    <Typography variant="h6" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                        {proveedor.nombre}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: "var(--tg-muted)" }}>
                                        ID interno: {proveedor.id}
                                    </Typography>
                                </Stack>
                            </Stack>
                        </Box>

                        {/* Datos: Label: Valor */}
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <InfoInline label="CC/NIT" value={proveedor.cc_nit} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <InfoInline label="Ciudad" value={proveedor.ciudad} />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <InfoInline label="Correo" value={proveedor.correo || "—"} />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <InfoInline label="Celular" value={proveedor.celular || "—"} />
                            </Grid>

                            <Grid size={{ xs: 12 }}>
                                <InfoInline label="Dirección" value={proveedor.direccion} />
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                                <InfoInline
                                    label="Fecha de creación"
                                    value={format(new Date(proveedor.fecha_creacion), "dd MMM yyyy, HH:mm", { locale: es })}
                                />
                            </Grid>
                        </Grid>
                    </Stack>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function InfoInline({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <Box
            sx={{
                px: 1,
                py: 0.75,
                borderRadius: 1,
                bgcolor: "color-mix(in srgb, var(--tg-card-bg) 96%, black 4%)",
            }}
        >
            <Typography variant="body2" sx={{ display: "inline-flex", alignItems: "baseline", gap: 0.75 }}>
                <Box component="span" sx={{ fontWeight: 600, color: "var(--tg-muted)" }}>
                    {label}:
                </Box>
                <Box component="span" sx={{ wordBreak: "break-word" }}>
                    {value}
                </Box>
            </Typography>
        </Box>
    );
}