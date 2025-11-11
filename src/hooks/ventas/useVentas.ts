// useVentas.ts
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { listSales } from "@/services/sales/sale.api";
import type { Sale, SalePage } from "@/types/sale";

type Filters = {
  q?: string;
  estado?: string;
  banco?: string;
  from?: string;
  to?: string;
};

export function useVentas(initialFilters: Filters = {}, pageSize = 8) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const key = useMemo(
    () =>
      [
        "sales",
        {
          q: filters.q || "",
          estado: filters.estado || "",
          banco: filters.banco || "",
          from: filters.from || "",
          to: filters.to || "",
          pageSize,
        },
      ] as const,
    [filters.q, filters.estado, filters.banco, filters.from, filters.to, pageSize]
  );

  const query = useInfiniteQuery({
    queryKey: key,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal, queryKey }) => {
      const [, f] = queryKey as typeof key;
      return listSales(pageParam, {
        signal,
        page_size: f.pageSize,
        q: f.q || undefined,
        status: f.estado || undefined,
        bank: f.banco || undefined,
        from: f.from || undefined,
        to: f.to || undefined,
      });
    },
    getNextPageParam: (last) => {
      const cur = last.page ?? 1;
      if (last.has_next === true) return cur + 1;
      if (typeof last.total_pages === "number" && cur < last.total_pages)
        return cur + 1;
      if (
        Array.isArray(last.items) &&
        last.page_size &&
        last.items.length === last.page_size
      )
        return cur + 1;
      return undefined;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24 * 3,
  });


  // autoprefetch
  useEffect(() => {
    let cancelled = false;

    const pump = async () => {
      if (query.isLoading || query.isFetchingNextPage) return;
      if (!query.hasNextPage) return;

      while (!cancelled && query.hasNextPage) {
        const res = await query.fetchNextPage({ cancelRefetch: true });
        if (cancelled) return;

        const pages = res.data?.pages ?? query.data?.pages;
        if (!pages || pages.length === 0) break;

        const last = pages[pages.length - 1];
        const canContinue =
          last?.has_next === true ||
          (typeof last?.total_pages === "number" &&
            pages.length < last.total_pages) ||
          (Array.isArray(last?.items) &&
            last.page_size &&
            last.items.length === last.page_size);

        if (!canContinue) break;
      }
    };

    void pump();

    return () => {
      cancelled = true;
    };
  }, [query.hasNextPage, query.isLoading, query.isFetchingNextPage, key]);

  // reset página al cambiar filtros
  useEffect(() => {
    setPage(1);
  }, [filters.q, filters.estado, filters.banco, filters.from, filters.to]);

  const pages = query.data?.pages ?? [];

  const serverTotal = pages[0]?.total;
  const serverPageSize = pages[0]?.page_size ?? pageSize;
  const serverTotalPages =
    typeof serverTotal === "number"
      ? Math.max(1, Math.ceil(serverTotal / serverPageSize))
      : undefined;

  const all: Sale[] = useMemo(
    () => pages.flatMap((p) => p.items ?? []),
    [pages]
  );

  const totalClient = all.length;
  const localTotalPages = Math.max(1, Math.ceil(totalClient / pageSize));
  const uiTotalPages = serverTotalPages ?? localTotalPages;

  const safePage = Math.min(page, uiTotalPages || 1);

  const items = useMemo(
    () =>
      all.slice(
        (safePage - 1) * pageSize,
        (safePage - 1) * pageSize + pageSize
      ),
    [all, safePage, pageSize]
  );

  const reload = () =>
    qc.invalidateQueries({
      queryKey: ["sales"],
      refetchType: "active", // o "all" si quieres refetch también de queries inactivas
    });

  const loadedCount = pages.reduce(
    (a, p) => a + (p.items?.length ?? 0),
    0
  );
  const hasMoreServer = !!serverTotal
    ? loadedCount < serverTotal
    : !!query.hasNextPage;

  const isFetchingMore = query.isFetchingNextPage;

  const loadMore = () => {
    if (hasMoreServer && !isFetchingMore) {
      return query.fetchNextPage({ cancelRefetch: true });
    }
    return Promise.resolve();
  };

  return {
    items,
    page: safePage,
    setPage,
    pageSize,
    total: serverTotal ?? totalClient,
    totalPages: uiTotalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < uiTotalPages,
    loading:
      query.isLoading || (query.isFetching && !query.isFetched),
    error: query.isError ? query.error?.message ?? "Error" : null,
    reload,
    loadMore,
    hasMoreServer,
    isFetchingMore,
    filters,
    setFilters,
    serverTotal,
    serverTotalPages: uiTotalPages,
  };
}
