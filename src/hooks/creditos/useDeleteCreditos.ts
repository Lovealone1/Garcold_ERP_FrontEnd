"use client";
import { useState, useCallback } from "react";
import { deleteLoan } from "@/services/sales/loan.api";

export function useDeleteLoan(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const remove = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteLoan(id);
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
