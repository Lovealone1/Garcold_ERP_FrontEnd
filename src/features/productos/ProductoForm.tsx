"use client";

import { useMemo, useState, useEffect, ChangeEvent, FormEvent } from "react";
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
import type { ProductoCreate, ProductoUpdate } from "@/types/productos";

/** Para el flujo “agregar a venta” */
export type ProductoAgregateDefaults = {
    referencia: string;
    descripcion: string;
    precio_unitario: number;
    cantidad: number;
    stock: number;
    precio_compra: number;
};

type Mode = "modal" | "page";

/** Props flexibles: CRUD o agregado a venta */
type Props = {
    mode?: Mode;
    open?: boolean;
    onClose?: () => void;
    loading?: boolean;

    /** Crear/editar productos (opcional si solo se usa como agregado) */
    intent?: "create" | "edit";
    onSubmit?: (data: ProductoCreate | ProductoUpdate) => Promise<void> | void;

    /** Defaults de CRUD o del agregado */
    defaults?: Partial<ProductoCreate & ProductoUpdate> | ProductoAgregateDefaults;

    /** Flujo “agregar a venta” */
    onConfirm?: (data: { precio_unitario: number; cantidad: number }) => void;

    /** Forzar textos de “agregar a venta” (título y botón principal) */
    addToSale?: boolean;
};

type FormState = {
    referencia: string;
    descripcion: string;
    cantidad?: number | null;
    precio_compra: number | string;
    precio_venta: number | string;
    activo: boolean;
};

function isAgregateDefaults(d: Props["defaults"]): d is ProductoAgregateDefaults {
    return !!d && typeof (d as any).precio_unitario === "number";
}

