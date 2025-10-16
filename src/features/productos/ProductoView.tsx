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
import * as React from "react";
import type { ProductDTO } from "@/types/productos";

type Props = {
  open: boolean;
  onClose: () => void;
  producto: ProductDTO | null;
  loading?: boolean;
};

const money = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

export default function ProductoView({ open, onClose, producto, loading }: Props) {
  const stock = producto?.quantity ?? 0;
  const inStock = stock > 0;

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
      <DialogTitle sx={{ fontWeight: 600, pb: 1.5 }}>Detalle de producto</DialogTitle>

      <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>
        {loading ? (
          <Stack gap={2}>
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} />
            <Skeleton variant="rounded" height={64} />
          </Stack>
        ) : !producto ? (
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
                    {producto.reference}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "var(--tg-muted)" }}>
                    ID interno: {producto.id}
                  </Typography>
                </Stack>

                <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                  {/* Stock (reemplaza el bloque de saldo de Cliente) */}
                  <Chip
                    size="small"
                    label={inStock ? `Stock: ${stock}` : "Sin stock"}
                    sx={{
                      fontWeight: 600,
                      bgcolor: inStock ? "success.main" : "error.main",
                      color: inStock ? "success.contrastText" : "error.contrastText",
                      border: "none",
                    }}
                  />
                  {/* Estado activo */}
                  <Chip
                    size="small"
                    label={producto.is_active ? "Activo" : "Inactivo"}
                    sx={{
                      fontWeight: 600,
                      bgcolor: producto.is_active ? "primary.main" : "transparent",
                      color: producto.is_active ? "primary.contrastText" : "var(--tg-muted)",
                      border: producto.is_active ? "none" : "1px solid var(--tg-border)",
                    }}
                  />
                </Stack>
              </Stack>
            </Box>

            {/* Datos: Label: Valor */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <InfoInline label="Descripción" value={producto.description} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline label="Precio compra" value={money.format(producto.purchase_price)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline label="Precio venta" value={money.format(producto.sale_price)} />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline label="Stock" value={String(producto.quantity)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <InfoInline
                  label="Fecha de creación"
                  value={format(new Date(producto.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
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
