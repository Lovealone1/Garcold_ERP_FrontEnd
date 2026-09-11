"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { createPurchasePayment } from "@/services/sales/purchase.api";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import { queryKeys } from "@/lib/query/queryKeys";
import type {
  PurchasePaymentCreate,
  PurchasePayment,
  Purchase,
  PurchasePage,
} from "@/types/purchase";

function patchPurchaseById(
  data: PurchasePage | undefined,
  purchaseId: number,
  updater: (p: Purchase) => Purchase
): PurchasePage | undefined {
  if (!data || !Array.isArray(data.items)) return data;
  return {
    ...data,
    items: data.items.map((purchase) =>
      purchase.id === purchaseId ? updater(purchase) : purchase
    ),
  };
}

export function useCreatePurchasePayment() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(payload: PurchasePaymentCreate): Promise<PurchasePayment> {
    setLoading(true);
    setError(null);
    try {
      const res = await createPurchasePayment(payload);

      const purchaseId = Number(payload.purchase_id);
      const amount = Number(payload.amount) || 0;

      qc.setQueriesData<PurchasePage>({ queryKey: queryKeys.purchases.all }, (curr) =>
        patchPurchaseById(curr, purchaseId, (p) => {
          const prev = Number(p.balance ?? 0);
          const newRem = Math.max(prev - amount, 0);
          return {
            ...p,
            balance: newRem,
          };
        })
      );

      await invalidateMovement(qc, {
        kind: "purchase_payment",
        ids: { purchaseId },
      });

      return res;
    } catch (e: any) {
      setError(
        e?.response?.data?.detail ??
        e?.message ??
        "Error creando pago de compra"
      );
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { create, loading, error };
}

export function useCreatePagoCompra() {
  const { create, loading, error } = useCreatePurchasePayment();
  return { create, loading, error };
}
