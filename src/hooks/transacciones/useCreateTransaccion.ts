// hooks/transactions/useCreateTransaction.ts
"use client";
import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import { createTransaction } from "@/services/sales/transaction.api";
import type { TransactionCreate, TransactionCreated } from "@/types/transaction";

export function useCreateTransaction() {
  const qc = useQueryClient();
  const { success, error: notifyError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const create = useCallback(async (payload: TransactionCreate): Promise<TransactionCreated> => {
    setLoading(true);
    setError(null);
    try {
      const tx = await createTransaction(payload);
      success("Transacción creada correctamente");

      // Cliente que crea → refresca head y tail activos
      qc.invalidateQueries({ queryKey: ["transactions-head"], refetchType: "active" });
      qc.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });
      return tx;
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Error al crear la transacción";
      setError(e); notifyError(msg); throw e;
    } finally {
      setLoading(false);
    }
  }, [qc, success, notifyError]);

  return { create, loading, error };
}
