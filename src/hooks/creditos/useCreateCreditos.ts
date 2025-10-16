"use client";
import { useState, useCallback } from "react";
import { createCredito } from "@/services/sales/creditos.api";
import type { Credito, CreditoCreate } from "@/types/creditos";

export function useCreateCredito(onSuccess?: (c: Credito) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(async (payload: CreditoCreate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createCredito(payload);
      onSuccess?.(res);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { create: mutate, loading, error };
}
