"use client";

import { useMemo, useState, useEffect } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import LinearProgress from "@mui/material/LinearProgress";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

import type { MediaOutDTO } from "@/types/media";
import { useMediaUpload } from "@/hooks/media/useMediaUpload";
import { listProductMedia } from "@/services/sales/media.api";
import { useDeleteMedia } from "@/hooks/media/useDeleteMedia";

type Props = {
  open: boolean;
  onClose: () => void;
  productId: number;
  max?: number;
};

type Preview = {
  src: string;
  kind: "existing" | "file";
  idx: number;
  id?: number;
};

const ACCEPT = "image/png,image/jpeg,image/webp";
const MAX_MB = 5;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function ProductImagesModal({
  open,
  onClose,
  productId,
  max = 3,
}: Props) {
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [items, setItems] = useState<MediaOutDTO[]>([]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { uploadProductFiles, loading, error, reset } = useMediaUpload();
  const { deleteMedia: deleteMediaReq, loading: deletingLoading } =
    useDeleteMedia();

  const busy = submitting || loading || deletingLoading || deletingId !== null;
  const remaining = Math.max(0, max - items.length);
  function isCanceled(e: any) {
    return (
      e?.code === "ERR_CANCELED" ||
      e?.name === "CanceledError" ||
      e?.name === "AbortError" ||
      e?.message === "canceled"
    );
  }
  useEffect(() => {
    if (!open || !productId) return;
    const ac = new AbortController();

    (async () => {
      setFetching(true);
      setFetchError(null);
      try {
        const data = await listProductMedia(productId, { signal: ac.signal });
        setItems(data ?? []);
      } catch (e: any) {
        if (isCanceled(e)) return; // <-- ignora cancelaciones
        setFetchError(e?.message ?? "failed to load media");
      } finally {
        setFetching(false);
      }
    })();

    return () => ac.abort();
  }, [open, productId]);

  const previews: Preview[] = useMemo(() => {
    const out: Preview[] = [];
    items.forEach((m, i) =>
      out.push({ src: m.public_url, kind: "existing", idx: i, id: m.id }),
    );
    files.forEach((f, i) =>
      out.push({ src: URL.createObjectURL(f), kind: "file", idx: i }),
    );
    return out.slice(0, max);
  }, [items, files, max]);

  useEffect(() => {
    return () => {
      previews.forEach((p) => p.kind === "file" && URL.revokeObjectURL(p.src));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  function clearLocal() {
    setFiles([]);
    reset();
  }

  function handlePickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const list = Array.from(e.target.files ?? []);
    if (!list.length) return;

    if (remaining <= 0) {
      alert(`Máximo ${max} imágenes por producto.`);
      e.target.value = "";
      return;
    }

    const valids = list.filter(
      (f) => ACCEPT.includes(f.type) && f.size <= MAX_BYTES,
    );
    if (valids.length !== list.length) {
      alert(`Solo PNG/JPEG/WEBP y hasta ${MAX_MB}MB.`);
    }

    const capacity = Math.max(0, remaining - files.length);
    if (capacity <= 0) {
      alert(`Máximo ${max}. Elimina alguna para subir más.`);
      e.target.value = "";
      return;
    }

    const next = valids.slice(0, capacity);
    if (valids.length > capacity) {
      alert(`Solo se agregarán ${capacity} archivo(s) por límite.`);
    }
    if (next.length) setFiles((prev) => [...prev, ...next]);

    e.target.value = "";
  }

  function removeFileAt(i: number) {
    setFiles((arr) => arr.filter((_, idx) => idx !== i));
  }

  async function handleSubmit() {
    if (files.length === 0) {
      alert("No hay archivos para subir.");
      return;
    }
    if (items.length >= max) {
      alert(`Máximo ${max} imágenes por producto.`);
      return;
    }

    const filesToUpload = files.slice(0, Math.max(1, remaining));
    setSubmitting(true);
    try {
      const added = await uploadProductFiles({
        product_id: productId,
        files: filesToUpload,
      });
      if (added?.length) setItems((prev) => [...prev, ...added].slice(0, max));
      clearLocal();
    } catch (e: any) {
      const d = e?.response?.data?.detail;
      if (d) alert(typeof d === "string" ? d : JSON.stringify(d));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(mediaId: number) {
    setDeletingId(mediaId);
    try {
      await deleteMediaReq(mediaId);
      setItems((prev) => prev.filter((m) => m.id !== mediaId));
    } catch (e: any) {
      const d = e?.response?.data?.detail;
      alert(
        d
          ? typeof d === "string"
            ? d
            : JSON.stringify(d)
          : "Error al eliminar.",
      );
    } finally {
      setDeletingId(null);
    }
  }

  function normalizeError(e: any): string | null {
    const d = e?.response?.data?.detail;
    const msg = !d
      ? e?.message
      : typeof d === "string"
        ? d
        : Array.isArray(d)
          ? d.map((x: any) => x?.msg ?? JSON.stringify(x)).join(" • ")
          : typeof d === "object"
            ? (d.message ?? d.error ?? JSON.stringify(d))
            : String(d);

    if (!msg) return null;
    // oculta cancelaciones
    if (/cancell?ed|ERR_CANCELED/i.test(msg)) return null;
    return msg;
  }

  const errText = normalizeError(error);

  return (
    <Dialog
      open={open}
      onClose={onClose} // no bloqueamos cierre
      fullWidth
      maxWidth="md"
      slotProps={{
        paper: {
          sx: {
            position: "relative",
            borderRadius: 2,
            border: "1px solid var(--panel-border)",
            bgcolor: "var(--tg-card-bg)",
            color: "var(--tg-card-fg)",
          },
        },
      }}
    >
      {busy && (
        <LinearProgress
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        />
      )}

      <DialogTitle
        sx={{
          fontWeight: 600,
          pb: 1.5,
          display: "flex",
          alignItems: "center",
          gap: 1,
        }}
      >
        Imágenes del producto
        <Box
          component="span"
          sx={{ ml: "auto", fontSize: 12, color: "var(--tg-muted)" }}
        >
          Máximo {max} • Quedan {remaining}
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: "var(--panel-border)" }}>
        {fetching ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              {previews.map((p, i) => (
                <Grid key={`${p.kind}-${i}`} size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box
                    sx={{
                      position: "relative",
                      width: "100%",
                      pt: "100%",
                      borderRadius: 1,
                      overflow: "hidden",
                      border: "1px solid var(--panel-border)",
                      bgcolor:
                        "color-mix(in srgb, var(--tg-card-bg) 90%, black 10%)",
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={p.src}
                      alt={`preview-${i}`}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />

                    {p.kind === "existing" && p.id !== undefined && (
                      <Tooltip title="Eliminar">
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(p.id!)}
                          sx={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            bgcolor: "rgba(0,0,0,0.55)",
                            color: "white",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                          }}
                        >
                          {deletingId === p.id ? (
                            <CircularProgress
                              size={16}
                              sx={{ color: "white" }}
                            />
                          ) : (
                            <DeleteIcon fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}

                    {p.kind === "file" && (
                      <Tooltip title="Quitar">
                        <IconButton
                          size="small"
                          onClick={() => removeFileAt(p.idx)}
                          sx={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            bgcolor: "rgba(0,0,0,0.45)",
                            color: "white",
                            "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                </Grid>
              ))}

              {!previews.length && !fetchError && (
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Box
                    sx={{
                      border: "1px dashed var(--tg-border)",
                      borderRadius: 1,
                      p: 3,
                      textAlign: "center",
                      color: "var(--tg-muted)",
                      fontSize: 14,
                    }}
                  >
                    Sin imágenes todavía
                  </Box>
                </Grid>
              )}

              {fetchError && (
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ color: "error.main", fontSize: 13 }}>
                    {fetchError}
                  </Box>
                </Grid>
              )}
            </Grid>

            {/* Selector de archivos: siempre activo */}
            <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
              <Button
                component="label"
                startIcon={<CloudUploadIcon />}
                sx={{
                  textTransform: "none",
                  bgcolor:
                    "color-mix(in srgb, var(--tg-card-bg) 92%, black 8%)",
                  color: "var(--tg-card-fg)",
                  border: "1px solid var(--tg-border)",
                  "&:hover": {
                    bgcolor:
                      "color-mix(in srgb, var(--tg-card-bg) 85%, black 15%)",
                  },
                }}
              >
                Seleccionar archivos…
                <input
                  type="file"
                  accept={ACCEPT}
                  multiple
                  hidden
                  onChange={handlePickFiles}
                />
              </Button>

              <Box sx={{ ml: "auto", fontSize: 12, color: "var(--tg-muted)" }}>
                Acepta PNG/JPEG/WEBP • hasta {MAX_MB}MB c/u
              </Box>
            </Box>

            {error && (
              <Box sx={{ color: "error.main", fontSize: 5, mt: 1 }}>
                {errText}
              </Box>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button
          onClick={onClose}
          sx={{ textTransform: "none", color: "var(--tg-muted)" }}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          sx={{
            textTransform: "none",
            bgcolor: "var(--tg-primary)",
            color: "var(--tg-primary-fg)",
            "&:hover": {
              bgcolor: "color-mix(in srgb, var(--tg-primary) 88%, black 12%)",
            },
          }}
          startIcon={
            busy ? (
              <CircularProgress
                size={16}
                sx={{ color: "var(--tg-primary-fg)" }}
              />
            ) : undefined
          }
        >
          {busy ? "Procesando…" : "Subir"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
