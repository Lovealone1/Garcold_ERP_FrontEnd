"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listAllProducts } from "@/services/sales/product.api";
import type { ProductDTO } from "@/types/product";

type Option = { value: number; label: string };

export function useProductosAll(initialForce?: number) {
  const qc = useQueryClient();

  const [forceTs, setForceTs] = useState<number | undefined>(initialForce);

  const key = useMemo(
    () => ["all-products", { force: forceTs ?? 0 }] as const,
    [forceTs]
  );

  const query = useQuery<ProductDTO[]>({
    queryKey: key,
    queryFn: async ({ signal, queryKey }) => {
      const [, meta] = queryKey;
      const nocacheToken =
        typeof (meta as any)?.force === "number" && (meta as any).force > 0
          ? Date.now()
          : undefined;
      return listAllProducts({ signal, nocacheToken });
    },
    staleTime: 1000 * 60 * 60,
    gcTime: 1000 * 60 * 60 * 24 * 3,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const items = query.data ?? [];
  const options: Option[] = useMemo(
    () =>
      items.map((p) => ({
        value: p.id,
        label: p.description
          ? `${p.reference} — ${p.description}`
          : p.reference,
      })),
    [items]
  );
  const invalidate = () =>
    qc.invalidateQueries({
      queryKey: ["all-products"],
      refetchType: "active",
    });

  const reload = () => setForceTs(Date.now());

  const primeFromPages = (allProducts: ProductDTO[]) => {
    qc.setQueryData<ProductDTO[]>(["all-products", { force: 0 }], allProducts);
  };

  return {
    items,
    options,
    loading: query.isLoading || query.isFetching,
    error: query.isError ? (query.error as Error).message : null,
    reload,
    invalidate,
    primeFromPages,
  };
}
