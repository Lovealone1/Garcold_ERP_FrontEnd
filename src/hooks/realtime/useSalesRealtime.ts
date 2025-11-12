"use client";
import { useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRealtime } from "./useRealtime";
import type { Sale } from "@/types/sale";

type Page = {
  items: Sale[];
  page: number;
  page_size: number;
  total?: number;
  total_pages?: number;
  has_next?: boolean;
};

function stripId(data: InfiniteData<Page> | undefined, id: number) {
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

  return { ...data, pages: pages.slice(0, total_pages), pageParams: data.pageParams } as InfiniteData<Page>;
}

function isSaleDeleted(m: unknown): m is { resource: "sale"; action: "deleted"; payload: { id: number | string } } {
  if (!m || typeof m !== "object") return false;
  const r = m as Record<string, unknown>;
  if (r.resource !== "sale" || r.action !== "deleted") return false;
  const p = r.payload as unknown;
  if (!p || typeof p !== "object") return false;
  return "id" in (p as Record<string, unknown>);
}

export function useSalesRealtime() {
  const qc = useQueryClient();

  const onMsg = useCallback((m: unknown) => {
    if (!isSaleDeleted(m)) return;

    const id = Number((m.payload as { id: number | string }).id);
    if (Number.isNaN(id)) {
      qc.invalidateQueries({ queryKey: ["sales"], refetchType: "active" });
      return;
    }

    qc.setQueriesData<InfiniteData<Page>>({ queryKey: ["sales"] }, (curr) => stripId(curr, id));
    qc.invalidateQueries({ queryKey: ["sales"], refetchType: "active" });
  }, [qc]);

  useRealtime(onMsg);
}
