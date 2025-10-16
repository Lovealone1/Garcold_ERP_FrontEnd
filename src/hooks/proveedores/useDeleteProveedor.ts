"use client";
import { useState } from "react";
import { deleteSupplier } from "@/services/sales/supplier.api";

export function useDeleteSupplier() {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  async function handleDelete(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteSupplier(id); // { message: string }
      return res;
    } catch (e: any) {
      setError(e?.message ?? "Error deleting supplier");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { deleteSupplier: handleDelete, loading, error };
}