export default function ProductoForm(props: Props) {
    const {
        mode = "modal",
        open = true,
        onClose,
        onSubmit,
        loading = false,
        onConfirm,
        addToSale = false,
    } = props;
    const isCreate = props.intent === "create";

    // Etiquetas dinámicas
    const titleLabel = addToSale ? "Agregar a venta" : isCreate ? "Nuevo Producto" : "Editar Producto";
    const primaryLabel = addToSale ? "Agregar producto" : isCreate ? "Crear producto" : "Guardar cambios";

    // Reglas de requeridos (en addToSale NO pedimos precio_compra)
    const REQUIRED_KEYS = useMemo<(keyof FormState)[]>(
        () => (addToSale ? ["referencia", "descripcion", "precio_venta"] : ["referencia", "descripcion", "precio_compra", "precio_venta"]),
        [addToSale]
    );

    // Normaliza defaults de ambos mundos (CRUD y agregado)
    function normalize(d?: Props["defaults"]): Partial<FormState> {
        if (!d) return {};
        if (isAgregateDefaults(d)) {
            return {
                referencia: d.referencia,
                descripcion: d.descripcion,
                cantidad: d.cantidad,
                precio_compra: d.precio_compra,
                precio_venta: d.precio_unitario, // mapeo
            };
        }
        return {
            referencia: d.referencia ?? "",
            descripcion: d.descripcion ?? "",
            cantidad: (d as any).cantidad ?? 0,
            precio_compra: (d as any).precio_compra ?? "",
            precio_venta: (d as any).precio_venta ?? "",
            activo: (d as any).activo ?? true,
        };
    }

    const [form, setForm] = useState<FormState>(() => ({
        referencia: "",
        descripcion: "",
        cantidad: 0,
        precio_compra: "",
        precio_venta: "",
        activo: true,
        ...normalize(props.defaults),
    }));
    const [submitted, setSubmitted] = useState(false);

    useEffect(() => {
        setForm((f) => ({ ...f, ...normalize(props.defaults) }));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.defaults, open]);

    const set =
        (k: keyof FormState) =>
            (e: ChangeEvent<HTMLInputElement>) =>
                setForm((f) => ({
                    ...f,
                    [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value,
                }));

    const errors = useMemo(() => {
        const out: Partial<Record<keyof FormState, string>> = {};
        for (const k of REQUIRED_KEYS) {
            const val = (form as any)[k];
            if (submitted && (val === undefined || String(val ?? "").toString().trim() === "")) {
                out[k] = "Campo obligatorio";
            }
        }
        return out;
    }, [submitted, form, REQUIRED_KEYS]);

    const doSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        setSubmitted(true);
        if (Object.keys(errors).length) return;

        const base: ProductoCreate & ProductoUpdate = {
            referencia: form.referencia.trim(),
            descripcion: form.descripcion.trim(),
            cantidad: Number(form.cantidad ?? 0),
            precio_compra: Number(form.precio_compra),
            precio_venta: Number(form.precio_venta),
            activo: !!form.activo,
        };

        // callback para flujo de agregado
        onConfirm?.({
            precio_unitario: Number(form.precio_venta),
            cantidad: Number(form.cantidad ?? 0),
        });

        // CRUD si corresponde
        if (onSubmit) await onSubmit(base);
    };

    const formNode = (
        <Box component="form" onSubmit={doSubmit}>
            <Stack gap={2.5}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Field label="Referencia" required error={!!errors.referencia}>
                            <DynamicTextField
                                id="referencia"
                                value={form.referencia}
                                onChange={set("referencia")}
                                placeholder="REF-001"
                                fullWidth
                            />
                        </Field>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Field label="Descripción" required error={!!errors.descripcion}>
                            <DynamicTextField
                                id="descripcion"
                                value={form.descripcion}
                                onChange={set("descripcion")}
                                placeholder="Descripción del producto"
                                fullWidth
                            />
                        </Field>
                    </Grid>

                    {/* Ocultar STOCK y PRECIO COMPRA cuando es addToSale */}
                    {!addToSale && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Field label="Stock">
                                <DynamicTextField
                                    id="cantidad"
                                    fieldType="number"
                                    value={(form.cantidad as any) ?? 0}
                                    onChange={set("cantidad")}
                                    fullWidth
                                />
                            </Field>
                        </Grid>
                    )}
                    {!addToSale && (
                        <Grid size={{ xs: 12, md: 4 }}>
                            <Field label="Precio compra" required error={!!errors.precio_compra}>
                                <DynamicTextField
                                    id="precio_compra"
                                    fieldType="text"
                                    value={form.precio_compra as any}
                                    onChange={set("precio_compra")}
                                    fullWidth
                                />
                            </Field>
                        </Grid>
                    )}

                    {/* Precio venta ocupa todo el ancho cuando addToSale */}
                    <Grid size={{ xs: 12, md: addToSale ? 12 : 4 }}>
                        <Field label="Precio venta" required error={!!errors.precio_venta}>
                            <DynamicTextField
                                id="precio_venta"
                                fieldType="text"
                                value={form.precio_venta as any}
                                onChange={set("precio_venta")}
                                fullWidth
                            />
                        </Field>
                    </Grid>
                </Grid>
            </Stack>
        </Box>
    );

    if (mode === "page") {
        return (
            <Box
                sx={{
                    p: 3,
                    borderRadius: 2,
                    border: "1px solid var(--panel-border)",
                    bgcolor: "var(--tg-card-bg)",
                    color: "var(--tg-card-fg)",
                }}
            >
                {formNode}
                <Stack direction="row" justifyContent="flex-end" gap={1.5} sx={{ pt: 2 }}>
                    <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={doSubmit as any}
                        variant="contained"
                        disabled={loading}
                        sx={{
                            textTransform: "none",
                            bgcolor: "var(--tg-primary)",
                            color: "var(--tg-primary-fg)",
                            "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                        }}
                    >
                        {loading ? "Guardando…" : primaryLabel}
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
            <DialogTitle sx={{ fontWeight: 600, pb: 1.5 }}>{titleLabel}</DialogTitle>
            <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>{formNode}</DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
                    Cancelar
                </Button>
                <Button
                    onClick={doSubmit as any}
                    variant="contained"
                    disabled={loading}
                    sx={{
                        textTransform: "none",
                        bgcolor: "var(--tg-primary)",
                        color: "var(--tg-primary-fg)",
                        "&:hover": { bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)" },
                    }}
                >
                    {loading ? "Guardando…" : primaryLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

function Field({
    label,
    required,
    error,
    children,
}: {
    label: string;
    required?: boolean;
    error?: boolean;
    children: React.ReactNode;
}) {
    return (
        <Stack gap={0.75}>
            <Typography
                variant="caption"
                sx={{ fontWeight: 600, letterSpacing: 0.2, color: error ? "error.main" : "var(--tg-muted)" }}
            >
                {label} {required ? "*" : ""}
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
                }}
            >
                {children}
            </Box>
        </Stack>
    );
}
