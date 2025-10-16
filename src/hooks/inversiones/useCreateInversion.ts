"use client";
import { useState, useCallback } from "react";
import { createInversion } from "@/services/sales/inversiones.api";
import type { Inversion, InversionCreate } from "@/types/inversiones";

export function useCreateInversion(onSuccess?: (i: Inversion) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(async (payload: InversionCreate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createInversion(payload);
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
