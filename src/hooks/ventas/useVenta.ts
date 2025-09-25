"use client";
import { useCallback, useEffect, useState } from "react";
import { getVentaById } from "@/services/sales/ventas.api";
import type { Venta } from "@/types/ventas";

export function useVenta(ventaId: number | null) {
  const [venta, setVenta]     = useState<Venta | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const fetchIt = useCallback(async () => {
    if (!ventaId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getVentaById(ventaId);
      setVenta(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Error al cargar venta");
    } finally {
      setLoading(false);
    }
  }, [ventaId]);

  useEffect(() => { fetchIt(); }, [fetchIt]);

  return { venta, loading, error, refetch: fetchIt };
}
