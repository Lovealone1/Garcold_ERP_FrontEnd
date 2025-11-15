// hooks/ventas/useDeleteVenta.ts
"use client";
import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deleteSale } from "@/services/sales/sale.api";
import type { Sale } from "@/types/sale";

type SalePage = { items: Sale[]; page: number; page_size: number; total?: number; total_pages?: number; has_next?: boolean };
type Tx = { id: number; sale_id?: number | null };
type TxPage = { items: Tx[]; page: number; page_size: number; total?: number; total_pages?: number; has_next?: boolean };

function stripSaleFromInfinite(data: InfiniteData<SalePage> | undefined, saleId: number) {
  if (!data) return data;
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
  if (!data) return data;
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

      // Refetch 1→n en background para TODAS las variantes de claves
      qc.invalidateQueries({
        queryKey: ["sales"],
        refetchType: "all",
      });

      qc.invalidateQueries({
        queryKey: ["products"],
        refetchType: "active",
      });

      qc.invalidateQueries({
        queryKey: ["all-products"],
        refetchType: "active",
      });
      qc.invalidateQueries({
        predicate: ({ queryKey }) => Array.isArray(queryKey) && queryKey[0] === "transactions",
        refetchType: "active",
      });

      qc.invalidateQueries({
          queryKey: ["profits"],
          refetchType: "active",
        });

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
