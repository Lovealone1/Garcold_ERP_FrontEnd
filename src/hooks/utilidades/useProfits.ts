"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProfits, summarizeProfits } from "@/services/sales/profit.api";
import { queryKeys } from "@/lib/query/queryKeys";
import { usePeriod } from "@/components/providers/PeriodProvider";
import type { Profit, ProfitPageDTO } from "@/types/profit";

type Filters = { q?: string };

/**
 * The period is no longer built here.
 *
 * This used to widen a date-only range to cover both whole days and send it as
 * ISO timestamps. The API now reads a bare YYYY-MM-DD as the whole day in
 * Bogota, so the widening -- and the timezone shift that came with it -- is
 * the server's job.
 */
function toQueryParams(filters: Filters) {
    return {
        q: filters.q?.trim() || undefined,
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

    // The period comes from the header selector, shared by every screen.
    // Utilidades is also the screen that legitimately wants all of history,
    // which is now the named `period=all` rather than sending no dates.
    const { params: periodParams } = usePeriod();

    const params = useMemo(
        () => ({ ...toQueryParams(filters), ...periodParams }),
        [filters, periodParams]
    );

    useEffect(() => {
        setPage(1);
    }, [params]);

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
