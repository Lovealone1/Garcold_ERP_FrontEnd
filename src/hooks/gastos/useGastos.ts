"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listExpenses,
  listExpenseFilterOptions,
  summarizeExpenses,
} from "@/services/sales/expense.api";
import { queryKeys } from "@/lib/query/queryKeys";
import { usePeriod } from "@/components/providers/PeriodProvider";
import type { ExpensesPage } from "@/types/expense";

type Filters = {
  q?: string;
  category?: string;
  bank?: string;
};

function toQueryParams(filters: Filters) {
  return {
    q: filters.q?.trim() || undefined,
    category: filters.category || undefined,
    bank: filters.bank || undefined,
  };
}

/**
 * Expenses list, paginated and filtered by the API.
 *
 * These filters were the most broken of the four screens. The client sent
 * them, the endpoint ignored them, and this hook did not filter locally
 * either -- it only sliced. The page then filtered the eight rows it happened
 * to be showing, so the visible rows and the pagination disagreed: page 2 of a
 * filtered list still paged through the unfiltered set.
 *
 * Filtering now happens once, in SQL, and the counts match what is shown.
 */
export function useExpenses(initialFilters: Filters = {}, pageSize = 8) {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  // The period comes from the header selector, shared by every screen.
  const { params: periodParams } = usePeriod();

  const params = useMemo(
    () => ({ ...toQueryParams(filters), ...periodParams }),
    [filters, periodParams]
  );

  useEffect(() => {
    setPage(1);
  }, [params]);

  const query = useQuery<ExpensesPage>({
    queryKey: queryKeys.expenses.list({ page, pageSize, ...params }),
    queryFn: ({ signal }) =>
      listExpenses(page, { signal, page_size: pageSize, ...params }),
    placeholderData: keepPreviousData,
  });

  const optionsQuery = useQuery({
    queryKey: queryKeys.expenses.filterOptions(),
    queryFn: ({ signal }) => listExpenseFilterOptions({ signal }),
  });

  const summaryQuery = useQuery({
    queryKey: queryKeys.expenses.summary(params),
    queryFn: ({ signal }) => summarizeExpenses({ signal, ...params }),
  });

  const data = query.data;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, data?.total_pages ?? 1);

  const reload = useCallback(
    () => qc.invalidateQueries({ queryKey: queryKeys.expenses.all }),
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
      categories: optionsQuery.data?.categories ?? [],
      banks: optionsQuery.data?.banks ?? [],
    },
    /** Summed amount across the whole filtered set. */
    totalFiltrado: summaryQuery.data?.total ?? 0,
  };
}
