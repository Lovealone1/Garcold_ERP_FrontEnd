"use client";
import { useCallback, useState } from "react";
import type { Investment } from "@/types/investment";
import type { InvestmentWithdrawIn } from "@/types/investment";
import { withdrawInvestment } from "@/services/sales/investment.api";

type WithdrawResult = Investment | { deleted: true; investment_id: number };

export function useWithdrawInversion() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<WithdrawResult | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(async (payload: InvestmentWithdrawIn) => {
    setLoading(true);
    setError(null);
    try {
      const res = await withdrawInvestment(payload);
      setData(res);
      return res;
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to withdraw investment");
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { run, loading, data, error, reset };
}