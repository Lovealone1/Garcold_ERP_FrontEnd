"use client";
import { useState, useCallback } from "react";
import { updateInvestmentBalance } from "@/services/sales/investment.api";
import type { Investment, InvestmentUpdateBalance } from "@/types/investment";

export function useUpdateInvestment(onSuccess?: (i: Investment) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const update = useCallback(async (id: number, payload: InvestmentUpdateBalance) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateInvestmentBalance(id, payload);
      onSuccess?.(res);
      return res;
    } catch (e) {
      setError(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [onSuccess]);

  return { update, loading, error };
}
