"use client";
import { useCallback, useEffect, useState } from "react";
import { getSaleById } from "@/services/sales/sale.api";
import type { Sale } from "@/types/sale";

export function useVenta(ventaId: number | null) {
  const [venta, setVenta] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIt = useCallback(async () => {
    if (!ventaId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSaleById(ventaId);
      setVenta(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Error al cargar venta");
    } finally {
      setLoading(false);
    }
  }, [ventaId]);

  useEffect(() => {
    fetchIt();
  }, [fetchIt]);

  return { venta, loading, error, refetch: fetchIt };
}
