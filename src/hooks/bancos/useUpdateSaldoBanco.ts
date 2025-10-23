"use client";

import { useState } from "react";
import type { Bank } from "@/types/bank";
import { updateBankBalance } from "@/services/sales/bank.api";

export function useUpdateSaldoBanco(onSuccess?: (bank: Bank) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function updateSaldo(id: number, nuevo_saldo: number): Promise<Bank> {
    setLoading(true);
    setError(null);
    try {
      const bank = await updateBankBalance(id, nuevo_saldo);
      onSuccess?.(bank);
      return bank;
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Error actualizando saldo del banco";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { updateSaldo, loading, error };
}
