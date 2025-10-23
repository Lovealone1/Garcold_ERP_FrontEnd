"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { MaterialIcon } from "@/components/ui/material-icon";

const A4W = 794;    // px a 96dpi
const A4H = 1123;

export default function FacturaPreviewModal({
    open,
    onClose,
    ventaId,
    facturaHref,
    pdfHref,
}: {
    open: boolean;
    onClose: () => void;
    ventaId: number | null;
    facturaHref?: string | null;
    pdfHref?: string | null;
}) {
    const stageRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(0.5);
    const [loadingFrame, setLoadingFrame] = useState(true);

    const pageUrl = useMemo(() => {
        if (!ventaId) return "";
        return facturaHref ?? `/comercial/ventas/facturas/${ventaId}?embed=1`;
    }, [ventaId, facturaHref]);

    const downloadUrl = useMemo(() => {
        if (!ventaId) return "";
        return pdfHref ?? `/api/v1/invoices/sales/${ventaId}/pdf?download=1`;
    }, [ventaId, pdfHref]);

    useEffect(() => {
        if (!open) return;
        const fit = () => {
            if (!stageRef.current) return;
            const w = stageRef.current.clientWidth;
            const h = stageRef.current.clientHeight;
            const sx = w / A4W;
            const sy = h / A4H;
            setScale(Math.min(sx, sy, 1));
        };
        fit();
        const ro = new ResizeObserver(fit);
        if (stageRef.current) ro.observe(stageRef.current);
        return () => ro.disconnect();
    }, [open]);

    if (!open || !ventaId) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-[999] bg-black/70"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
        >
            {/* Controles flotantes */}
            <div className="absolute right-4 top-4 flex gap-2">
                <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-md bg-[var(--tg-primary)] text-[var(--tg-on-primary)] grid place-items-center text-sm"
                >
                    Descargar
                </a>
                <a
                    href={pageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 px-3 rounded-md bg-white/90 text-black grid place-items-center text-sm hover:bg-white"
                >
                    Abrir pestaña
                </a>
                <button
                    onClick={onClose}
                    className="h-9 w-9 grid place-items-center rounded-md bg-white/90 hover:bg-white"
                >
                    <MaterialIcon name="close" size={18} />
                </button>
            </div>

            {/* Escenario a pantalla completa sin scroll */}
            <div className="absolute inset-0 p-4 md:p-8">
                <div
                    ref={stageRef}
                    className="w-full h-full rounded-lg bg-[var(--panel-bg)] border border-tg overflow-hidden relative"
                >
                    {loadingFrame && (
                        <div className="absolute inset-0 grid place-items-center text-sm text-[var(--tg-muted)]">
                            Cargando vista previa…
                        </div>
                    )}

                    {/* Página A4 escalada y centrada */}
                    <div
                        className="absolute left-1/2 top-1/2 origin-top-left"
                        style={{
                            width: A4W,
                            height: A4H,
                            transform: `translate(-50%, -50%) scale(${scale})`,
                        }}
                    >
                        <iframe
                            title="Factura"
                            src={pageUrl}
                            className="block w-[794px] h-[1123px] border-0"
                            onLoad={() => setLoadingFrame(false)}
                            style={{ pointerEvents: "none" }} // sin scroll dentro del iframe
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
