"use client";
import { useState, useCallback } from "react";
import { deleteInvestment } from "@/services/sales/investment.api";

export function useDeleteInvestment(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const remove = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteInvestment(id);
      onSuccess?.();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { remove, loading, error };
}
