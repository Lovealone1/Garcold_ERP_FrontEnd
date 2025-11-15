"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteSalePayment } from "@/services/sales/sale.api";

export function useDeletePagoVenta() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(paymentId: number, saleId: number): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const ok = await deleteSalePayment(paymentId);

      qc.invalidateQueries({
        queryKey: ["sale-payments", { saleId }],
        refetchType: "active",
      });

      qc.invalidateQueries({
        predicate: ({ queryKey }) =>
          Array.isArray(queryKey) && queryKey[0] === "sales",
        refetchType: "active",
      });

      qc.invalidateQueries({
        predicate: ({ queryKey }) =>
          Array.isArray(queryKey) && queryKey[0] === "transactions",
        refetchType: "active",
      });

      return !!ok;
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ??
        e?.message ??
        "Error eliminando pago"
      );
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { remove, loading, error };
}
