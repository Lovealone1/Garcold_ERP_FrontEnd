// features/productos/ProductoAgregate.tsx
"use client";

import { useState, ChangeEvent, FormEvent } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import DynamicTextField from "@/components/forms/DynamicTextField";

export type ProductoAgregateDefaults = {
    referencia: string;
    descripcion: string;
    precio_unitario: number; // editable
    cantidad: number;        // editable
    stock: number;           // readonly
    precio_compra: number;   // readonly
};

type Props = {
    open: boolean;
    onClose?: () => void;
    loading?: boolean;
    defaults: ProductoAgregateDefaults;
    onConfirm: (data: { precio_unitario: number; cantidad: number }) => Promise<void> | void;
};

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <Stack gap={0.75}>
            <Typography
                variant="caption"
                sx={{ fontWeight: 600, letterSpacing: 0.2, color: "var(--tg-muted)" }}
            >
                {label}
            </Typography>
            <Box
                sx={{
                    "& .MuiOutlinedInput-root": {
                        height: 44,
                        bgcolor: "color-mix(in srgb, var(--tg-card-bg) 90%, black 10%)",
                        color: "var(--tg-card-fg)",
                        borderRadius: "8px",
                        "& fieldset": { borderColor: "var(--tg-border)" },
                        "&:hover fieldset": { borderColor: "var(--tg-border)" },
                        "&.Mui-focused fieldset": { borderColor: "var(--tg-primary)" },
                    },
                    "& .MuiInputBase-input::placeholder": {
                        color: "var(--tg-placeholder, rgba(115,115,115,0.9))",
                        opacity: 1,
                    },
                    "& .MuiInputBase-input[readonly]": {
                        color: "var(--tg-muted) !important",
                        WebkitTextFillColor: "var(--tg-muted)",
                        cursor: "default",
                    },
                }}
            >
                {children}
            </Box>
        </Stack>
    );
}

export default function ProductoAgregate({
    open,
    onClose,
    loading = false,
    defaults,
    onConfirm,
}: Props) {
    const [precioUnit, setPrecioUnit] = useState<number>(defaults.precio_unitario);
    const [cantidad, setCantidad] = useState<number>(defaults.cantidad ?? 1);

    const handleSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        await onConfirm({
            precio_unitario: Number(precioUnit || 0),
            cantidad: Number(cantidad || 0),
        });
    };

    const onPrecioChange = (e: ChangeEvent<HTMLInputElement>) =>
        setPrecioUnit((e.target.value as any) === "" ? ("" as any) : Number(e.target.value));
    const onCantidadChange = (e: ChangeEvent<HTMLInputElement>) =>
        setCantidad((e.target.value as any) === "" ? 0 : Number(e.target.value));

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
            <DialogTitle sx={{ fontWeight: 600, pb: 1.5 }}>Agregar producto</DialogTitle>

            <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>
                <Box component="form" onSubmit={handleSubmit}>
                    <Stack gap={2.5}>
                        <Grid container spacing={2}>
                            {/* Fila 1: Referencia + Descripción (solo lectura) */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Labeled label="Referencia">
                                    <DynamicTextField
                                        id="ref"
                                        placeholder="Referencia"
                                        value={defaults.referencia}
                                        fullWidth
                                        slotProps={{ input: { inputProps: { readOnly: true } } }}
                                    />
                                </Labeled>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Labeled label="Descripción">
                                    <DynamicTextField
                                        id="desc"
                                        placeholder="Descripción"
                                        value={defaults.descripcion}
                                        fullWidth
                                        slotProps={{ input: { inputProps: { readOnly: true } } }}
                                    />
                                </Labeled>
                            </Grid>

                            {/* Fila 2: Precio unitario (editable) + Cantidad */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Labeled label="Precio unitario (editable)">
                                    <DynamicTextField
                                        id="precio_unitario"
                                        fieldType="text"
                                        placeholder="0"
                                        value={(precioUnit as any) ?? ""}
                                        onChange={onPrecioChange}
                                        fullWidth
                                        slotProps={{ input: { inputProps: { inputMode: "decimal" } } }}
                                    />
                                </Labeled>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Labeled label="Cantidad">
                                    <DynamicTextField
                                        id="cantidad"
                                        fieldType="number"
                                        placeholder="0"
                                        value={(cantidad as any) ?? 0}
                                        onChange={onCantidadChange}
                                        fullWidth
                                        slotProps={{ input: { inputProps: { step: 1, min: 0 } } }}
                                        sx={{
                                            "& .MuiInputBase-input": {
                                                color:
                                                    !cantidad || Number(cantidad) === 0
                                                        ? "var(--tg-placeholder, rgba(115,115,115,0.9))"
                                                        : "var(--tg-card-fg)",
                                            },
                                        }}
                                    />
                                </Labeled>
                            </Grid>

                            {/* Fila 3: Stock + Precio compra (solo lectura) */}
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Labeled label="Stock disponible">
                                    <DynamicTextField
                                        id="stock"
                                        placeholder="0"
                                        value={String(defaults.stock ?? 0)}
                                        fullWidth
                                        slotProps={{ input: { inputProps: { readOnly: true } } }}
                                    />
                                </Labeled>
                            </Grid>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <Labeled label="Precio compra (base)">
                                    <DynamicTextField
                                        id="precio_compra"
                                        placeholder="0"
                                        value={String(defaults.precio_compra ?? 0)}
                                        fullWidth
                                        slotProps={{ input: { inputProps: { readOnly: true } } }}
                                    />
                                </Labeled>
                            </Grid>
                        </Grid>
                    </Stack>
                </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit as any}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        textTransform: "none",
                        bgcolor: "var(--tg-primary)",
                        color: "var(--tg-primary-fg)",
                        "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                    }}
                >
                    Confirmar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
