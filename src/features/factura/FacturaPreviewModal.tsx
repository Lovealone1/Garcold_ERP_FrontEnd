// features/factura/FacturaPreviewModal.tsx
"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MaterialIcon } from "@/components/ui/material-icon";

const A4W = 794; // px a 96dpi
const A4H = 1123;

type Bounds = { left: number; top: number; width: number; height: number };

export default function FacturaPreviewModal({
    open,
    onClose,
    ventaId,
    facturaHref,
}: {
    open: boolean;
    onClose: () => void;
    ventaId: number | null;
    facturaHref?: string | null;
}) {
    const panelRef = useRef<HTMLDivElement | null>(null);
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const [scale, setScale] = useState(0.5);
    const [loadingFrame, setLoadingFrame] = useState(true);
    const [bounds, setBounds] = useState<Bounds | null>(null);

    // Base sin query, luego derivamos preview y download
    const pageBase = useMemo(() => {
        if (!ventaId) return "";
        const raw = facturaHref ?? `/comercial/ventas/facturas/${ventaId}`;
        return raw.split("?")[0];
    }, [ventaId, facturaHref]);

    const previewUrl = useMemo(() => {
        if (!ventaId) return "";
        return `${pageBase}?embed=1`;
    }, [pageBase, ventaId]);

    const downloadPageUrl = useMemo(() => {
        if (!ventaId) return "";
        return `${pageBase}?download=1`;
    }, [pageBase, ventaId]);

    // Limita el overlay al rectángulo de .app-shell__frame (no tapa sidebar)
    useEffect(() => {
        if (!open) return;
        const pickBounds = () => {
            const host = document.querySelector(".app-shell__frame") as HTMLElement | null;
            if (!host) {
                setBounds(null);
                return;
            }
            const r = host.getBoundingClientRect();
            setBounds({
                left: Math.round(r.left + window.scrollX),
                top: Math.round(r.top + window.scrollY),
                width: Math.round(r.width),
                height: Math.round(r.height),
            });
        };
        pickBounds();
        const obs = new ResizeObserver(pickBounds);
        const host = document.querySelector(".app-shell__frame") as HTMLElement | null;
        if (host) obs.observe(host);
        window.addEventListener("resize", pickBounds);
        window.addEventListener("scroll", pickBounds, true);
        return () => {
            obs.disconnect();
            window.removeEventListener("resize", pickBounds);
            window.removeEventListener("scroll", pickBounds, true);
        };
    }, [open]);

    // Bloqueo de scroll del fondo
    useEffect(() => {
        if (!open) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = prev;
        };
    }, [open]);

    // Fit del A4 leyendo padding real del body del panel
    useEffect(() => {
        if (!open) return;
        const fit = () => {
            const el = bodyRef.current;
            if (!el) return;

            const cs = getComputedStyle(el);
            const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
            const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);

            const safeW = Math.max(0, el.clientWidth - padX);
            const safeH = Math.max(0, el.clientHeight - padY);

            const sx = safeW / A4W;
            const sy = safeH / A4H;
            setScale(Math.min(sx, sy, 1) * 0.98);
        };
        fit();
        const ro = new ResizeObserver(fit);
        if (panelRef.current) ro.observe(panelRef.current);
        if (bodyRef.current) ro.observe(bodyRef.current);
        window.addEventListener("resize", fit);
        window.addEventListener("orientationchange", fit);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", fit);
            window.removeEventListener("orientationchange", fit);
        };
    }, [open]);

    if (!open || !ventaId) return null;

    const overlayStyle: React.CSSProperties = bounds
        ? {
            position: "fixed",
            left: bounds.left,
            top: bounds.top,
            width: bounds.width,
            height: bounds.height,
            zIndex: 1000,
        }
        : { position: "fixed", inset: 0, zIndex: 1000 };

    const overlay = (
        <div
            role="dialog"
            aria-modal="true"
            style={overlayStyle}
            className="bg-black/60 grid place-items-center p-3 md:p-6"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
            onKeyDown={(e) => e.key === "Escape" && onClose()}
        >
            {/* Panel */}
            <div
                ref={panelRef}
                className="w-full h-full max-w-[980px] max-h-[88vh] rounded-xl border shadow-2xl overflow-hidden bg-[var(--panel-bg)] flex flex-col"
                style={{ borderColor: "var(--tg-border)" }}
            >
                {/* Header */}
                <div
                    className="h-12 shrink-0 flex items-center justify-end gap-2 px-3 border-b"
                    style={{ borderColor: "var(--tg-border)", background: "color-mix(in srgb, var(--tg-bg) 94%, #000 6%)" }}
                >
                    <a
                        href={downloadPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3 rounded-md bg-[var(--tg-primary)] text-[var(--tg-on-primary)] grid place-items-center text-sm"
                    >
                        Descargar
                    </a>
                    <a
                        href={previewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-9 px-3 rounded-md grid place-items-center text-sm"
                        style={{ background: "var(--tg-card-bg)", color: "var(--tg-card)" }}
                    >
                        Abrir en nueva pestaña
                    </a>
                    <button
                        onClick={onClose}
                        className="h-9 w-9 grid place-items-center rounded-md"
                        style={{ background: "var(--tg-card-bg)", color: "var(--tg-card)" }}
                        aria-label="Cerrar"
                    >
                        <MaterialIcon name="close" size={18} />
                    </button>
                </div>

                {/* Body */}
                <div ref={bodyRef} className="relative flex-1 min-h-0 p-4 md:p-6 flex items-center justify-center">
                    <div
                        style={{
                            width: A4W,
                            height: A4H,
                            transform: `scale(${Number.isFinite(scale) ? scale : 0.5})`,
                            transformOrigin: "center center",
                        }}
                    >
                        <iframe
                            title="Factura"
                            src={previewUrl}
                            className="block w-[794px] h-[1123px] border-0"
                            onLoad={() => setLoadingFrame(false)}
                            style={{ pointerEvents: "none" }}
                        />
                    </div>

                    {loadingFrame && (
                        <div className="absolute inset-0 grid place-items-center text-sm text-[var(--tg-muted)]">
                            Cargando vista previa…
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    return createPortal(overlay, document.body);
}
