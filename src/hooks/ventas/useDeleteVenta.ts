"use client";
import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deleteSale } from "@/services/sales/sale.api";
import type { Sale } from "@/types/sale";

type Page = {
  items: Sale[];
  page: number;
  page_size: number;
  total?: number;
  total_pages?: number;
  has_next?: boolean;
};

export function useDeleteVenta() {
  const qc = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function stripIdFromInfinite(
    data: InfiniteData<Page> | undefined,
    id: number
  ) {
    if (!data) return data;
    let removed = false;
    const pages = data.pages.map((p) => {
      const filtered = p.items?.filter((x) => x.id !== id) ?? [];
      if (filtered.length !== (p.items?.length ?? 0)) removed = true;
      return { ...p, items: filtered };
    });
    if (!removed) return data;

    const first = pages[0];
    const total = Math.max(0, (first.total ?? 0) - 1);
    const pageSize = first.page_size || 1;
    const total_pages = Math.max(1, Math.ceil(total / pageSize));
    const trimmed = pages.slice(0, total_pages);

    return { ...data, pages: trimmed, pageParams: data.pageParams } as InfiniteData<Page>;
  }

  async function handleDelete(id: number) {
    setLoading(true);
    setError(null);
    try {
      await deleteSale(id);

      qc.setQueriesData<InfiniteData<Page>>(
        { queryKey: ["sales"] },
        (curr) => stripIdFromInfinite(curr, id)
      );

      qc.invalidateQueries({
        queryKey: ["sales"],
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
