// features/productos/ProductCreate.tsx
"use client";

import { useMemo, useState, ChangeEvent, FormEvent } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import DynamicTextField from "@/components/forms/DynamicTextField";

export type NuevoProducto = {
    referencia: string;
    descripcion: string;
    cantidad?: number | null;
    precio_compra: number;
    precio_venta: number;
    activo: boolean;
};

type Mode = "modal" | "page";
type Props = {
    mode?: Mode;
    open?: boolean;
    onClose?: () => void;
    onSubmit: (data: NuevoProducto) => Promise<void> | void;
    loading?: boolean;
    defaults?: Partial<NuevoProducto>;
};

const REQ = ["referencia", "descripcion", "precio_compra", "precio_venta"] as const;

function Labeled({
    label,
    error,
    helper,
    children,
}: {
    label: string;
    error?: boolean;
    helper?: string;
    children: React.ReactNode;
}) {
    return (
        <Stack gap={0.75}>
            <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.2, color: error ? "error.main" : "var(--tg-muted)" }}>
                {label}
            </Typography>
            <Box
                sx={{
                    "& .MuiOutlinedInput-root": {
                        height: 44,
                        bgcolor: "color-mix(in srgb, var(--tg-card-bg) 90%, black 10%)",
                        color: "var(--tg-card-fg)",
                        borderRadius: "8px",
                        "& fieldset": { borderColor: error ? "error.main" : "var(--tg-border)" },
                        "&:hover fieldset": { borderColor: error ? "error.main" : "var(--tg-border)" },
                        "&.Mui-focused fieldset": { borderColor: error ? "error.main" : "var(--tg-primary)" },
                    },
                    "& .MuiInputBase-input::placeholder": {
                        color: "var(--tg-placeholder, rgba(115,115,115,0.9))",
                        opacity: 1,
                    },
                }}
            >
                {children}
            </Box>
            {error && (
                <Typography variant="caption" sx={{ color: "error.main" }}>
                    {helper || "Campo obligatorio"}
                </Typography>
            )}
        </Stack>
    );
}

