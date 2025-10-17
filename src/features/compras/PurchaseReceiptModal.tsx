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
import ChevronLeft from "@mui/icons-material/ChevronLeft";
import ChevronRight from "@mui/icons-material/ChevronRight";

import type { MediaOutDTO } from "@/types/media";
import { usePurchaseMediaUpload } from "@/hooks/media/usePurchaseMediaUpload";
import { useDeleteMedia } from "@/hooks/media/useDeleteMedia";
import { listPurchaseMedia } from "@/services/sales/media.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";

type Props = {
    open: boolean;
    onClose: () => void;
    purchaseId: number;
    max?: number;
    ratio?: `${number}/${number}`;
};

type Preview =
    | { src: string; kind: "existing"; idx: number; id: number }
    | { src: string; kind: "file"; idx: number };

const ACCEPT = "image/png,image/jpeg,image/webp";
const MAX_MB = 8;
const MAX_BYTES = MAX_MB * 1024 * 1024;

export default function PurchaseReceiptModal({
    open,
    onClose,
    purchaseId,
    max = 10,
    ratio = "3/4",
}: Props) {
    const { success, error: notifyError } = useNotifications();

    const [files, setFiles] = useState<File[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [fetching, setFetching] = useState(false);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [items, setItems] = useState<MediaOutDTO[]>([]);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [index, setIndex] = useState(0);

    const { uploadPurchaseFiles, loading, error, reset } =
        usePurchaseMediaUpload();
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
        if (!open || !purchaseId) return;
        const ac = new AbortController();
        (async () => {
            setFetching(true);
            setFetchError(null);
            try {
                const data = await listPurchaseMedia(purchaseId, { signal: ac.signal });
                setItems(data ?? []);
                setIndex(0);
            } catch (e: any) {
                if (isCanceled(e)) return;
                setFetchError(e?.message ?? "failed to load media");
            } finally {
                setFetching(false);
            }
        })();
        return () => ac.abort();
    }, [open, purchaseId]);

    const previews: Preview[] = useMemo(() => {
        const out: Preview[] = [
            ...items.map((m, i) => ({
                src: m.public_url,
                kind: "existing" as const,
                idx: i,
                id: m.id,
            })),
            ...files.map((f, i) => ({
                src: URL.createObjectURL(f),
                kind: "file" as const,
                idx: i,
            })),
        ];
        const all = out.slice(0, max);
        if (index > 0 && index >= all.length) setIndex(all.length - 1);
        return all;
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
        const picked = Array.from(e.target.files ?? []);
        if (!picked.length) return;

        if (remaining <= 0) {
            notifyError(`Máximo ${max} comprobantes por compra.`);
            e.target.value = "";
            return;
        }

        const valids = picked.filter(
            (f) => ACCEPT.includes(f.type) && f.size <= MAX_BYTES
        );
        if (valids.length !== picked.length) {
            notifyError(`Solo PNG/JPEG/WEBP y hasta ${MAX_MB}MB.`);
        }

        const capacity = Math.max(0, remaining - files.length);
        if (capacity <= 0) {
            notifyError(`Máximo ${max}. Elimina alguno para subir más.`);
            e.target.value = "";
            return;
        }

        const next = valids.slice(0, capacity);

        // Agrega y navega automáticamente al último archivo añadido
        setFiles((prev) => {
            const newArr = [...prev, ...next];
            const target = items.length + newArr.length - 1; // primer índice de “file” recién agregado
            setIndex(Math.max(0, Math.min(target, max - 1)));
            return newArr;
        });

        if (valids.length > capacity) {
            notifyError(`Solo se agregarán ${capacity} archivo(s) por límite.`);
        }

        e.target.value = "";
    }

    function removeFileAt(i: number) {
        setFiles((arr) => {
            const beforeLen = arr.length;
            const newArr = arr.filter((_, idx) => idx !== i);
            // Si quitamos el que estaba seleccionado, ajusta índice de forma segura
            const totalAfter = items.length + newArr.length;
            setIndex((cur) => Math.max(0, Math.min(cur, totalAfter - 1)));
            return newArr;
        });
    }

    async function handleSubmit() {
        if (files.length === 0) {
            notifyError("No hay archivos para subir.");
            return;
        }
        if (items.length >= max) {
            notifyError(`Máximo ${max} comprobantes por compra.`);
            return;
        }

        const filesToUpload = files.slice(0, Math.max(1, remaining));
        const pendingCount = filesToUpload.length;

        setSubmitting(true);
        try {
            const added = await uploadPurchaseFiles({
                purchase_id: purchaseId,
                files: filesToUpload,
            });

            if (added?.length) {
                // Muestra nuevas y navega a la última subida
                setItems((prev) => {
                    const merged = [...prev, ...added].slice(0, max);
                    setIndex(merged.length - 1); // ir a la más reciente subida
                    return merged;
                });
                success(
                    added.length === 1
                        ? "Comprobante subido"
                        : `${added.length} comprobantes subidos`
                );
            }

            // Retira de “files” los que ya subimos
            setFiles((prev) => prev.slice(pendingCount));

            // Relee del backend para asegurar consistencia
            try {
                const fresh = await listPurchaseMedia(purchaseId);
                if (fresh) {
                    setItems(fresh);
                    setIndex(fresh.length - 1); // mantenernos en la última ya persistida
                }
            } catch {
                /* opcional */
            }
        } catch (e: any) {
            const d = e?.response?.data?.detail;
            notifyError(
                d ? (typeof d === "string" ? d : JSON.stringify(d)) : "Error al subir"
            );
        } finally {
            setSubmitting(false);
        }
    }

    async function handleDelete(mediaId: number) {
        setDeletingId(mediaId);
        try {
            await deleteMediaReq(mediaId);
            // quita localmente y reubica índice
            setItems((prev) => {
                const idx = prev.findIndex((m) => m.id === mediaId);
                const next = prev.filter((m) => m.id !== mediaId);
                const newIndex = Math.max(0, Math.min(index - (idx <= index ? 1 : 0), next.length - 1));
                setIndex(newIndex);
                return next;
            });
            success("Comprobante eliminado");

            try {
                const fresh = await listPurchaseMedia(purchaseId);
                if (fresh) {
                    setItems(fresh);
                    setIndex((i) => Math.min(i, Math.max(0, fresh.length - 1)));
                }
            } catch {
                /* opcional */
            }
        } catch (e: any) {
            const d = e?.response?.data?.detail;
            notifyError(
                d ? (typeof d === "string" ? d : JSON.stringify(d)) : "Error al eliminar"
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
                        ? d.message ?? d.error ?? JSON.stringify(d)
                        : String(d);
        if (!msg) return null;
        if (/cancell?ed|ERR_CANCELED/i.test(msg)) return null;
        return msg;
    }

    const errText = normalizeError(error);
    const current = previews[index] ?? null;
    const total = previews.length;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="sm"
            slotProps={{
                paper: {
                    sx: {
                        position: "relative",
                        borderRadius: 2,
                        border: "1px solid var(--panel-border)",
                        bgcolor: "var(--tg-card-bg)",
                        color: "var(--tg-card-fg)",
                        maxHeight: "80vh",
                    },
                },
            }}
        >
            {(busy || fetching) && (
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
                    pb: 1.25,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                }}
            >
                Comprobantes de compra
                <Box
                    component="span"
                    sx={{ ml: "auto", fontSize: 12, color: "var(--tg-muted)" }}
                >
                    Máximo {max} • Quedan {remaining}
                </Box>
            </DialogTitle>

            <DialogContent
                dividers
                sx={{ borderColor: "var(--panel-border)", p: 2, overflow: "hidden" }}
            >
                {fetching ? (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                        <CircularProgress size={28} />
                    </Box>
                ) : (
                    <>
                        <Grid container spacing={2} sx={{ mb: 1 }}>
                            <Grid size={{ xs: 12 }}>
                                <Box
                                    sx={{
                                        position: "relative",
                                        width: "100%",
                                        maxHeight: "60vh",
                                        aspectRatio: ratio.replace("/", " / "),
                                        marginInline: "auto",
                                        borderRadius: 1,
                                        overflow: "hidden",
                                        border: "1px solid var(--panel-border)",
                                        bgcolor:
                                            "color-mix(in srgb, var(--tg-card-bg) 90%, black 10%)",
                                    }}
                                >
                                    {current ? (
                                        <>
                                            {/* imagen */}
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img
                                                src={current.src}
                                                alt={`receipt-${index}`}
                                                style={{
                                                    position: "absolute",
                                                    inset: 0,
                                                    width: "100%",
                                                    height: "100%",
                                                    objectFit: "contain",
                                                    background: "transparent",
                                                }}
                                            />

                                            {/* señalización de “no subido” */}
                                            {current.kind === "file" && (
                                                <Box
                                                    sx={{
                                                        position: "absolute",
                                                        top: 8,
                                                        left: 8,
                                                        px: 0.75,
                                                        py: 0.25,
                                                        fontSize: 11,
                                                        borderRadius: 1,
                                                        bgcolor: "rgba(255,165,0,0.9)",
                                                        color: "#000",
                                                        fontWeight: 600,
                                                        letterSpacing: 0.2,
                                                    }}
                                                >
                                                    Sin subir
                                                </Box>
                                            )}

                                            {/* navegación */}
                                            {total > 1 && (
                                                <>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() =>
                                                            setIndex((i) => (i - 1 + total) % total)
                                                        }
                                                        sx={{
                                                            position: "absolute",
                                                            top: "50%",
                                                            left: 6,
                                                            transform: "translateY(-50%)",
                                                            bgcolor: "rgba(0,0,0,0.45)",
                                                            color: "white",
                                                            "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                                                        }}
                                                    >
                                                        <ChevronLeft />
                                                    </IconButton>
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => setIndex((i) => (i + 1) % total)}
                                                        sx={{
                                                            position: "absolute",
                                                            top: "50%",
                                                            right: 6,
                                                            transform: "translateY(-50%)",
                                                            bgcolor: "rgba(0,0,0,0.45)",
                                                            color: "white",
                                                            "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                                                        }}
                                                    >
                                                        <ChevronRight />
                                                    </IconButton>
                                                </>
                                            )}

                                            {/* borrar */}
                                            {current.kind === "existing" && (
                                                <Tooltip title="Eliminar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => handleDelete(current.id)}
                                                        sx={{
                                                            position: "absolute",
                                                            top: 8,
                                                            right: 8,
                                                            bgcolor: "rgba(0,0,0,0.55)",
                                                            color: "white",
                                                            "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
                                                        }}
                                                    >
                                                        {deletingId === current.id ? (
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
                                            {current.kind === "file" && (
                                                <Tooltip title="Quitar">
                                                    <IconButton
                                                        size="small"
                                                        onClick={() => removeFileAt(current.idx)}
                                                        sx={{
                                                            position: "absolute",
                                                            top: 8,
                                                            right: 8,
                                                            bgcolor: "rgba(0,0,0,0.45)",
                                                            color: "white",
                                                            "&:hover": { bgcolor: "rgba(0,0,0,0.6)" },
                                                        }}
                                                    >
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}

                                            {/* indicador */}
                                            <Box
                                                sx={{
                                                    position: "absolute",
                                                    bottom: 6,
                                                    left: "50%",
                                                    transform: "translateX(-50%)",
                                                    px: 1,
                                                    py: 0.25,
                                                    borderRadius: 1,
                                                    fontSize: 12,
                                                    bgcolor: "rgba(0,0,0,0.55)",
                                                    color: "white",
                                                }}
                                            >
                                                {index + 1}/{total}
                                            </Box>
                                        </>
                                    ) : (
                                        <Box
                                            sx={{
                                                position: "absolute",
                                                inset: 0,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "var(--tg-muted)",
                                                fontSize: 14,
                                            }}
                                        >
                                            Sin comprobantes todavía
                                        </Box>
                                    )}
                                </Box>
                            </Grid>

                            {fetchError && (
                                <Grid size={{ xs: 12 }}>
                                    <Box sx={{ color: "error.main", fontSize: 13 }}>
                                        {fetchError}
                                    </Box>
                                </Grid>
                            )}
                        </Grid>

                        {/* selector */}
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
                                PNG/JPEG/WEBP • hasta {MAX_MB}MB c/u
                            </Box>
                        </Box>

                        {error && (
                            <Box sx={{ color: "error.main", fontSize: 13, mt: 1 }}>
                                {errText}
                            </Box>
                        )}
                    </>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 2, py: 1.5 }}>
                <Button
                    onClick={onClose}
                    sx={{ textTransform: "none", color: "var(--tg-muted)" }}
                >
                    Cerrar
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
