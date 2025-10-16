"use client";
import { useState, useCallback } from "react";
import { deleteInversion } from "@/services/sales/inversiones.api";

export function useDeleteInversion(onSuccess?: () => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await deleteInversion(id);
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
