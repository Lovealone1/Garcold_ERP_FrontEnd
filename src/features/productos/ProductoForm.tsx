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
import type { ProductCreate, ProductUpdate } from "@/types/product";

export type ProductoAgregateDefaults = {
  referencia: string;
  descripcion: string;
  precio_unitario: number; 
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
  onSubmit?: (data: ProductCreate | ProductUpdate) => Promise<void> | void;

  defaults?: Partial<ProductCreate & ProductUpdate> | ProductoAgregateDefaults;

  variant?: "venta" | "compra";
  onConfirm?: (data: { precio_unitario: number; cantidad: number }) => void;
};
type FormState = {
  reference: string;
  description: string;
  quantity: number | "";         
  purchase_price: number | "";
  sale_price: number | "";
  is_active: boolean;
};

function isAgregateDefaults(d: Props["defaults"]): d is ProductoAgregateDefaults {
  return !!d && typeof (d as any).precio_unitario === "number";
}
const toNumber = (v: unknown, fb = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fb;
};

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
          ? ["reference", "description", "sale_price"]
          : ["reference", "description", "purchase_price"]
        : ["reference", "description", "purchase_price", "sale_price"],
    [isAgregate, variant]
  );

  function normalize(d?: Props["defaults"]): Partial<FormState> {
    if (!d) return {};
    if (isAgregateDefaults(d)) {
      const initialQty = Math.max(1, Math.min(toNumber(d.cantidad ?? 1), toNumber(d.stock ?? 0)));
      return {
        reference: d.referencia,
        description: d.descripcion,
        quantity: initialQty,
        ...(variant === "venta"
          ? { sale_price: d.precio_unitario }
          : { purchase_price: d.precio_unitario }),
      };
    }
    const x = d as any;
    return {
      reference: x.reference ?? x.referencia ?? "",
      description: x.description ?? x.descripcion ?? "",
      quantity: toNumber(x.quantity ?? x.cantidad, 0),
      purchase_price: toNumber(x.purchase_price ?? x.precio_compra),
      sale_price: toNumber(x.sale_price ?? x.precio_venta),
      is_active: (x.is_active ?? x.activo) ?? true,
    };
  }

  const [form, setForm] = useState<FormState>(() => ({
    reference: "",
    description: "",
    quantity: 0,
    purchase_price: "",
    sale_price: "",
    is_active: true,
    ...normalize(props.defaults),
  }));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setForm((f) => ({ ...f, ...normalize(props.defaults) }));
  }, [props.defaults, open, variant]);

  const stock = useMemo(() => {
    if (isAgregate && isAgregateDefaults(props.defaults)) return toNumber(props.defaults.stock, 0);
    return toNumber(form.quantity, 0);
  }, [isAgregate, props.defaults, form.quantity]);

  useEffect(() => {
    if (isAgregate && variant === "venta") {
      setForm((f) => {
        const q = toNumber(f.quantity, 1);
        const clamped = Math.max(1, Math.min(q, Math.max(0, stock)));
        return q === clamped ? f : { ...f, quantity: clamped };
      });
    }
  }, [stock, isAgregate, variant]);

  const setField =
    (k: keyof FormState) =>
      (e: ChangeEvent<HTMLInputElement>) => {
        if (k === "quantity") {
          const raw = e.target.value;                
          if (raw === "") {                          
            setForm((f) => ({ ...f, quantity: "" }));
            return;
          }
          const n = Number(raw);
          if (!Number.isFinite(n)) return;

          const next =
            isAgregate && variant === "venta"
              ? Math.max(0, Math.min(n, Math.max(stock, 0))) 
              : Math.max(0, n);

          setForm((f) => ({ ...f, quantity: next }));
          return;
        }
        const v = e.target.type === "number" ? Number(e.target.value) : e.target.value;
        setForm((f) => ({ ...f, [k]: v as any }));
      };

  const onQtyBlur = (_e: FocusEvent<HTMLInputElement>) => {
    if (form.quantity === "") return; 
    const n = toNumber(form.quantity, 0);
    if (isAgregate && variant === "venta") {
      const clamped = Math.max(1, Math.min(n, Math.max(0, stock)));
      setForm((f) => ({ ...f, quantity: clamped }));
    } else {
      setForm((f) => ({ ...f, quantity: Math.max(0, n) }));
    }
  };
  const qty = toNumber(form.quantity, 0);
  const qtyExceeds = isAgregate && variant === "venta" && qty > stock;
  const noStock = isAgregate && variant === "venta" && stock <= 0;

  const errors = useMemo(() => {
    const out: Partial<Record<keyof FormState, string>> = {};
    for (const k of REQUIRED_KEYS) {
      const val = (form as any)[k];
      if (submitted && (val === undefined || String(val ?? "").trim() === "")) out[k] = "Campo obligatorio";
    }
    if (isAgregate && variant === "venta") {
      if (qty < 1) out.quantity = "Cantidad debe ser mayor a 0";
      if (qty > stock) out.quantity = "No hay stock suficiente";
      if (stock <= 0) out.quantity = "Sin stock";
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
      const precio = variant === "venta" ? Number(form.sale_price || 0) : Number(form.purchase_price || 0);
      onConfirm({ precio_unitario: precio, cantidad: qty });
    }

    if (onSubmit) {
      const base: ProductCreate & ProductUpdate = {
        reference: form.reference.trim(),
        description: form.description.trim(),
        quantity: qty,
        purchase_price: Number(form.purchase_price || 0),
        sale_price: Number(form.sale_price || 0),
        is_active: !!form.is_active,
      };
      await onSubmit(base);
    }
  };

  const formNode = (
    <Box component="form" onSubmit={doSubmit}>
      <Stack gap={2.5}>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Referencia" required error={!!errors.reference}>
              <DynamicTextField
                id="reference"
                value={form.reference}
                onChange={setField("reference")}
                placeholder="REF-001"
                fullWidth
                slotProps={{ input: { readOnly: isAgregate } }}
              />
            </Field>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <Field label="Descripción" required error={!!errors.description}>
              <DynamicTextField
                id="description"
                value={form.description}
                onChange={setField("description")}
                placeholder="Descripción del producto"
                fullWidth
                slotProps={{ input: { readOnly: isAgregate } }}
              />
            </Field>
          </Grid>

          {isAgregate ? (
            <>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Stack direction="row" gap={2}>
                  <Box sx={{ flex: 1 }}>
                    <Field
                      label={noStock ? "Cantidad (sin stock)" : "Cantidad"}
                      required
                      error={!!errors.quantity || qtyExceeds || noStock}
                    >
                      <DynamicTextField
                        id="quantity"
                        fieldType="number"
                        value={(form.quantity as any) ?? 0}
                        onChange={setField("quantity")}
                        onBlur={onQtyBlur}
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
                      <DynamicTextField id="stock_disponible" fieldType="number" value={stock} fullWidth slotProps={{ input: { readOnly: true } }} />
                    </Field>
                  </Box>
                </Stack>
              </Grid>

              {variant === "venta" ? (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="Precio venta" required error={!!errors.sale_price}>
                    <DynamicTextField
                      id="sale_price"
                      fieldType="text"
                      value={form.sale_price as any}
                      onChange={setField("sale_price")}
                      fullWidth
                    />
                  </Field>
                </Grid>
              ) : (
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Field label="Precio compra" required error={!!errors.purchase_price}>
                    <DynamicTextField
                      id="purchase_price"
                      fieldType="text"
                      value={form.purchase_price as any}
                      onChange={setField("purchase_price")}
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
                    id="quantity"
                    fieldType="number"
                    value={(form.quantity as any) ?? 0}
                    onChange={setField("quantity")}
                    fullWidth
                  />
                </Field>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Field label="Precio compra" required error={!!errors.purchase_price}>
                  <DynamicTextField
                    id="purchase_price"
                    fieldType="text"
                    value={form.purchase_price as any}
                    onChange={setField("purchase_price")}
                    fullWidth
                  />
                </Field>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Field label="Precio venta" required error={!!errors.sale_price}>
                  <DynamicTextField
                    id="sale_price"
                    fieldType="text"
                    value={form.sale_price as any}
                    onChange={setField("sale_price")}
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
      <Box sx={{ p: 3, borderRadius: 2, border: "1px solid var(--panel-border)", bgcolor: "var(--tg-card-bg)", color: "var(--tg-card-fg)" }}>
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
      <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.2, color: error ? "error.main" : "var(--tg-muted)" }}>
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
