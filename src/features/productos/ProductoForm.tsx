// features/productos/ProductoForm.tsx
"use client";

import { useMemo, useState, useEffect, type ChangeEvent, type FormEvent, FocusEvent } from "react";
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

/** Defaults cuando se usa como modal de agregado (venta/compra) */
export type ProductoAgregateDefaults = {
    referencia: string;
    descripcion: string;
    precio_unitario: number; // venta: precio_venta inicial; compra: precio_compra inicial
    cantidad: number;
    stock: number;
    precio_compra: number;
};

type Mode = "modal" | "page";

type Props = {
    mode?: Mode;
    open?: boolean;
    onClose?: () => void;
    loading?: boolean;

    intent?: "create" | "edit";
    onSubmit?: (data: ProductoCreate | ProductoUpdate) => Promise<void> | void;

    defaults?: Partial<ProductoCreate & ProductoUpdate> | ProductoAgregateDefaults;

    /** Si se define, actúa como formulario de agregado */
    variant?: "venta" | "compra";
    onConfirm?: (data: { precio_unitario: number; cantidad: number }) => void;
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
function toNumber(v: unknown, fallback = 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}

export default function ProductoForm(props: Props) {
    const { mode = "modal", open = true, onClose, onSubmit, loading = false, onConfirm, variant } = props;

    const isCreate = props.intent === "create";
    const isAgregate = !!variant;

    const titleLabel = isAgregate ? `Agregar a ${variant}` : isCreate ? "Nuevo Producto" : "Editar Producto";
    const primaryLabel = isAgregate ? `Agregar a ${variant}` : isCreate ? "Crear producto" : "Guardar cambios";

    const REQUIRED_KEYS = useMemo<(keyof FormState)[]>(
        () =>
            isAgregate
                ? variant === "venta"
                    ? ["referencia", "descripcion", "precio_venta"]
                    : ["referencia", "descripcion", "precio_compra"]
                : ["referencia", "descripcion", "precio_compra", "precio_venta"],
        [isAgregate, variant]
    );

    function normalize(d?: Props["defaults"]): Partial<FormState> {
        if (!d) return {};
        if (isAgregateDefaults(d)) {
            const initialQty = Math.max(1, Math.min(toNumber(d.cantidad ?? 1), toNumber(d.stock ?? 0)));
            return {
                referencia: d.referencia,
                descripcion: d.descripcion,
                cantidad: initialQty,
                ...(variant === "venta" ? { precio_venta: d.precio_unitario } : { precio_compra: d.precio_unitario }),
            };
        }
        return {
            referencia: (d as any).referencia ?? "",
            descripcion: (d as any).descripcion ?? "",
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
    }, [props.defaults, open, variant]);

    // STOCK fuente de verdad
    const stock = useMemo(() => {
        if (isAgregate && isAgregateDefaults(props.defaults)) return toNumber(props.defaults.stock, 0);
        return toNumber(form.cantidad, 0); // CRUD: cantidad = stock
    }, [isAgregate, props.defaults, form.cantidad]);

    // si cambia stock, asegura cantidad válida
    useEffect(() => {
        if (isAgregate && variant === "venta") {
            setForm((f) => {
                const q = toNumber(f.cantidad, 1);
                const clamped = Math.max(1, Math.min(q, Math.max(0, stock)));
                return q === clamped ? f : { ...f, cantidad: clamped };
            });
        }
    }, [stock, isAgregate, variant]);

    // set con clamp + blur seguro para cantidad
    const setField =
        (k: keyof FormState) =>
            (e: ChangeEvent<HTMLInputElement>) => {
                if (k === "cantidad") {
                    const raw = Number(e.target.value);
                    const n = Number.isFinite(raw) ? raw : 0;
                    const clamped =
                        isAgregate && variant === "venta" ? Math.max(1, Math.min(n, Math.max(stock, 0))) : Math.max(0, n);
                    setForm((f) => ({ ...f, cantidad: clamped }));
                    return;
                }
                setForm((f) => ({
                    ...f,
                    [k]: e.target.type === "number" ? Number(e.target.value) : e.target.value,
                }));
            };

    const onCantidadBlur = (_e: FocusEvent<HTMLInputElement>) => {
        if (!(isAgregate && variant === "venta")) return;
        setForm((f) => {
            const n = toNumber(f.cantidad, 1);
            const clamped = Math.max(1, Math.min(n, Math.max(0, stock)));
            return n === clamped ? f : { ...f, cantidad: clamped };
        });
    };

    // errores
    const qty = toNumber(form.cantidad, 0);
    const qtyExceeds = isAgregate && variant === "venta" && qty > stock;
    const noStock = isAgregate && variant === "venta" && stock <= 0;

    const errors = useMemo(() => {
        const out: Partial<Record<keyof FormState, string>> = {};
        for (const k of REQUIRED_KEYS) {
            const val = (form as any)[k];
            if (submitted && (val === undefined || String(val ?? "").trim() === "")) out[k] = "Campo obligatorio";
        }
        if (isAgregate && variant === "venta") {
            if (qty < 1) out.cantidad = "Cantidad debe ser mayor a 0";
            if (qty > stock) out.cantidad = "No hay stock suficiente";
            if (stock <= 0) out.cantidad = "Sin stock";
        }
        return out;
    }, [submitted, form, REQUIRED_KEYS, isAgregate, variant, qty, stock]);

    const primaryDisabled =
        loading ||
        (isAgregate && variant === "venta" && (noStock || qtyExceeds || qty < 1)) ||
        (submitted && Object.keys(errors).length > 0);

    const doSubmit = async (e?: FormEvent) => {
        e?.preventDefault();
        setSubmitted(true);
        if (primaryDisabled) return;

        if (isAgregate && onConfirm) {
            const precio = variant === "venta" ? Number(form.precio_venta) : Number(form.precio_compra);
            onConfirm({ precio_unitario: precio, cantidad: qty });
        }

        if (onSubmit) {
            const base: ProductoCreate & ProductoUpdate = {
                referencia: form.referencia.trim(),
                descripcion: form.descripcion.trim(),
                cantidad: qty,
                precio_compra: Number(form.precio_compra || 0),
                precio_venta: Number(form.precio_venta || 0),
                activo: !!form.activo,
            };
            await onSubmit(base);
        }
    };

    const formNode = (
        <Box component="form" onSubmit={doSubmit}>
            <Stack gap={2.5}>
                <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field label="Referencia" required error={!!errors.referencia}>
                            <DynamicTextField
                                id="referencia"
                                value={form.referencia}
                                onChange={setField("referencia")}
                                placeholder="REF-001"
                                fullWidth
                                slotProps={{ input: { readOnly: isAgregate } }}
                            />
                        </Field>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6 }}>
                        <Field label="Descripción" required error={!!errors.descripcion}>
                            <DynamicTextField
                                id="descripcion"
                                value={form.descripcion}
                                onChange={setField("descripcion")}
                                placeholder="Descripción del producto"
                                fullWidth
                                slotProps={{ input: { readOnly: isAgregate } }}
                            />
                        </Field>
                    </Grid>

                    {isAgregate ? (
                        <>
                            {/* Cantidad + Stock en el mismo grid */}
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <Stack direction="row" gap={2}>
                                    <Box sx={{ flex: 1 }}>
                                        <Field
                                            label={noStock ? "Cantidad (sin stock)" : "Cantidad"}
                                            required
                                            error={!!errors.cantidad || qtyExceeds || noStock}
                                        >
                                            <DynamicTextField
                                                id="cantidad"
                                                fieldType="number"
                                                value={(form.cantidad as any) ?? 0}
                                                onChange={setField("cantidad")}
                                                onBlur={onCantidadBlur}
                                                fullWidth
                                                disabled={noStock}
                                                slotProps={{
                                                    input: {
                                                        inputProps: {
                                                            step: 1,
                                                            min: 1,
                                                            ...(variant === "venta" ? { max: Math.max(0, stock) } : {}),
                                                        },
                                                        readOnly: noStock,
                                                        "aria-invalid": qtyExceeds || noStock ? true : undefined,
                                                    },
                                                }}
                                            />
                                        </Field>
                                        <Typography variant="caption" sx={{ color: "var(--tg-muted)", mt: 0.5, display: "block" }}>
                                            {noStock
                                                ? "Sin stock disponible"
                                                : `${Math.max(qty, 0)} de ${stock} • Restan ${Math.max(stock - qty, 0)}`}
                                        </Typography>
                                    </Box>

                                    <Box sx={{ flex: 1 }}>
                                        <Field label="Stock disponible">
                                            <DynamicTextField
                                                id="stock_disponible"
                                                fieldType="number"
                                                value={stock}
                                                fullWidth
                                                slotProps={{ input: { readOnly: true } }}
                                            />
                                        </Field>
                                    </Box>
                                </Stack>
                            </Grid>

                            {variant === "venta" ? (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Field label="Precio venta" required error={!!errors.precio_venta}>
                                        <DynamicTextField
                                            id="precio_venta"
                                            fieldType="text"
                                            value={form.precio_venta as any}
                                            onChange={setField("precio_venta")}
                                            fullWidth
                                        />
                                    </Field>
                                </Grid>
                            ) : (
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Field label="Precio compra" required error={!!errors.precio_compra}>
                                        <DynamicTextField
                                            id="precio_compra"
                                            fieldType="text"
                                            value={form.precio_compra as any}
                                            onChange={setField("precio_compra")}
                                            fullWidth
                                        />
                                    </Field>
                                </Grid>
                            )}
                        </>
                    ) : (
                        <>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Field label="Stock">
                                    <DynamicTextField
                                        id="cantidad"
                                        fieldType="number"
                                        value={(form.cantidad as any) ?? 0}
                                        onChange={setField("cantidad")}
                                        fullWidth
                                    />
                                </Field>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Field label="Precio compra" required error={!!errors.precio_compra}>
                                    <DynamicTextField
                                        id="precio_compra"
                                        fieldType="text"
                                        value={form.precio_compra as any}
                                        onChange={setField("precio_compra")}
                                        fullWidth
                                    />
                                </Field>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 4 }}>
                                <Field label="Precio venta" required error={!!errors.precio_venta}>
                                    <DynamicTextField
                                        id="precio_venta"
                                        fieldType="text"
                                        value={form.precio_venta as any}
                                        onChange={setField("precio_venta")}
                                        fullWidth
                                    />
                                </Field>
                            </Grid>
                        </>
                    )}
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
                        disabled={primaryDisabled}
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
                    disabled={primaryDisabled}
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