"use client";
import { useEffect, useMemo, useState } from "react";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { TransactionView, TransactionPageDTO } from "@/types/transaction";
import { listTransactions } from "@/services/sales/transaction.api";

export type OriginFilter = "all" | "auto" | "manual";
export interface TransactionFilters { q?: string; bank?: string; type?: string; origin?: OriginFilter; }

export function useTransactions(initialPage = 1, pageSize = 10) {
    const qc = useQueryClient();
    const [page, setPage] = useState(initialPage);
    const [filters, setFilters] = useState<TransactionFilters>({ q: "", bank: "", type: "", origin: "all" });

    const key = useMemo(
        () =>
            ["transactions", {
                q: filters.q || "", bank: filters.bank || "", type: filters.type || "", origin: filters.origin || "all", pageSize,
            }] as const,
        [filters.q, filters.bank, filters.type, filters.origin, pageSize]
    );

    const query = useInfiniteQuery<
        TransactionPageDTO, Error, InfiniteData<TransactionPageDTO>, typeof key, number
    >({
        queryKey: key,
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1, signal, queryKey }) => {
            const [, f] = queryKey;
            return listTransactions(pageParam, {
                signal, q: f.q, bank: f.bank, type: f.type, origin: f.origin, page_size: f.pageSize,
            });
        },
        getNextPageParam: (last) => {
            const cur = last.page ?? 1;
            if (last.has_next === true) return cur + 1;
            if (typeof last.total_pages === "number" && cur < last.total_pages) return cur + 1;
            if (Array.isArray(last.items) && last.items.length < (last.page_size ?? pageSize)) return undefined;
            return undefined;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60 * 24 * 3,
    });

    const serverTotal = query.data?.pages?.[0]?.total;
    const serverPageSize = query.data?.pages?.[0]?.page_size ?? pageSize;
    const serverTotalPages = typeof serverTotal === "number"
        ? Math.max(1, Math.ceil(serverTotal / serverPageSize))
        : undefined;

    const all: TransactionView[] = useMemo(
        () => (query.data?.pages ?? []).flatMap(p => p.items),
        [query.data]
    );

    const options = useMemo(() => {
        const banks = Array.from(new Set(all.map(x => x.bank))).sort();
        const types = Array.from(new Set(all.map(x => x.type_str))).sort();
        return { banks, types };
    }, [all]);

    const v = (filters.q ?? "").trim().toLowerCase();
    const originF = (filters.origin ?? "all") as OriginFilter;
    const filtered = useMemo(() => all.filter(r => {
        const byQ = !v || String(r.id).includes(v) || r.bank.toLowerCase().includes(v) ||
            r.type_str.toLowerCase().includes(v) || (r.description ?? "").toLowerCase().includes(v);
        const byBank = !filters.bank || r.bank === filters.bank;
        const byType = !filters.type || r.type_str === filters.type;
        const byOrigin = originF === "all" || (originF === "auto" ? r.is_auto : !r.is_auto);
        return byQ && byBank && byType && byOrigin;
    }), [all, v, filters.bank, filters.type, originF]);

    useEffect(() => { setPage(1); }, [filters.q, filters.bank, filters.type, filters.origin]);

    const totalClient = filtered.length;
    const localTotalPages = Math.max(1, Math.ceil(totalClient / pageSize));
    const uiTotalPages = serverTotalPages ?? localTotalPages;

    const safePage = Math.min(page, uiTotalPages);
    const items = useMemo(
        () => filtered.slice((safePage - 1) * pageSize, (safePage - 1) * pageSize + pageSize),
        [filtered, safePage, pageSize]
    );

    const refresh = () => qc.invalidateQueries({ queryKey: key });

    const loadedCount = (query.data?.pages ?? []).reduce((a, p) => a + (p.items?.length ?? 0), 0);
    const hasMoreServer = !!serverTotal ? loadedCount < serverTotal : !!query.hasNextPage;
    const isFetchingMore = query.isFetchingNextPage;
    const loadMore = () => {
        if (hasMoreServer && !isFetchingMore) return query.fetchNextPage({ cancelRefetch: true });
        return Promise.resolve();
    };

    return {
        page: safePage, setPage,
        items,
        loading: query.isLoading || (query.isFetching && !query.isFetched),
        error: query.isError ? (query.error as Error).message : null,
        refresh,
        loadMore,
        hasMoreServer,
        isFetchingMore,
        total_pages: uiTotalPages,
        page_size: pageSize,
        total: serverTotal ?? totalClient,
        filters, setFilters,
        options,
        serverTotal,
        serverTotalPages: uiTotalPages,
    };
}
