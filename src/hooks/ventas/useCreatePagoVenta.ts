"use client";
import { useState } from "react";
import { createSalePayment } from "@/services/sales/sale.api";
import type { SalePaymentCreate, SalePayment } from "@/types/sale";

export function useCreatePagoVenta() {
  const [loading, setLoading] = useState(false);

  async function create(payload: SalePaymentCreate): Promise<SalePayment> {
    setLoading(true);
    try {
      return await createSalePayment(payload);
    } finally {
      setLoading(false);
    }
  }

  return { create, loading };
}
