"use client";
import { useState } from "react";
import { deleteProduct } from "@/services/sales/product.api";

export function useDeleteProducto() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteProduct(id);
      return res;
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando producto");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { deleteProducto: handleDelete, loading, error };
}
