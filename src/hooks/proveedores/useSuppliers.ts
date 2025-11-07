"use client";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { listSuppliers } from "@/services/sales/supplier.api";
import type { Supplier, SupplierPage } from "@/types/supplier";

type Filters = { q?: string; cities?: string[] };

export function useSuppliers(pageSize = 10) {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ q: "" });

  const key = useMemo(
    () => ["suppliers", { q: filters.q || "", pageSize }] as const,
    [filters.q, pageSize]
  );

  const query = useInfiniteQuery<SupplierPage, Error, InfiniteData<SupplierPage>, typeof key, number>({
    queryKey: key,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal, queryKey }) => {
      const [, f] = queryKey;
      return listSuppliers(pageParam, { signal, q: f.q, page_size: f.pageSize });
    },
    getNextPageParam: (last) => {
      const cur = last.page ?? 1;
      if (last.has_next === true) return cur + 1;
      if (typeof last.total_pages === "number" && cur < last.total_pages) return cur + 1;
      if (Array.isArray(last.items) && last.items.length < (last.page_size ?? pageSize)) return undefined;
      return undefined;
    },
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 24 * 3,
  });

  const allServer: Supplier[] = useMemo(
    () => (query.data?.pages ?? []).flatMap((p) => p.items),
    [query.data]
  );

  const v = (filters.q ?? "").trim().toLowerCase();
  const filteredExceptCity = useMemo(() => {
    if (!v) return allServer;
    return allServer.filter((c) =>
      c.name.toLowerCase().includes(v) ||
      (c.tax_id ?? "").toLowerCase().includes(v) ||
      (c.email ?? "").toLowerCase().includes(v) ||
      (c.phone ?? "").toLowerCase().includes(v)
    );
  }, [allServer, v]);

  const options = useMemo(() => {
    const cities = Array.from(new Set(filteredExceptCity.map((c) => c.city).filter(Boolean)))
      .map(String)
      .sort();
    return { cities };
  }, [filteredExceptCity]);

  const filtered = useMemo(() => {
    if (!filters.cities?.length) return filteredExceptCity;
    const set = new Set(filters.cities.map(String));
    return filteredExceptCity.filter((c) => set.has(String(c.city)));
  }, [filteredExceptCity, filters.cities]);

  const serverTotal = query.data?.pages?.[0]?.total;
  const effectivePageSize = pageSize;
  const serverTotalPages =
    typeof serverTotal === "number"
      ? Math.max(1, Math.ceil(serverTotal / (query.data?.pages?.[0]?.page_size ?? effectivePageSize)))
      : undefined;

  const totalClient = filtered.length;
  const localTotalPages = Math.max(1, Math.ceil(totalClient / effectivePageSize));
  const totalPages = serverTotalPages ?? localTotalPages;

  const safePage = Math.min(page, totalPages);
  const items = useMemo(() => {
    const start = (safePage - 1) * effectivePageSize;
    return filtered.slice(start, start + effectivePageSize);
  }, [filtered, safePage, effectivePageSize]);

  const loadedCount = allServer.length;
  const need = page * effectivePageSize;
  const hasMoreServer = !!serverTotal ? loadedCount < serverTotal : !!query.hasNextPage;
  const isFetchingMore = query.isFetchingNextPage;

  useEffect(() => {
    if (loadedCount < need && hasMoreServer && !isFetchingMore) {
      query.fetchNextPage({ cancelRefetch: true }).catch(() => { });
    }
  }, [need, loadedCount, hasMoreServer, isFetchingMore, query]);

  const warmTokenRef = useRef(0);
  useEffect(() => {
    const first = query.data?.pages?.[0];
    if (!first) return;
    warmTokenRef.current += 1;
    const myToken = warmTokenRef.current;

    const expectedPages =
      typeof first.total_pages === "number"
        ? first.total_pages
        : typeof first.total === "number"
          ? Math.max(1, Math.ceil(first.total / (first.page_size ?? effectivePageSize)))
          : undefined;

    let stopped = false;

    (async () => {
      const hardCap = expectedPages ?? 200;
      for (; ;) {
        if (stopped) break;
        if (myToken !== warmTokenRef.current) break;

        const pagesLoaded = (qc.getQueryData<InfiniteData<SupplierPage>>(key)?.pages?.length ?? 0);
        const canContinue =
          (expectedPages ? pagesLoaded < expectedPages : !!query.hasNextPage) &&
          hasMoreServer &&
          !isFetchingMore;

        if (!canContinue) break;

        await query.fetchNextPage({ cancelRefetch: true }).catch(() => { });
        await new Promise((r) => setTimeout(r, 80));
        if (pagesLoaded >= hardCap) break;
      }
    })();

    return () => { stopped = true; };
  }, [filters.q, effectivePageSize, query.data?.pages?.length]);

  useEffect(() => { setPage(1); }, [filters]);

  const reload = () => qc.invalidateQueries({ queryKey: key });

  const upsertOne = useCallback((patch: Partial<Supplier> & { id: number }) => {
    qc.setQueryData<InfiniteData<SupplierPage, number>>(key, (data) => {
      if (!data) return data as any;
      const nextPages = data.pages.map((pg) => {
        const items = pg.items.map((it) => (it.id === patch.id ? { ...it, ...patch } : it));
        return { ...pg, items };
      });
      return { ...data, pages: nextPages };
    });
  }, [qc, key]);

  return {
    loading: query.isLoading || (query.isFetching && !query.isFetched),
    items,
    page: safePage,
    setPage,
    pageSize: effectivePageSize,
    total: serverTotal ?? totalClient,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    filters,
    setFilters,
    options,
    reload,
    upsertOne,
  };
}
