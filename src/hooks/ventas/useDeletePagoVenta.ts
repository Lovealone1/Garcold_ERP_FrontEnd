"use client";
import { useState } from "react";
import { deleteSalePayment } from "@/services/sales/sale.api";

export function useDeletePagoVenta() {
  const [loading, setLoading] = useState(false);

  async function remove(pagoId: number): Promise<boolean> {
    setLoading(true);
    try {
      await deleteSalePayment(pagoId);
      return true;
    } finally {
      setLoading(false);
    }
  }

  return { remove, loading };
}
