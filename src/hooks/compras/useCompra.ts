"use client";
import { useCallback, useEffect, useState } from "react";
import { getPurchaseById } from "@/services/sales/purchase.api";
import type { Purchase } from "@/types/purchase";

export function usePurchase(purchaseId: number | null) {
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIt = useCallback(async () => {
    if (!purchaseId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getPurchaseById(purchaseId);
      setPurchase(data);
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Failed to load purchase");
    } finally {
      setLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => { fetchIt(); }, [fetchIt]);

  return { purchase, loading, error, refetch: fetchIt };
}

export function useCompra(compraId: number | null) {
  const { purchase, ...rest } = usePurchase(compraId);
  return { compra: purchase, ...rest };
}
