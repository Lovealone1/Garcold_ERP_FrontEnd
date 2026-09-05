"use client";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createSalePayment } from "@/services/sales/sale.api";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import type { SalePaymentCreate } from "@/types/sale";

export function useCreatePagoVenta() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(payload: SalePaymentCreate) {
    setLoading(true);
    setError(null);

    try {
      const res = await createSalePayment(payload);
      const saleId = Number(payload.sale_id);

      await invalidateMovement(qc, { kind: "sale_payment", ids: { saleId } });

      return res;
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ??
        e?.message ??
        "Error creando pago"
      );
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { create, loading, error };
}
