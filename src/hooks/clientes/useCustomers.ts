"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { listCustomers, listCustomerCities } from "@/services/sales/customer.api";
import { queryKeys } from "@/lib/query/queryKeys";
import type { Customer, CustomerPage } from "@/types/customer";

type Filters = {
  q?: string;
  cities?: string[];
  pendingBalance?: "yes" | "no" | "all";
};

function toQueryParams(filters: Filters) {
  return {
    q: filters.q?.trim() || undefined,
    cities: filters.cities?.length ? filters.cities : undefined,
    pending_balance:
      filters.pendingBalance && filters.pendingBalance !== "all"
        ? filters.pendingBalance
        : undefined,
  };
}

/**
 * Customers list, paginated and filtered by the API.
 *
 * It used to walk every page into memory and filter that copy, and built the
 * city multi-select from whatever it had downloaded.
 */
export function useCustomers(pageSize = 8) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});

  const params = useMemo(() => toQueryParams(filters), [filters]);
  const citiesKey = params.cities?.join("|") ?? "";

  useEffect(() => {
    setPage(1);
  }, [params.q, citiesKey, params.pending_balance]);

  const listKey = useMemo(
    () => queryKeys.customers.list({ page, pageSize, ...params }),
    [page, pageSize, params]
  );

  const query = useQuery<CustomerPage>({
    queryKey: listKey,
    queryFn: ({ signal }) =>
      listCustomers(page, { signal, page_size: pageSize, ...params }),
    placeholderData: keepPreviousData,
  });

  const citiesQuery = useQuery({
    queryKey: queryKeys.customers.cities(),
    queryFn: ({ signal }) => listCustomerCities({ signal }),
  });

  const data = query.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.total_pages ?? 1);

  const reload = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.customers.all }),
    [qc]
  );

  /** Patch one row after a mutation returns it, before the refetch lands. */
  const upsertOne = useCallback(
    (patch: Partial<Customer> & { id: number }) => {
      qc.setQueryData<CustomerPage>(listKey, (current) => {
        if (!current?.items) return current;
        return {
          ...current,
          items: current.items.map((c) =>
            c.id === patch.id ? { ...c, ...patch } : c
          ),
        };
      });
    },
    [qc, listKey]
  );

  return {
    loading: query.isPending,
    isFetching: query.isFetching,
    items: data?.items ?? [],
    page,
    setPage,
    pageSize: data?.page_size ?? pageSize,
    total,
    totalPages,
    hasPrev: page > 1,
    hasNext: page < totalPages,
    filters,
    setFilters,
    options: { cities: citiesQuery.data ?? [] },
    reload,
    upsertOne,
    error: query.isError ? (query.error as Error)?.message ?? "Error" : null,
  };
}
