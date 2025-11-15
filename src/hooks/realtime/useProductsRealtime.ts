"use client";

import { useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRealtime } from "./useRealtime";
import type { ProductPageDTO } from "@/types/product";

type ProductInfinite = InfiniteData<ProductPageDTO>;

function stripProductId(
  data: ProductInfinite | undefined,
  id: number
): ProductInfinite | undefined {
  if (!data) return data;
  let removed = false;

  const pages = data.pages.map((p) => {
    const filtered = (p.items ?? []).filter((x) => x.id !== id);
    if (filtered.length !== (p.items?.length ?? 0)) removed = true;
    return { ...p, items: filtered };
  });

  if (!removed) return data;
  return { ...data, pages };
}

type ProductEvent = {
  resource: "product";
  action: "created" | "updated" | "deleted";
  payload: { id: number | string };
};

function isProductEvent(m: unknown): m is ProductEvent {
  if (!m || typeof m !== "object") return false;
  const r = m as Record<string, unknown>;
  if (r.resource !== "product") return false;
  if (r.action !== "created" && r.action !== "updated" && r.action !== "deleted") {
    return false;
  }
  const p = r.payload as unknown;
  if (!p || typeof p !== "object") return false;
  if (!("id" in (p as Record<string, unknown>))) return false;
  return true;
}

export function useProductsRealtime() {
  const qc = useQueryClient();

  const onMsg = useCallback(
    (m: unknown) => {
      if (!isProductEvent(m)) return;

      const productId = Number(m.payload.id);
      if (!productId || Number.isNaN(productId)) return;

      if (m.action === "deleted") {
        qc.setQueriesData<ProductInfinite>(
          { queryKey: ["products"] },
          (curr) => stripProductId(curr, productId)
        );
      }

      qc.invalidateQueries({
        queryKey: ["products"],
        refetchType: "active",
      });

      qc.invalidateQueries({
        queryKey: ["all-products"],
        refetchType: "active",
      });
    },
    [qc]
  );

  useRealtime(onMsg);
}
