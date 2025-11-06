// hooks/transactions/useTransactions.ts
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { TransactionView, TransactionPageDTO } from "@/types/transaction";
import { listTransactions } from "@/services/sales/transaction.api";

export type OriginFilter = "all" | "auto" | "manual";

export interface TransactionFilters {
    q?: string;
    bank?: string;
    type?: string;
    origin?: OriginFilter;
}

const QUERY_KEY = ["transactions", "all"] as const;

export function useTransactions(initialPage = 1, pageSize = 10) {
    const qc = useQueryClient();
    const [page, setPage] = useState(initialPage);
    const [filters, setFilters] = useState<TransactionFilters>({
        q: "",
        bank: "",
        type: "",
        origin: "all",
    });

    const query = useInfiniteQuery<
        TransactionPageDTO,                    // TQueryFnData: lo que devuelve tu fetch por página
        Error,                     // TError
        InfiniteData<TransactionPageDTO>,      // TData: el shape acumulado de infinite (pages, pageParams)
        typeof QUERY_KEY,          // TQueryKey
        number                     // TPageParam
    >({
        queryKey: QUERY_KEY,
        queryFn: ({ pageParam = 1, signal }) => listTransactions(pageParam, { signal }),
        initialPageParam: 1,
        getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60 * 24 * 3,
    });

    const warmStop = useRef(false);
    useEffect(() => {
        warmStop.current = false;
        if (!query.data?.pages?.length) return;
        (async () => {
            for (let i = 0; i < 500; i++) {
                if (warmStop.current || !query.hasNextPage) break;
                await query.fetchNextPage({ cancelRefetch: true });
                await new Promise((r) => setTimeout(r, 25));
            }
        })();
        return () => {
            warmStop.current = true;
        };
    }, [query.data?.pages?.length, query.hasNextPage, query.fetchNextPage]);

    const all: TransactionView[] = useMemo(
        () => (query.data?.pages ?? []).flatMap((p) => p.items),
        [query.data]
    );

    const options = useMemo(() => {
        const banks = Array.from(new Set(all.map((x) => x.bank))).sort();
        const types = Array.from(new Set(all.map((x) => x.type_str))).sort();
        return { banks, types };
    }, [all]);

    const filtered = useMemo(() => {
        const v = (filters.q ?? "").trim().toLowerCase();
        const originF = (filters.origin ?? "all") as OriginFilter;
        return all.filter((r) => {
            const byQ =
                !v ||
                String(r.id).includes(v) ||
                r.bank.toLowerCase().includes(v) ||
                r.type_str.toLowerCase().includes(v) ||
                (r.description ?? "").toLowerCase().includes(v);
            const byBank = !filters.bank || r.bank === filters.bank;
            const byType = !filters.type || r.type_str === filters.type;
            const byOrigin = originF === "all" || (originF === "auto" ? r.is_auto : !r.is_auto);
            return byQ && byBank && byType && byOrigin;
        });
    }, [all, filters]);

    useEffect(() => {
        setPage(1);
    }, [filters.q, filters.bank, filters.type, filters.origin]);

    const total = filtered.length;
    const total_pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, total_pages);

    const items = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    const has_prev = safePage > 1;
    const has_next = safePage < total_pages;

    const refresh = () => qc.invalidateQueries({ queryKey: QUERY_KEY });
    const loadMore = () => {
        if (query.hasNextPage) query.fetchNextPage({ cancelRefetch: true });
    };

    const loading = query.isLoading || (query.isFetching && !query.isFetched);
    const error = query.isError ? (query.error as Error).message : null;

    return {
        page: safePage,
        setPage,
        items,
        loading,
        error,
        refresh,
        loadMore,
        has_next,
        has_prev,
        total_pages,
        page_size: pageSize,
        total,
        filters,
        setFilters,
        options,
    };
}
