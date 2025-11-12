"use client";
import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deleteSalePayment } from "@/services/sales/sale.api";
import type { Sale } from "@/types/sale";

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

export function useDeletePagoVenta() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(paymentId: number, saleId: number, amount: number): Promise<boolean> {
    setLoading(true);
    setError(null);
    try {
      const ok = await deleteSalePayment(paymentId);

      qc.setQueriesData<InfiniteData<Page>>({ queryKey: ["sales"] }, curr =>
        patchSaleById(curr, saleId, (s) => {
          const prev = Number(s.remaining_balance ?? 0);
          const newRem = Math.max(prev + (Number(amount) || 0), 0);
          return {
            ...s,
            remaining_balance: newRem,
            status: newRem > 0 ? "Venta credito" : s.status,
          };
        })
      );

      qc.invalidateQueries({ queryKey: ["sales"], refetchType: "active" });
      qc.invalidateQueries({ queryKey: ["sale-payments", { saleId }], refetchType: "active" });
      qc.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });

      return !!ok;
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? e?.message ?? "Error eliminando pago");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { remove, loading, error };
}
