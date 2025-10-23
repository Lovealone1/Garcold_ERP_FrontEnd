"use client";
import { useState } from "react";
import { createPurchasePayment } from "@/services/sales/purchase.api";
import type { PurchasePaymentCreate, PurchasePayment } from "@/types/purchase";

export function useCreatePurchasePayment() {
  const [loading, setLoading] = useState(false);

  async function create(payload: PurchasePaymentCreate): Promise<PurchasePayment> {
    setLoading(true);
    try {
      return await createPurchasePayment(payload);
    } finally {
      setLoading(false);
    }
  }

  return { create, loading };
}

// compat
export function useCreatePagoCompra() {
  const { create, loading } = useCreatePurchasePayment();
  return { create, loading };
}
