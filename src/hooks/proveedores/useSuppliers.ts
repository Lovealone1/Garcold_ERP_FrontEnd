"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSuppliers, listSupplierCities } from "@/services/sales/supplier.api";
import { queryKeys } from "@/lib/query/queryKeys";
import type { Supplier, SupplierPage } from "@/types/supplier";

type Filters = { q?: string; cities?: string[] };

function toQueryParams(filters: Filters) {
  return {
    q: filters.q?.trim() || undefined,
    cities: filters.cities?.length ? filters.cities : undefined,
  };
}

/**
 * Suppliers list, paginated and filtered by the API.
 *
 * It used to walk every page into memory and filter that copy, and built the
 * city multi-select from whatever it had downloaded.
 */
export function useSuppliers(pageSize = 8) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({});

  const params = useMemo(() => toQueryParams(filters), [filters]);
  const citiesKey = params.cities?.join("|") ?? "";

  useEffect(() => {
    setPage(1);
  }, [params.q, citiesKey]);

  const listKey = useMemo(
    () => queryKeys.suppliers.list({ page, pageSize, ...params }),
    [page, pageSize, params]
  );

  const query = useQuery<SupplierPage>({
    queryKey: listKey,
    queryFn: ({ signal }) =>
      listSuppliers(page, { signal, page_size: pageSize, ...params }),
    placeholderData: keepPreviousData,
  });

  const citiesQuery = useQuery({
    queryKey: queryKeys.suppliers.cities(),
    queryFn: ({ signal }) => listSupplierCities({ signal }),
  });

  const data = query.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.total_pages ?? 1);

  const reload = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.suppliers.all }),
    [qc]
  );

  const upsertOne = useCallback(
    (patch: Partial<Supplier> & { id: number }) => {
      qc.setQueryData<SupplierPage>(listKey, (current) => {
        if (!current?.items) return current;
        return {
          ...current,
          items: current.items.map((s) =>
            s.id === patch.id ? { ...s, ...patch } : s
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
