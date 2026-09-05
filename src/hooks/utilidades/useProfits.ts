"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProfits, summarizeProfits } from "@/services/sales/profit.api";
import { queryKeys } from "@/lib/query/queryKeys";
import type { Profit, ProfitPageDTO } from "@/types/profit";

type Filters = { q?: string; from?: Date; to?: Date };

/** Widen a date-only range to cover the whole day at each end. */
function toQueryParams(filters: Filters) {
    const from = filters.from
        ? new Date(
              filters.from.getFullYear(),
              filters.from.getMonth(),
              filters.from.getDate(),
              0, 0, 0, 0
          )
        : undefined;
    const to = filters.to
        ? new Date(
              filters.to.getFullYear(),
              filters.to.getMonth(),
              filters.to.getDate(),
              23, 59, 59, 999
          )
        : undefined;

    return {
        q: filters.q?.trim() || undefined,
        date_from: from?.toISOString(),
        date_to: to?.toISOString(),
    };
}

/**
 * Profits list, paginated and filtered by the API.
 *
 * It used to pump every page into memory and filter the copy.
 */
export function useProfits(initialPage = 1, pageSize = 16) {
    const qc = useQueryClient();
    const [page, setPage] = useState(initialPage);
    const [filters, setFilters] = useState<Filters>({});

    const params = useMemo(() => toQueryParams(filters), [filters]);

    useEffect(() => {
        setPage(1);
    }, [params.q, params.date_from, params.date_to]);

    const listKey = useMemo(
        () => queryKeys.profits.list({ page, pageSize, ...params }),
        [page, pageSize, params]
    );

    const query = useQuery<ProfitPageDTO>({
        queryKey: listKey,
        queryFn: ({ signal }) =>
            listProfits(page, { signal, page_size: pageSize, ...params }),
        placeholderData: keepPreviousData,
    });

    // The screen shows a total for the current filter, which spans every
    // matching row rather than the visible page.
    const summaryQuery = useQuery({
        queryKey: queryKeys.profits.summary(params),
        queryFn: ({ signal }) => summarizeProfits({ signal, ...params }),
    });

    const data = query.data;
    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, data?.total_pages ?? 1);

    const refresh = useCallback(
        () => qc.invalidateQueries({ queryKey: queryKeys.profits.all }),
        [qc]
    );

    const upsertOne = useCallback(
        (patch: Partial<Profit> & { id: number }) => {
            qc.setQueryData<ProfitPageDTO>(listKey, (current) => {
                if (!current?.items) return current;
                return {
                    ...current,
                    items: current.items.map((p) =>
                        p.id === patch.id ? { ...p, ...patch } : p
                    ),
                };
            });
        },
        [qc, listKey]
    );

    return {
        page,
        setPage,
        items,
        /** Only the current page; there is no local copy of the table any more. */
        all: items,
        loading: query.isPending,
        isFetching: query.isFetching,
        error: query.isError ? (query.error as Error).message : null,
        total_pages: totalPages,
        page_size: data?.page_size ?? pageSize,
        total,
        hasPrev: page > 1,
        hasNext: page < totalPages,
        filters,
        setFilters,
        refresh,
        upsertOne,
        /** Summed profit across the whole filtered set. */
        totalFiltrado: summaryQuery.data?.total ?? 0,
    };
}

export default useProfits;
