"use client";
import { useState, useCallback } from "react";
import { updateCreditoMonto } from "@/services/sales/creditos.api";
import type { Credito, CreditoUpdateMonto } from "@/types/creditos";

export function useUpdateCredito(onSuccess?: (c: Credito) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(async (id: number, payload: CreditoUpdateMonto) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateCreditoMonto(id, payload);
      onSuccess?.(res);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { update: mutate, loading, error };
}
