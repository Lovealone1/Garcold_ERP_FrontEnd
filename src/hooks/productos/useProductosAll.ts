"use client";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listAllProducts } from "@/services/sales/product.api";
import type { ProductDTO } from "@/types/product";

type Option = { value: number; label: string };

export function useProductosAll(initialForce?: number) {
  const qc = useQueryClient();

  // tick para forzar bypass de HTTP cache cuando quieras
  const [forceTs, setForceTs] = useState<number | undefined>(initialForce);

  const key = useMemo(
    () => ["products", "all", { force: forceTs ?? 0 }] as const,
    [forceTs]
  );

  const query = useQuery<ProductDTO[]>({
    queryKey: key,
    queryFn: async ({ signal, queryKey }) => {
      const [, , meta] = queryKey;
      const nocacheToken =
        typeof (meta as any)?.force === "number" && (meta as any).force > 0
          ? Date.now()
          : undefined;
      return listAllProducts({ signal, nocacheToken });
    },
    // cache “largo” y sin refetches molestos
    staleTime: 1000 * 60 * 60,          // 1h “fresh”
    gcTime: 1000 * 60 * 60 * 24 * 3,  // 3 días en caché
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const items = query.data ?? [];
  const options: Option[] = useMemo(
    () =>
      items.map((p) => ({
        value: p.id,
        label: p.description ? `${p.reference} — ${p.description}` : p.reference,
      })),
    [items]
  );

  // invalida sin romper la key
  const invalidate = () => qc.invalidateQueries({ queryKey: ["products", "all"] });

  // fuerza bypass de HTTP cache (cambia la key con token)
  const reload = () => setForceTs(Date.now());

  // opcional: priming desde paginadas (si ya las tienes en memoria)
  const primeFromPages = (allProducts: ProductDTO[]) => {
    qc.setQueryData<ProductDTO[]>(["products", "all", { force: 0 }], allProducts);
  };

  return {
    items,
    options,
    loading: query.isLoading || query.isFetching,
    error: query.isError ? (query.error as Error).message : null,
    reload,        // fuerza ir a red con nocacheToken
    invalidate,    // marca stale y refetchea con política normal
    primeFromPages // si quieres sembrar desde el hook paginado
  };
}
