"use client";
import { useState, useCallback } from "react";
import { deleteCredito } from "@/services/sales/creditos.api";

export function useDeleteCredito(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteCredito(id);
      onSuccess?.();
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { remove: mutate, loading, error };
}
