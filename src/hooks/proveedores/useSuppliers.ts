"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { listSuppliers } from "@/services/sales/supplier.api";
import type { Supplier, SupplierPage } from "@/types/supplier";

type Filters = { q?: string; cities?: string[] };

export function useSuppliers(pageSize = 8) {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ q: "" });

  const key = useMemo(
    () =>
      [
        "suppliers",
        {
          pageSize,
        },
      ] as const,
    [pageSize]
  );

  const query = useInfiniteQuery<
    SupplierPage,
    Error,
    InfiniteData<SupplierPage>,
    typeof key,
    number
  >({
    queryKey: key,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal, queryKey }) => {
      const [, f] = queryKey;
      return listSuppliers(pageParam, {
        signal,
        page_size: f.pageSize,
      });
    },
    getNextPageParam: (last) => {
      const cur = last.page ?? 1;
      if (last.has_next === true) return cur + 1;
      if (typeof last.total_pages === "number" && cur < last.total_pages) {
        return cur + 1;
      }
      if (
        Array.isArray(last.items) &&
        last.page_size &&
        last.items.length === last.page_size
      ) {
        return cur + 1;
      }
      return undefined;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24 * 3,
  });

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
  }, [
    query.hasNextPage,
    query.isLoading,
    query.isFetchingNextPage,
    key,
    query.fetchNextPage,
  ]);

  useEffect(() => {
    setPage(1);
  }, [filters.q, filters.cities]);

  const pages = query.data?.pages ?? [];
  const serverTotal = pages[0]?.total;
  const serverPageSize = pages[0]?.page_size ?? pageSize;
  const serverTotalPages =
    typeof serverTotal === "number"
      ? Math.max(1, Math.ceil(serverTotal / serverPageSize))
      : undefined;

  const allServer: Supplier[] = useMemo(
    () => pages.flatMap((p) => p.items ?? []),
    [pages]
  );

  const v = (filters.q ?? "").trim().toLowerCase();
  const filteredExceptCity = useMemo(() => {
    if (!v) return allServer;
    return allServer.filter((c) => {
      const name = c.name?.toLowerCase() ?? "";
      const taxId = (c.tax_id ?? "").toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      const phone = (c.phone ?? "").toLowerCase();
      return (
        name.includes(v) ||
        taxId.includes(v) ||
        email.includes(v) ||
        phone.includes(v)
      );
    });
  }, [allServer, v]);

  const options = useMemo(() => {
    const cities = Array.from(
      new Set(
        filteredExceptCity
          .map((c) => c.city)
          .filter((x): x is string => Boolean(x))
      )
    ).sort();
    return { cities };
  }, [filteredExceptCity]);

  const filtered = useMemo(() => {
    if (!filters.cities?.length) return filteredExceptCity;
    const set = new Set(filters.cities.map(String));
    return filteredExceptCity.filter((c) => set.has(String(c.city)));
  }, [filteredExceptCity, filters.cities]);

  const totalClient = filtered.length;
  const localTotalPages = Math.max(
    1,
    Math.ceil(totalClient / serverPageSize)
  );
  const totalPages = serverTotalPages ?? localTotalPages;

  const safePage = Math.min(page, totalPages || 1);

  const items = useMemo(() => {
    const start = (safePage - 1) * serverPageSize;
    return filtered.slice(start, start + serverPageSize);
  }, [filtered, safePage, serverPageSize]);

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

  const reload = () =>
    qc.invalidateQueries({
      queryKey: ["suppliers"],
      refetchType: "active",
    });

  const upsertOne = useCallback(
    (patch: Partial<Supplier> & { id: number }) => {
      qc.setQueryData<InfiniteData<SupplierPage>>(key, (data) => {
        if (!data) return data;
        const nextPages = data.pages.map((pg) => {
          const items = pg.items.map((it) =>
            it.id === patch.id ? { ...it, ...patch } : it
          );
          return { ...pg, items };
        });
        return { ...data, pages: nextPages };
      });
    },
    [qc, key]
  );

  return {
    loading:
      query.isLoading || (query.isFetching && !query.isFetched),
    items,
    page: safePage,
    setPage,
    pageSize: serverPageSize,
    total: serverTotal ?? totalClient,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    filters,
    setFilters,
    options,
    reload,
    upsertOne,
    hasMoreServer,
    isFetchingMore,
    loadMore,
    error: query.isError ? query.error?.message ?? "Error" : null,
  };
}
