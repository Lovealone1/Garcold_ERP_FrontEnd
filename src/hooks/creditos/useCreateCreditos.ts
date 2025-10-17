"use client";
import { useState, useCallback } from "react";
import { createLoan } from "@/services/sales/loan.api";
import type { Loan, LoanCreate } from "@/types/loan";

export function useCreateLoan(onSuccess?: (l: Loan) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const create = useCallback(async (payload: LoanCreate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createLoan(payload);
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
