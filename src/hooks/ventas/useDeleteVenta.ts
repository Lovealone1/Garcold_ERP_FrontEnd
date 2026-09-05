// hooks/ventas/useDeleteVenta.ts
"use client";
import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deleteSale } from "@/services/sales/sale.api";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import type { Sale } from "@/types/sale";

type SalePage = { items: Sale[]; page: number; page_size: number; total?: number; total_pages?: number; has_next?: boolean };
type Tx = { id: number; sale_id?: number | null };
type TxPage = { items: Tx[]; page: number; page_size: number; total?: number; total_pages?: number; has_next?: boolean };

function stripSaleFromInfinite(data: InfiniteData<SalePage> | undefined, saleId: number) {
  // setQueriesData matches every query under the prefix, including any that
  // is not an infinite list. Bail out instead of throwing past the mutation.
  if (!data || !Array.isArray(data.pages)) return data;
  let removed = false;
  const pages = data.pages.map((p) => {
    const filtered = p.items?.filter((x) => x.id !== saleId) ?? [];
    if (filtered.length !== (p.items?.length ?? 0)) removed = true;
    return { ...p, items: filtered };
  });
  if (!removed) return data;

  const first = pages[0];
  const total = Math.max(0, (first.total ?? 0) - 1);
  const pageSize = first.page_size || 1;
  const total_pages = Math.max(1, Math.ceil(total / pageSize));
  return { ...data, pages: pages.slice(0, total_pages), pageParams: data.pageParams } as InfiniteData<SalePage>;
}

function stripTransactionsBySaleId(data: InfiniteData<TxPage> | undefined, saleId: number) {
  // setQueriesData matches every query under the prefix, including any that
  // is not an infinite list. Bail out instead of throwing past the mutation.
  if (!data || !Array.isArray(data.pages)) return data;
  let removed = false;
  const pages = data.pages.map((p) => {
    const filtered = (p.items ?? []).filter((t) => Number(t.sale_id) !== Number(saleId));
    if (filtered.length !== (p.items?.length ?? 0)) removed = true;
    return { ...p, items: filtered };
  });
  if (!removed) return data;

  const first = pages[0];
  const total = Math.max(0, (first.total ?? 0) - 1); // aprox; el refetch corrige
  const pageSize = first.page_size || 1;
  const total_pages = Math.max(1, Math.ceil(total / pageSize));
  return { ...data, pages: pages.slice(0, total_pages), pageParams: data.pageParams } as InfiniteData<TxPage>;
}

export function useDeleteVenta() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(id: number) {
    setLoading(true);
    setError(null);
    try {
      await deleteSale(id);

      // Ventas: quitar optimista
      qc.setQueriesData<InfiniteData<SalePage>>({ queryKey: ["sales"] }, (curr) => stripSaleFromInfinite(curr, id));

      // Transacciones: quitar optimista por sale_id
      qc.setQueriesData<InfiniteData<TxPage>>({ queryKey: ["transactions"] }, (curr) =>
        stripTransactionsBySaleId(curr, id)
      );

      // Reverting a sale also reverts stock, profit, the bank balance and --
      // on credit -- the customer balance, so the whole matrix has to run.
      await invalidateMovement(qc, { kind: "sale" });

    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e?.message ?? "Error eliminando venta";
      setError(msg);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { deleteVenta: handleDelete, loading, error };
}
