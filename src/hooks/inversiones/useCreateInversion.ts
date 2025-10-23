"use client";
import { useState, useCallback } from "react";
import { createInvestment } from "@/services/sales/investment.api";
import type { Investment, InvestmentCreate } from "@/types/investment";

export function useCreateInvestment(onSuccess?: (i: Investment) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const create = useCallback(async (payload: InvestmentCreate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createInvestment(payload);
      onSuccess?.(res);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { create, loading, error };
}
