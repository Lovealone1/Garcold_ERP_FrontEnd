"use client";
import { useState } from "react";
import { deleteProveedor } from "@/services/sales/proveedores.api";

export function useDeleteProveedor() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteProveedor(id);
      return res;
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando proveedor");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { deleteProveedor: handleDelete, loading, error };
}
