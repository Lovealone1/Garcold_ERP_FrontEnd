"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { listPurchases } from "@/services/sales/purchase.api";
import type { Purchase, PurchasePage } from "@/types/purchase";

type Filters = {
  q?: string;
  status?: string;
  bank?: string;
  from?: string;
  to?: string;
};

export function usePurchases(initialFilters: Filters = {}, pageSize = 8) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const key = useMemo(
    () =>
      [
        "purchases",
        {
          pageSize,
        },
      ] as const,
    [pageSize]
  );

  const query = useInfiniteQuery<
    PurchasePage,
    Error,
    InfiniteData<PurchasePage>,
    typeof key,
    number
  >({
    queryKey: key,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal, queryKey }) => {
      const [, f] = queryKey;
      return listPurchases(pageParam, {
        signal,
        page_size: f.pageSize,
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

  useEffect(() => {
    setPage(1);
  }, [filters.q, filters.status, filters.bank, filters.from, filters.to]);

  const pages = query.data?.pages ?? [];

  const serverTotal = pages[0]?.total;
  const serverPageSize = pages[0]?.page_size ?? pageSize;
  const serverTotalPages =
    typeof serverTotal === "number"
      ? Math.max(1, Math.ceil(serverTotal / serverPageSize))
      : undefined;

  const all: Purchase[] = useMemo(
    () => pages.flatMap((p) => p.items ?? []),
    [pages]
  );

  const filtered: Purchase[] = useMemo(() => {
    return all.filter((p) => {
      if (filters.q) {
        const q = filters.q.toLowerCase().trim();
        const target = `${p.id} ${p.supplier ?? ""} ${p.bank ?? ""}`.toLowerCase();
        if (!target.includes(q)) return false;
      }

      if (filters.status && String(p.status) !== String(filters.status)) {
        return false;
      }

      if (filters.bank && String(p.bank) !== String(filters.bank)) {
        return false;
      }

      if (filters.from) {
        const d = new Date(p.purchase_date);
        const from = new Date(filters.from);
        const tD = d.getTime();
        const tFrom = from.getTime();
        if (!Number.isNaN(tD) && !Number.isNaN(tFrom) && tD < tFrom) {
          return false;
        }
      }

      if (filters.to) {
        const d = new Date(p.purchase_date);
        const to = new Date(filters.to);
        const tD = d.getTime();
        const tTo = to.getTime();
        if (!Number.isNaN(tD) && !Number.isNaN(tTo) && tD > tTo) {
          return false;
        }
      }

      return true;
    });
  }, [all, filters]);

  const totalClient = filtered.length;
  const localTotalPages = Math.max(1, Math.ceil(totalClient / pageSize));
  const uiTotalPages = serverTotalPages ?? localTotalPages;

  const safePage = Math.min(page, uiTotalPages || 1);

  const items = useMemo(
    () =>
      filtered.slice(
        (safePage - 1) * pageSize,
        (safePage - 1) * pageSize + pageSize
      ),
    [filtered, safePage, pageSize]
  );

  const reload = () =>
    qc.invalidateQueries({
      predicate: ({ queryKey }) =>
        Array.isArray(queryKey) && queryKey[0] === "purchases",
      refetchType: "active",
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
