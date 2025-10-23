"use client";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useFactura } from "@/hooks/facturas/useFactura";
import Factura from "@/features/factura/Factura";

export default function FacturaPage() {
  const params = useParams();
  // soporta [ventaId] o [id]
  const rawId = (params as any)?.ventaId ?? (params as any)?.id;
  const ventaId = Number(rawId);
  const qs = useSearchParams();
  const companyId = Number(qs.get("company_id") ?? "") || undefined;

  const [mounted, setMounted] = useState(false);
  const { data, loading, error } = useFactura(
    Number.isFinite(ventaId) && ventaId > 0 ? ventaId : null,
    { companyId }
  );

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    if (!loading && data) (document as any).fonts?.ready?.then?.(() => { (window as any).__PRINT_READY__ = true; });
  }, [loading, data]);

  if (!mounted) return <div className="p-4 text-sm">Cargando…</div>;
  if (!Number.isFinite(ventaId) || ventaId <= 0) return <div className="p-4 text-sm">ID inválido.</div>;
  if (loading) return <div className="p-4 text-sm">Cargando factura…</div>;
  if (error) return <div className="p-4 text-sm text-red-600">{error}</div>;
  if (!data) return <div className="p-4 text-sm">Sin datos.</div>;

  return <Factura data={data} />;
}
