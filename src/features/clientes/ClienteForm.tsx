"use client";

import { useMemo, useState, ChangeEvent, FormEvent, useEffect } from "react";
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
import type { CustomerCreate, CustomerUpdate } from "@/types/customer";

type Mode = "modal" | "page";

type CreateProps = {
  intent: "create";
  onSubmit: (data: CustomerCreate) => Promise<void> | void;
  defaults?: Partial<CustomerCreate>;
};
type EditProps = {
  intent: "edit";
  onSubmit: (data: CustomerUpdate) => Promise<void> | void;
  defaults?: Partial<CustomerUpdate>;
};
type Common = { mode?: Mode; open?: boolean; onClose?: () => void; loading?: boolean };
type Props = (CreateProps | EditProps) & Common;

const REQ = ["nombre", "cc_nit", "direccion", "ciudad"] as const;

function Labeled({
  label,
  required,
  error,
  helper,
  children,
}: {
  label: string;
  required?: boolean;
  error?: boolean;
  helper?: string;
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

type FormState = {
  nombre: string;
  cc_nit: string;
  correo?: string | null;
  celular?: string | null;
  direccion: string;
  ciudad: string;
  saldo: number | string;
};

export default function ClienteForm(props: Props) {
  const { mode = "modal", open = true, onClose, onSubmit, loading = false } = props;
  const isCreate = props.intent === "create";

  const [form, setForm] = useState<FormState>(() => ({
    nombre: "",
    cc_nit: "",
    correo: "",
    celular: "",
    direccion: "",
    ciudad: "",
    saldo: (props.defaults as any)?.balance ?? 0,
  }));
  const [submitted, setSubmitted] = useState(false);

  // Aplicar defaults del dominio nuevo (en inglés) al estado del formulario (en español)
  useEffect(() => {
    setForm((f) => ({
      ...f,
      nombre: (props.defaults as any)?.name ?? f.nombre,
      cc_nit: (props.defaults as any)?.tax_id ?? f.cc_nit,
      correo: (props.defaults as any)?.email ?? f.correo,
      celular: (props.defaults as any)?.phone ?? f.celular,
      direccion: (props.defaults as any)?.address ?? f.direccion,
      ciudad: (props.defaults as any)?.city ?? f.ciudad,
      saldo: (props.defaults as any)?.balance ?? f.saldo,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.defaults, open, isCreate]);

  const set =
    (k: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }));

  const setNumber =
    (k: keyof FormState) =>
    (e: ChangeEvent<HTMLInputElement>) =>
      setForm((f) => ({ ...f, [k]: (e.target.value as any) === "" ? "" : Number(e.target.value) }));

  const errors = useMemo(() => {
    const out: Partial<Record<keyof FormState, string>> = {};
    for (const k of REQ) if (submitted && !String((form as any)[k] ?? "").trim()) out[k] = "Campo obligatorio";
    if (submitted && form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) out.correo = "Correo inválido";
    if (submitted && form.saldo !== "" && Number(form.saldo) < 0) out.saldo = "No puede ser negativo";
    return out;
  }, [submitted, form]);

  const doSubmit = async (e?: FormEvent) => {
    e?.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length) return;

    // Mapear a payload en inglés
    const baseEn = {
      name: form.nombre.trim(),
      tax_id: form.cc_nit.trim(),
      email: form.correo?.trim() || null,
      phone: form.celular?.trim() || null,
      address: form.direccion.trim(),
      city: form.ciudad.trim(),
      balance: Number(form.saldo || 0),
    };

    if (isCreate) {
      await (onSubmit as CreateProps["onSubmit"])(baseEn as CustomerCreate);
    } else {
      await (onSubmit as EditProps["onSubmit"])(baseEn as CustomerUpdate);
    }
  };

  const fields = (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Labeled label="Nombre" required error={!!(errors as any).nombre}>
          <DynamicTextField id="nombre" placeholder="Nombre" value={form.nombre} onChange={set("nombre")} fullWidth />
        </Labeled>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Labeled label="CC/Nit" required error={!!(errors as any).cc_nit}>
          <DynamicTextField id="cc_nit" placeholder="CC/Nit" value={form.cc_nit} onChange={set("cc_nit")} fullWidth />
        </Labeled>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Labeled label="Correo" error={!!errors.correo} helper={errors.correo}>
          <DynamicTextField
            id="correo"
            fieldType="email"
            placeholder="nombre@correo.com"
            value={form.correo ?? ""}
            onChange={set("correo")}
            fullWidth
          />
        </Labeled>
      </Grid>
      <Grid size={{ xs: 12, md: 6 }}>
        <Labeled label="Celular">
          <DynamicTextField
            id="celular"
            fieldType="tel"
            placeholder="+57 300 000 0000"
            value={form.celular ?? ""}
            onChange={set("celular")}
            fullWidth
          />
        </Labeled>
      </Grid>

      <Grid size={{ xs: 12 }}>
        <Labeled label="Dirección" required error={!!(errors as any).direccion}>
          <DynamicTextField
            id="direccion"
            placeholder="Calle 1 # 2-34"
            value={form.direccion}
            onChange={set("direccion")}
            fullWidth
          />
        </Labeled>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Labeled label="Ciudad" required error={!!(errors as any).ciudad}>
          <DynamicTextField id="ciudad" placeholder="Ciudad" value={form.ciudad} onChange={set("ciudad")} fullWidth />
        </Labeled>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }}>
        <Labeled label="Saldo (COP)" error={!!errors.saldo} helper={errors.saldo}>
          <DynamicTextField
            id="saldo"
            fieldType="text"
            placeholder="0"
            value={form.saldo as any}
            onChange={setNumber("saldo")}
            fullWidth
            slotProps={{ input: { inputProps: { inputMode: "decimal", min: 0 } } }}
          />
        </Labeled>
      </Grid>
    </Grid>
  );

  const formNode = (
    <Box component="form" onSubmit={doSubmit}>
      <Stack gap={2.5}>{fields}</Stack>
    </Box>
  );

  return mode === "page" ? (
    <Box
      sx={{
        p: 3,
        borderRadius: 2,
        border: "1px solid var(--panel-border)",
        bgcolor: "var(--tg-card-bg)",
        color: "var(--tg-card-fg)",
      }}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        {isCreate ? "Nuevo Cliente" : "Editar Cliente"}
      </Typography>
      {formNode}
      <Stack direction="row" justifyContent="flex-end" gap={1.5} sx={{ pt: 2 }}>
        <Button onClick={onClose} disabled={loading} sx={{ textTransform: "none", color: "var(--tg-muted)" }}>
          Cancelar
        </Button>
        <Button
          type="submit"
          form={undefined as any}
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
          {loading ? "Guardando…" : isCreate ? "Crear cliente" : "Guardar cambios"}
        </Button>
      </Stack>
    </Box>
  ) : (
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
      <DialogTitle sx={{ fontWeight: 600, pb: 1.5 }}>{isCreate ? "Nuevo Cliente" : "Editar Cliente"}</DialogTitle>
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
          {loading ? "Guardando…" : isCreate ? "Crear cliente" : "Guardar cambios"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
