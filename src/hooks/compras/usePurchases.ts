"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listPurchases,
  listPurchaseFilterOptions,
  summarizePurchases,
} from "@/services/sales/purchase.api";
import { queryKeys } from "@/lib/query/queryKeys";
import type { PurchasePage } from "@/types/purchase";

type Filters = {
  q?: string;
  status?: string;
  bank?: string;
  supplier?: string;
  from?: string;
  to?: string;
};

function toQueryParams(filters: Filters) {
  return {
    q: filters.q?.trim() || undefined,
    status: filters.status || undefined,
    bank: filters.bank || undefined,
    supplier: filters.supplier || undefined,
    date_from: filters.from || undefined,
    date_to: filters.to || undefined,
  };
}

/**
 * Purchases list, paginated and filtered by the API.
 *
 * This hook used to run a pump() loop calling fetchNextPage until the whole
 * table was in memory, then filter and paginate that copy -- one request per
 * 8 rows, on every visit.
 */
export function usePurchases(initialFilters: Filters = {}, pageSize = 8) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const params = useMemo(() => toQueryParams(filters), [filters]);

  useEffect(() => {
    setPage(1);
  }, [params]);

  const query = useQuery<PurchasePage>({
    queryKey: queryKeys.purchases.list({ page, pageSize, ...params }),
    queryFn: ({ signal }) =>
      listPurchases(page, { signal, page_size: pageSize, ...params }),
    placeholderData: keepPreviousData,
  });

  const optionsQuery = useQuery({
    queryKey: queryKeys.purchases.filterOptions(),
    queryFn: ({ signal }) => listPurchaseFilterOptions({ signal }),
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.purchases.summary(params),
    queryFn: ({ signal }) => summarizePurchases({ signal, ...params }),
  });

  const data = query.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.total_pages ?? 1);

  const reload = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.purchases.all }),
    [qc]
  );

  return {
    items: data?.items ?? [],
    page,
    setPage,
    pageSize: data?.page_size ?? pageSize,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    loading: query.isPending,
    isFetching: query.isFetching,
    error: query.isError ? (query.error as Error)?.message ?? "Error" : null,
    reload,
    filters,
    setFilters,
    options: {
      banks: optionsQuery.data?.banks ?? [],
      statuses: optionsQuery.data?.statuses ?? [],
      suppliers: optionsQuery.data?.suppliers ?? [],
    },
    /** Totals across the whole filtered set, not the visible page. */
    totalFiltrado: summaryQuery.data?.total ?? 0,
    balanceFiltrado: summaryQuery.data?.balance ?? 0,
  };
}
