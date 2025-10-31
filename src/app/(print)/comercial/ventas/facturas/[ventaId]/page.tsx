"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useFactura } from "@/hooks/facturas/useFactura";
import Factura from "@/features/factura/Factura";

// Asegúrate de que Factura envuelva el contenido en un contenedor con id="invoice-root"
export default function FacturaPage() {
  const params = useParams();
  const rawId = (params as any)?.ventaId ?? (params as any)?.id;
  const ventaId = Number(rawId);
  const qs = useSearchParams();
  const companyId = Number(qs.get("company_id") ?? "") || undefined;
  const autoDownload = qs.get("download") === "1";

  const [mounted, setMounted] = useState(false);
  const { data, loading, error } = useFactura(
    Number.isFinite(ventaId) && ventaId > 0 ? ventaId : null,
    { companyId }
  );

  useEffect(() => setMounted(true), []);

  // bandera de listo para imprimir/descargar
  useEffect(() => {
    if (loading || !data) return;
    (document as any).fonts?.ready?.then?.(() => { (window as any).__PRINT_READY__ = true; });
  }, [loading, data]);

  // descarga directa con html2pdf.js
  useEffect(() => {
    if (!autoDownload || loading || !data) return;

    let cancelled = false;
    (async () => {
      try {
        // espera a que la factura pinte
        await new Promise((r) => setTimeout(r, 50));
        await (document as any).fonts?.ready;
        const root = document.getElementById("invoice-root") || document.body;

        const html2pdf = (await import("html2pdf.js")).default;
        const filename = `GC-${ventaId}.pdf`;

        const worker = (html2pdf() as any)
          .set({
            filename: `GC_${ventaId}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
            pagebreak: { avoid: ["tr", ".no-break"] }, // ← ya no da error
          })
          .from(root);

        if (!cancelled) await worker.save();

      } catch {
        // no-op
      } finally {
        // cierra la pestaña abierta por el usuario
        try { window.close(); } catch { /* noop */ }
      }
    })();

    return () => { cancelled = true; };
  }, [autoDownload, loading, data, ventaId]);

  if (!mounted) return <div className="p-4 text-sm">Cargando…</div>;
  if (!Number.isFinite(ventaId) || ventaId <= 0) return <div className="p-4 text-sm">ID inválido.</div>;
  if (loading) return <div className="p-4 text-sm">Cargando factura…</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;
  if (!data) return <div className="p-4 text-sm">Sin datos.</div>;

  return (
    <>
      <style>{`
        /* Forzar lienzo A4 y fondo blanco para consistencia */
        body{ background:#fff; }
        #invoice-root{ width:210mm; margin:0 auto; background:#fff; }
        @page{ size:A4; margin:0; }
        @media print{
          body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; }
        }
      `}</style>
      <Factura data={data} />
    </>
  );
}
