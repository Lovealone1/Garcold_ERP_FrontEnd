"use client";
import { useState, useCallback } from "react";
import { updateLoanAmount } from "@/services/sales/loan.api";
import type { Loan, LoanUpdateAmount } from "@/types/loan";

export function useUpdateLoan(onSuccess?: (l: Loan) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const update = useCallback(async (id: number, payload: LoanUpdateAmount) => {
    setLoading(true);
    setError(null);
    try {
      const res = await updateLoanAmount(id, payload);
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