export default function ProductCreate({
    mode = "modal",
    open = true,
    onClose,
    onSubmit,
    loading = false,
    defaults = { activo: true, cantidad: 0 },
}: Props) {
    const [submitted, setSubmitted] = useState(false);
    const [form, setForm] = useState<NuevoProducto>(() => ({
        referencia: "",
        descripcion: "",
        cantidad: 0,
        precio_compra: undefined as unknown as number,
        precio_venta: undefined as unknown as number,
        activo: true,
        ...defaults,
    }));

    const set =
        (k: keyof NuevoProducto) =>
            (e: ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({ ...f, [k]: e.target.value as any }));

    const errors = useMemo(() => {
        const e: Partial<Record<keyof NuevoProducto, string>> = {};
        if (submitted) {
            if (!form.referencia?.trim()) e.referencia = "Campo obligatorio";
            if (!form.descripcion?.trim()) e.descripcion = "Campo obligatorio";
            if (form.precio_compra === undefined || String(form.precio_compra).trim() === "") e.precio_compra = "Campo obligatorio";
            if (form.precio_venta === undefined || String(form.precio_venta).trim() === "") e.precio_venta = "Campo obligatorio";
        }
        return e;
    }, [submitted, form]);

    const doSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        setSubmitted(true);
        if (Object.keys(errors).length) return;

        await onSubmit({
            referencia: form.referencia.trim(),
            descripcion: form.descripcion.trim(),
            cantidad: Number(form.cantidad || 0),
            precio_compra: Number((form.precio_compra as any) ?? 0),
            precio_venta: Number((form.precio_venta as any) ?? 0),
            activo: !!form.activo,
        });
    };

    const fields = (
        <Grid container spacing={2}>
            {/* Referencia */}
            <Grid size={{ xs: 12 }}>
                <Labeled label="Referencia" error={!!errors.referencia}>
                    <DynamicTextField id="referencia" placeholder="Referencia" value={form.referencia} onChange={set("referencia")} fullWidth />
                </Labeled>
            </Grid>

            {/* Descripción */}
            <Grid size={{ xs: 12 }}>
                <Labeled label="Descripción" error={!!errors.descripcion}>
                    <DynamicTextField id="descripcion" placeholder="Descripción" value={form.descripcion} onChange={set("descripcion")} fullWidth />
                </Labeled>
            </Grid>

            {/* Precios */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Labeled label="Precio compra" error={!!errors.precio_compra}>
                    <DynamicTextField
                        id="precio_compra"
                        fieldType="text"
                        inputProps={{ inputMode: "decimal" }}
                        placeholder="0"
                        value={(form.precio_compra as any) ?? ""}
                        onChange={set("precio_compra")}
                        fullWidth
                    />
                </Labeled>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <Labeled label="Precio venta" error={!!errors.precio_venta}>
                    <DynamicTextField
                        id="precio_venta"
                        fieldType="text"
                        inputProps={{ inputMode: "decimal" }}
                        placeholder="0"
                        value={(form.precio_venta as any) ?? ""}
                        onChange={set("precio_venta")}
                        fullWidth
                    />
                </Labeled>
            </Grid>

            {/* Cantidad + Activo */}
            <Grid size={{ xs: 12, md: 8 }}>
                <Labeled label="Cantidad">
                    <DynamicTextField
                        id="cantidad"
                        fieldType="number"
                        inputProps={{ step: 10 }}
                        placeholder="0"
                        value={(form.cantidad ?? 0) as any}
                        onChange={set("cantidad")}
                        fullWidth
                        sx={{
                            // Si cantidad es 0 o vacío, pinta como placeholder
                            "& .MuiInputBase-input": {
                                color:
                                    !form.cantidad || Number(form.cantidad) === 0
                                        ? "var(--tg-placeholder, rgba(115,115,115,0.9))"
                                        : "var(--tg-card-fg)",
                            },
                        }}
                    />
                </Labeled>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="caption" sx={{ visibility: "hidden" }}>
                    spacer
                </Typography>
                <Box sx={{ height: 44, display: "flex", alignItems: "center" }}>
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={!!form.activo}
                                onChange={(e) => setForm((f) => ({ ...f, activo: e.target.checked }))}
                                sx={{ color: "var(--tg-muted)", "&.Mui-checked": { color: "var(--tg-primary)" } }}
                            />
                        }
                        label={<Typography variant="caption" sx={{ color: "var(--tg-muted)", fontWeight: 600 }}>Activo</Typography>}
                    />
                </Box>
            </Grid>
        </Grid>
    );

    const formNode = (
        <Box component="form" onSubmit={doSubmit}>
            <Stack gap={2.5}>{fields}</Stack>
        </Box>
    );

    if (mode === "page") {
        return (
            <Box sx={{ p: 3, borderRadius: 2, border: "1px solid var(--panel-border)", bgcolor: "var(--tg-card-bg)", color: "var(--tg-card-fg)", maxWidth: 640 }}>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                    Nuevo Producto
                </Typography>
                {formNode}
                <Stack direction="row" justifyContent="flex-end" gap={1.5} sx={{ pt: 2 }}>
                    <Button onClick={onClose} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" disabled={loading} sx={{ textTransform: "none", bgcolor: "var(--tg-primary)", color: "var(--tg-primary-fg)" }}>
                        {loading ? "Guardando…" : "Crear producto"}
                    </Button>
                </Stack>
            </Box>
        );
    }

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
            <DialogTitle sx={{ fontWeight: 600, pb: 1.5 }}>Nuevo Producto</DialogTitle>
            <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>{formNode}</DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                    Cancelar
                </Button>
                <Button onClick={doSubmit as any} variant="contained" disabled={loading} sx={{ textTransform: "none", bgcolor: "var(--tg-primary)", color: "var(--tg-primary-fg)" }}>
                    {loading ? "Guardando…" : "Crear producto"}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
