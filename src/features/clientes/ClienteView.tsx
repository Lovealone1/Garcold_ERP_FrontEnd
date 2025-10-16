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
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { Customer } from "@/types/customer";
import * as React from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  cliente: Customer | null;
  loading?: boolean;
};

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function ClienteView({ open, onClose, cliente, loading }: Props) {
  const hasSaldo = (cliente?.balance ?? 0) !== 0;

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
      <DialogTitle sx={{ fontWeight: 600, pb: 1.5 }}>Detalle de cliente</DialogTitle>

      <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>
        {loading ? (
          <Stack gap={2}>
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} />
          </Stack>
        ) : !cliente ? (
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
                    {cliente.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--tg-muted)" }}>
                    ID interno: {cliente.id}
                  </Typography>
                </Stack>

                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                  <Chip
                    size="small"
                    label={hasSaldo ? "Saldo pendiente" : "Sin saldo pendiente"}
                    sx={{
                      fontWeight: 600,
                      bgcolor: hasSaldo ? "error.main" : "transparent",
                      color: hasSaldo ? "error.contrastText" : "var(--tg-muted)",
                      border: hasSaldo ? "none" : "1px solid var(--tg-border)",
                    }}
                  />
                  <Chip
                    size="small"
                    label={money.format(cliente.balance)}
                    sx={{
                      fontWeight: 600,
                      bgcolor: hasSaldo ? "error.main" : "transparent",
                      color: hasSaldo ? "error.contrastText" : "var(--tg-muted)",
                      border: hasSaldo ? "none" : "1px solid var(--tg-border)",
                    }}
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Datos: Label: Valor (en línea) */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline label="CC/NIT" value={cliente.tax_id || "—"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline label="Ciudad" value={cliente.city || "—"} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline label="Correo" value={cliente.email || "—"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline label="Celular" value={cliente.phone || "—"} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline label="Dirección" value={cliente.address || "—"} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline
                  label="Fecha de creación"
                  value={format(new Date(cliente.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
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
