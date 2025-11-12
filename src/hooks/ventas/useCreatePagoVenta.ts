"use client";
import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { createSalePayment } from "@/services/sales/sale.api";
import type { SalePaymentCreate, Sale } from "@/types/sale";

type Page = { items: Sale[]; page: number; page_size: number; total?: number; total_pages?: number; has_next?: boolean };

function patchSaleById(
  data: InfiniteData<Page> | undefined,
  saleId: number,
  updater: (s: Sale) => Sale
): InfiniteData<Page> | undefined {
  if (!data) return data;
  const pages = data.pages.map(p => ({
    ...p,
    items: p.items.map(s => (s.id === saleId ? updater(s) : s)),
  }));
  return { ...data, pages, pageParams: data.pageParams } as InfiniteData<Page>;
}

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
      const amount = Number(payload.amount) || 0;

      qc.setQueriesData<InfiniteData<Page>>({ queryKey: ["sales"] }, curr =>
        patchSaleById(curr, saleId, (s) => {
          const prev = Number(s.remaining_balance ?? 0);
          const newRem = Math.max(prev - amount, 0);
          return {
            ...s,
            remaining_balance: newRem,
            status: newRem === 0 ? "Venta cancelada" : s.status,
          };
        })
      );

      qc.invalidateQueries({ queryKey: ["sales"], refetchType: "active" });
      qc.invalidateQueries({ queryKey: ["sale-payments", { saleId }], refetchType: "active" });

      return res;
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Error creando pago");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { create, loading, error };
}
