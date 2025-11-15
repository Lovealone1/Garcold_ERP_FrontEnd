"use client";
import { useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRealtime } from "./useRealtime";
import type { Sale } from "@/types/sale";

type SalePage = { items: Sale[]; page: number; page_size: number; total?: number; total_pages?: number; has_next?: boolean };
type Tx = { id: number; sale_id?: number | null };
type TxPage = { items: Tx[]; page: number; page_size: number; total?: number; total_pages?: number; has_next?: boolean };

function stripId<T extends { id: number }>(data: InfiniteData<{ items: T[]; page: number; page_size: number }> | undefined, id: number) {
  if (!data) return data;
  let removed = false;
  const pages = data.pages.map(p => {
    const filtered = (p.items ?? []).filter(x => x.id !== id);
    if (filtered.length !== (p.items?.length ?? 0)) removed = true;
    return { ...p, items: filtered };
  });
  if (!removed) return data;
  return { ...data, pages, pageParams: data.pageParams } as typeof data;
}

function stripTxBySaleId(data: InfiniteData<TxPage> | undefined, saleId: number) {
  if (!data) return data;
  let removed = false;
  const pages = data.pages.map(p => {
    const filtered = (p.items ?? []).filter(t => Number(t.sale_id) !== Number(saleId));
    if (filtered.length !== (p.items?.length ?? 0)) removed = true;
    return { ...p, items: filtered };
  });
  if (!removed) return data;
  return { ...data, pages, pageParams: data.pageParams } as InfiniteData<TxPage>;
}

function isSaleDeleted(m: unknown): m is { resource: "sale"; action: "deleted"; payload: { id: number | string } } {
  if (!m || typeof m !== "object") return false;
  const r = m as Record<string, unknown>;
  if (r.resource !== "sale" || r.action !== "deleted") return false;
  const p = r.payload as unknown;
  return !!p && typeof p === "object" && "id" in (p as Record<string, unknown>);
}

export function useSalesRealtime() {
  const qc = useQueryClient();

  const onMsg = useCallback((m: unknown) => {
    if (!isSaleDeleted(m)) return;

    const saleId = Number((m.payload as any).id);

    qc.setQueriesData<InfiniteData<SalePage>>({ queryKey: ["sales"] }, curr => stripId(curr, saleId));
    qc.invalidateQueries({ queryKey: ["sales"], refetchType: "active" });

    qc.setQueriesData<InfiniteData<TxPage>>({ queryKey: ["transactions"] }, curr => stripTxBySaleId(curr, saleId));
    qc.invalidateQueries({
      predicate: ({ queryKey }) => Array.isArray(queryKey) && queryKey[0] === "transactions",
      refetchType: "active",
    });
  }, [qc]);

  useRealtime(onMsg);
}
