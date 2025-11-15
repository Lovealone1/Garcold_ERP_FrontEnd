"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import {
  useInfiniteQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import { listCustomers } from "@/services/sales/customer.api";
import type { Customer, CustomerPage } from "@/types/customer";

type Filters = {
  q?: string;
  cities?: string[];
  pendingBalance?: "yes" | "no";
};

export function useCustomers(pageSize = 8) {
  const qc = useQueryClient();

  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ q: "" });

  const key = useMemo(
    () =>
      [
        "customers",
        {
          pageSize,
        },
      ] as const,
    [pageSize]
  );

  const query = useInfiniteQuery<
    CustomerPage,
    Error,
    InfiniteData<CustomerPage>,
    typeof key,
    number
  >({
    queryKey: key,
    initialPageParam: 1,
    queryFn: async ({ pageParam = 1, signal, queryKey }) => {
      const [, f] = queryKey;

      return listCustomers(pageParam, {
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
  }, [filters.q, filters.cities, filters.pendingBalance]);

  const pages = query.data?.pages ?? [];
  const serverTotal = pages[0]?.total;
  const serverPageSize = pages[0]?.page_size ?? pageSize;

  const serverTotalPages =
    typeof serverTotal === "number"
      ? Math.max(1, Math.ceil(serverTotal / serverPageSize))
      : undefined;

  const allServer: Customer[] = useMemo(
    () => pages.flatMap((p) => p.items ?? []),
    [pages]
  );

  const s = (filters.q ?? "").trim().toLowerCase();

  const filteredExceptCity = useMemo(() => {
    return allServer.filter((c) => {
      if (
        s &&
        !(
          c.name.toLowerCase().includes(s) ||
          (c.tax_id ?? "").toLowerCase().includes(s) ||
          (c.email ?? "").toLowerCase().includes(s) ||
          (c.phone ?? "").toLowerCase().includes(s)
        )
      )
        return false;

      if (filters.pendingBalance === "yes" && !(c.balance > 0)) return false;
      if (filters.pendingBalance === "no" && !(c.balance <= 0)) return false;

      return true;
    });
  }, [allServer, s, filters.pendingBalance]);

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
      queryKey: ["customers"],
      refetchType: "active",
    });

  const upsertOne = useCallback(
    (patch: Partial<Customer> & { id: number }) => {
      // el cliente que modifica/crea siempre salta a página 1
      setPage(1);

      qc.setQueryData<InfiniteData<CustomerPage>>(key, (data) => {
        if (!data) return data;

        let found = false;

        const patchedPages = data.pages.map((pg) => {
          const items = pg.items.map((it) => {
            if (it.id === patch.id) {
              found = true;
              return { ...it, ...patch };
            }
            return it;
          });
          return { ...pg, items };
        });

        if (found) {
          return { ...data, pages: patchedPages };
        }

        const [first, ...rest] = patchedPages;
        if (!first) return data;

        const pageSizeLocal = first.page_size ?? serverPageSize ?? pageSize;
        const newItem = patch as Customer;

        const newFirst: CustomerPage = {
          ...first,
          items: [newItem, ...(first.items ?? [])].slice(0, pageSizeLocal),
          total:
            typeof first.total === "number"
              ? first.total + 1
              : first.total,
        };

        return { ...data, pages: [newFirst, ...rest] };
      });
    },
    [qc, key, serverPageSize, pageSize]
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
