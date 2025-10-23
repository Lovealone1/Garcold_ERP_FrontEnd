"use client";
import { useState } from "react";
import { deleteBank } from "@/services/sales/bank.api";

export function useDeleteBanco() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: number) {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteBank(id);
      return res; // { message }
    } catch (e: any) {
      setError(e?.message ?? "Error eliminando banco");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { deleteBanco: handleDelete, loading, error };
}
