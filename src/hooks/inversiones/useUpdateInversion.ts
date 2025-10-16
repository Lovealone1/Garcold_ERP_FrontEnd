"use client";
import { useState, useCallback } from "react";
import { updateInversionSaldo } from "@/services/sales/inversiones.api";
import type { Inversion, InversionUpdateSaldo } from "@/types/inversiones";

export function useUpdateInversion(onSuccess?: (i: Inversion) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(async (id: number, payload: InversionUpdateSaldo) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateInversionSaldo(id, payload);
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
