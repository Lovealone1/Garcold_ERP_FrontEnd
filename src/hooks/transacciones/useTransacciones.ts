"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { DateRange } from "react-day-picker";
import type { TransactionPageDTO } from "@/types/transaction";
import {
    listTransactions,
    listTransactionFilterOptions,
    summarizeTransactions,
} from "@/services/sales/transaction.api";
import { queryKeys } from "@/lib/query/queryKeys";
import { toApiDate } from "@/lib/period/period";

export type OriginFilter = "all" | "auto" | "manual";
export interface TransactionFilters {
    q?: string;
    bank?: string;
    type?: string;
    origin?: OriginFilter;
    dateRange?: DateRange;
}

const EMPTY_FILTERS: TransactionFilters = {
    q: "",
    bank: "",
    type: "",
    origin: "all",
    dateRange: undefined,
};

/** Filters in the shape the API expects, and stable enough to be a cache key. */
function toQueryParams(filters: TransactionFilters) {
    return {
        q: filters.q?.trim() || undefined,
        bank: filters.bank || undefined,
        type: filters.type || undefined,
        origin: filters.origin && filters.origin !== "all" ? filters.origin : undefined,
        // Bare dates: the API reads one as the whole day in Bogota. Sending
        // .toISOString() put the upper bound at midnight and dropped the last
        // day of the range -- a movement at 20:00 on the 30th fell outside it.
        date_from: toApiDate(filters.dateRange?.from) ?? undefined,
        date_to: toApiDate(filters.dateRange?.to ?? filters.dateRange?.from) ?? undefined,
    };
}

/**
 * Transactions list, paginated and filtered by the API.
 *
 * This hook used to walk every page of the table at 120ms intervals until it
 * had a complete local copy, then filter and paginate that copy in memory. At
 * the server's page size of 8 that is one request per 8 rows -- hundreds of
 * sequential round trips, a multi-megabyte cache entry, and a COUNT plus an
 * offset scan on the database for each one, all to display eight rows.
 *
 * It also split the data across two query roots -- `transactions-head` for
 * page 1 and `transactions` for the rest -- which is how invalidation kept
 * missing the newest rows. There is now a single query per page.
 */
export function useTransactions(initialPage = 1, pageSize = 8) {
    const qc = useQueryClient();
    const [page, setPage] = useState(initialPage);
    const [filters, setFilters] = useState<TransactionFilters>(EMPTY_FILTERS);

    const params = useMemo(() => toQueryParams(filters), [filters]);

    // Changing a filter changes the result set, so any page but the first is
    // meaningless against it.
    useEffect(() => {
        setPage(1);
    }, [params]);

    const listKey = useMemo(
        () => queryKeys.transactions.list({ page, pageSize, ...params }),
        [page, pageSize, params]
    );

    const query = useQuery<TransactionPageDTO>({
        queryKey: listKey,
        queryFn: ({ signal }) =>
            listTransactions(page, { signal, page_size: pageSize, ...params }),
        // Keeps the current rows on screen while the next page loads, instead
        // of flashing an empty table between pages.
        placeholderData: keepPreviousData,
    });

    // The dropdowns used to be derived from the downloaded rows; with server
    // paging the client can no longer see them all.
    const optionsQuery = useQuery({
        queryKey: queryKeys.transactions.filterOptions(),
        queryFn: ({ signal }) => listTransactionFilterOptions({ signal }),
    });

    // Totals for the extract panel span the whole filtered set, not the page.
    const summaryQuery = useQuery({
        queryKey: queryKeys.transactions.summary(params),
        queryFn: ({ signal }) => summarizeTransactions({ signal, ...params }),
        enabled: !!filters.bank,
    });

    const data = query.data;
    const items = data?.items ?? [];
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, data?.total_pages ?? 1);

    const refresh = useCallback(() => {
        void qc.invalidateQueries({ queryKey: queryKeys.transactions.all });
    }, [qc]);

    return {
        page,
        setPage,
        items,
        loading: query.isPending,
        isFetching: query.isFetching,
        error: query.isError ? (query.error as Error).message : null,
        refresh,

        total,
        total_pages: totalPages,
        page_size: data?.page_size ?? pageSize,

        filters,
        setFilters,
        options: {
            banks: optionsQuery.data?.banks ?? [],
            types: optionsQuery.data?.types ?? [],
        },

        /** Total amount per transaction type across the whole filtered set. */
        summaryByType: summaryQuery.data ?? {},

        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
}
