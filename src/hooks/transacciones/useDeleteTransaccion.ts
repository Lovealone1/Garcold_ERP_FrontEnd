// useDeleteTransaction.ts
"use client";
import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deleteTransaction } from "@/services/sales/transaction.api";

type Tx = { id: number };
type Page = {
  items: Tx[];
  page: number;
  page_size: number;
  total?: number;
  total_pages?: number;
  has_next?: boolean;
};

function removeTxFromInfinite(data: InfiniteData<Page> | undefined, id: number) {
  if (!data) return data;

  let removed = false;
  const pages = data.pages.map((p) => {
    const filtered = (p.items ?? []).filter((x) => x.id !== id);
    if (filtered.length !== (p.items?.length ?? 0)) removed = true;
    return { ...p, items: filtered };
  });

  if (!removed) return data;

  const first = pages[0];
  const total = Math.max(0, (first.total ?? 0) - 1);
  const pageSize = first.page_size || 10;
  const total_pages = Math.max(1, Math.ceil(total / pageSize));

  return {
    ...data,
    pages: pages.slice(0, total_pages),
    pageParams: [1],
  } as InfiniteData<Page>;
}

export function useDeleteTransaction() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async (transactionId: number): Promise<string> => {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteTransaction(transactionId);

      // 1) Limpia el item localmente
      qc.setQueriesData<InfiniteData<Page>>(
        { queryKey: ["transactions"] },
        (curr) => removeTxFromInfinite(curr, transactionId)
      );

      // 2) Colapsa la cache a la primera página
      qc.setQueriesData<InfiniteData<Page>>(
        { queryKey: ["transactions"] },
        (curr) => (curr && curr.pages?.length ? { pages: [curr.pages[0]], pageParams: [1] } as InfiniteData<Page> : curr)
      );

      await qc.refetchQueries({ queryKey: ["transactions"], type: "active" });

      return res.message ?? "Transacción eliminada";
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ??
        e?.message ??
        "Error al eliminar la transacción";
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { remove, loading, error };
}
