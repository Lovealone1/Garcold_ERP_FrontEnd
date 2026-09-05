"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSales, listSaleFilterOptions, summarizeSales } from "@/services/sales/sale.api";
import { queryKeys } from "@/lib/query/queryKeys";
import type { SalePage } from "@/types/sale";

type Filters = {
    q?: string;
    estado?: string;
    banco?: string;
    from?: string;
    to?: string;
};

/** Filters in the shape the API expects. */
function toQueryParams(filters: Filters) {
    return {
        q: filters.q?.trim() || undefined,
        status: filters.estado || undefined,
        bank: filters.banco || undefined,
        date_from: filters.from || undefined,
        date_to: filters.to || undefined,
    };
}

/**
 * Sales list, paginated and filtered by the API.
 *
 * This hook used to run a `pump()` loop that called fetchNextPage until the
 * whole table was in memory, then filtered and paginated that copy. At the
 * server's page size of 8 that is one request per 8 rows, every visit.
 */
export function useVentas(initialFilters: Filters = {}, pageSize = 8) {
    const qc = useQueryClient();
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<Filters>(initialFilters);

    const params = useMemo(() => toQueryParams(filters), [filters]);

    // A page number from the previous result set means nothing against a new one.
    useEffect(() => {
        setPage(1);
    }, [params.q, params.status, params.bank, params.date_from, params.date_to]);

    const query = useQuery<SalePage>({
        queryKey: queryKeys.sales.list({ page, pageSize, ...params }),
        queryFn: ({ signal }) => listSales(page, { signal, page_size: pageSize, ...params }),
        placeholderData: keepPreviousData,
    });

    const optionsQuery = useQuery({
        queryKey: queryKeys.sales.filterOptions(),
        queryFn: ({ signal }) => listSaleFilterOptions({ signal }),
    });

    // The screen shows a total for the current filter, which spans every
    // matching row rather than the visible page.
    const summaryQuery = useQuery({
        queryKey: queryKeys.sales.summary(params),
        queryFn: ({ signal }) => summarizeSales({ signal, ...params }),
    });

    const data = query.data;
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, data?.total_pages ?? 1);

    const reload = useCallback(
        () => qc.invalidateQueries({ queryKey: queryKeys.sales.all }),
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
        },
        /** Summed amount across the whole filtered set. */
        totalFiltrado: summaryQuery.data?.total ?? 0,
        remainingFiltrado: summaryQuery.data?.remaining_balance ?? 0,
    };
}
