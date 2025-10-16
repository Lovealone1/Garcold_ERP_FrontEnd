// src/app/(print)/comercial/ventas/facturas/[ventaId]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useFactura } from "@/hooks/facturas/useFactura";
import Factura from "@/features/factura/Factura";

export default function FacturaPage() {
  const { ventaId } = useParams() as { ventaId: string };
  const [mounted, setMounted] = useState(false);
  const { data, loading, error } = useFactura(Number(ventaId));

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!loading && data) {
      (document as any).fonts?.ready?.then?.(() => {
        (window as any).__PRINT_READY__ = true;
      });
    }
  }, [loading, data]);

  if (!mounted || loading || error || !data) return null;
  return <Factura data={data} />;
}
