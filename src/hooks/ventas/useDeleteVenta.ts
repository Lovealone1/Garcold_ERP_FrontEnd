"use client";
import { useState } from "react";
import { deleteVenta } from "@/services/sales/ventas.api";

export function useDeleteVenta() {
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleDelete(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteVenta(id);
      return res;
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Error eliminando venta";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { deleteVenta: handleDelete, loading, error };
}
