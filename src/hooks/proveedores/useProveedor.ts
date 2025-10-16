"use client";
import { useEffect, useState, useCallback } from "react";
import { getSupplierById } from "@/services/sales/supplier.api";
import type { Supplier } from "@/types/supplier";

export function useSupplier(supplierId: number | null) {
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  const fetchIt = useCallback(async () => {
    if (!supplierId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getSupplierById(supplierId);
      setSupplier(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load supplier");
    } finally {
      setLoading(false);
    }
  }, [supplierId]);

  useEffect(() => { fetchIt(); }, [fetchIt]);

  return { supplier, loading, error, refetch: fetchIt };
}
