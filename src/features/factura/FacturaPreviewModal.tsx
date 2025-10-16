"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";

const A4W = 794;   // ≈ 210mm en px a 96dpi
const A4H = 1123;  // ≈ 297mm en px a 96dpi

export default function FacturaPreviewModal({
    open,
    onClose,
    ventaId,
    facturaHref,   // opcional: si no lo pasas, se arma con facturaUrlByVentaId
    pdfHref,       // opcional: endpoint directo del PDF si lo tienes
}: {
    open: boolean;
    onClose: () => void;
    ventaId: number | null;
    facturaHref?: string | null;
    pdfHref?: string | null;
}) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(0.5);
    const [loadingFrame, setLoadingFrame] = useState(true);

    const pageUrl = useMemo(() => {
        if (!ventaId) return "";
        if (facturaHref) return facturaHref;
        // página HTML de la factura (misma que abrías en otra pestaña)
        return `/comercial/ventas/facturas/${ventaId}?embed=1`;
    }, [ventaId, facturaHref]);

    const downloadUrl = useMemo(() => {
        if (!ventaId) return "";
        // si ya tienes un endpoint de PDF, pásalo por prop en pdfHref
        if (pdfHref) return pdfHref;
        // fallback: la misma página con query para que el backend devuelva el PDF
        return `/api/ventas/${ventaId}/factura.pdf`;
    }, [ventaId, pdfHref]);

    // recalcular escala para encajar el A4 dentro del modal
    useEffect(() => {
        function fit() {
            if (!containerRef.current) return;
            const w = containerRef.current.clientWidth;
            const h = containerRef.current.clientHeight;
            const sx = w / A4W;
            const sy = h / A4H;
            setScale(Math.min(sx, sy, 1)); // nunca ampliar
        }
        fit();
        const ro = new ResizeObserver(fit);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, [open]);

    if (!open || !ventaId) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 grid place-items-center bg-black/50"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
        >
            <div className="w-[920px] max-w-[95vw] h-[80vh] rounded-lg border border-tg bg-[var(--panel-bg)] shadow-xl flex flex-col">
                {/* Header */}
                <div className="px-4 py-3 border-b border-tg flex items-center justify-between">
                    <h3 className="text-base font-semibold">Previsualización de factura</h3>
                    <button onClick={onClose} className="h-8 w-8 grid place-items-center rounded hover:bg-black/10 dark:hover:bg-white/10">
                        <MaterialIcon name="close" size={18} />
                    </button>
                </div>

                {/* Preview */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-[1fr_260px] gap-3 p-3">
                    <div
                        ref={containerRef}
                        className="relative rounded bg-[var(--page-bg)] border border-tg overflow-hidden"
                    >
                        {loadingFrame && (
                            <div className="absolute inset-0 grid place-items-center text-sm text-tg-muted">
                                Cargando vista previa…
                            </div>
                        )}
                        <div
                            className="absolute top-0 left-0 origin-top-left"
                            style={{ width: A4W, height: A4H, transform: `scale(${scale})` }}
                        >
                            <iframe
                                title="Factura"
                                src={pageUrl}
                                className="w-[794px] h-[1123px] border-0"
                                onLoad={() => setLoadingFrame(false)}
                                // evita scroll/zoom dentro del iframe en preview
                                style={{ pointerEvents: "none" }}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-3">
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 rounded-md bg-tg-primary px-4 text-sm font-medium text-tg-on-primary grid place-items-center"
                        >
                            Descargar factura
                        </a>

                        <a
                            href={pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-10 rounded-md px-4 text-sm grid place-items-center hover:bg-black/10 dark:hover:bg-white/10"
                        >
                            Abrir en nueva pestaña
                        </a>

                        <div className="text-xs text-tg-muted mt-2">
                            Vista reducida (A4). Para imprimir usa la opción “Abrir en nueva pestaña”.
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
