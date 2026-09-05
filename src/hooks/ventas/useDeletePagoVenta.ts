"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deleteSalePayment } from "@/services/sales/sale.api";
import { invalidateMovement } from "@/lib/query/invalidateMovement";

export function useDeletePagoVenta() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(paymentId: number, saleId: number): Promise<boolean> {
    setLoading(true);
    setError(null);

    try {
      const ok = await deleteSalePayment(paymentId);

      await invalidateMovement(qc, { kind: "sale_payment", ids: { saleId } });

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
