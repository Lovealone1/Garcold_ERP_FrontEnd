// hooks/transacciones/useTransacciones.ts
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
        () => ["transactions", {
            q: filters.q || "",
            bank: filters.bank || "",
            type: filters.type || "",
            origin: filters.origin || "all",
            pageSize,
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
                signal,
                q: f.q, bank: f.bank, type: f.type, origin: f.origin,
                page_size: f.pageSize,
            });
        },
        // Corta por total real. Fallbacks: has_next, total_pages, long-tail parcial.
        getNextPageParam: (last, allPages) => {
            const cur = (last as any).page ?? 1;
            const total = (last as any).total ?? allPages?.[0]?.total ?? undefined;
            const pageSizeResp = (last as any).page_size ?? pageSize;

            const loaded = (allPages ?? []).reduce((a, p) => a + (p.items?.length ?? 0), 0);
            if (typeof total === "number" && loaded >= total) return undefined;     // no hay más por conteo real

            const hasNext = (last as any).has_next ?? (last as any).hasNext ?? false;
            if (hasNext === true) return cur + 1;

            const totalPages = (last as any).total_pages ?? (last as any).pages ?? undefined;
            if (typeof totalPages === "number" && cur < totalPages) return cur + 1;

            // última página parcial: si trae menos que pageSize, no hay siguiente
            if (Array.isArray(last.items) && last.items.length < pageSizeResp) return undefined;

            // conservador: intenta una más si nada anterior decidió
            return cur + 1;
        },
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        staleTime: 1000 * 60 * 30,
        gcTime: 1000 * 60 * 60 * 24 * 3,
    });

    // Precarga basada en conteo real
    const serverTotal = query.data?.pages?.[0]?.total ?? undefined;
    const loadedCount = (query.data?.pages ?? []).reduce((a, p) => a + (p.items?.length ?? 0), 0);

    useEffect(() => {
        if (!serverTotal) return;
        if (query.isFetching || query.isFetchingNextPage) return;
        if (loadedCount >= serverTotal) return;
        if (!query.hasNextPage) return;
        query.fetchNextPage({ cancelRefetch: true }).catch(() => { });
    }, [serverTotal, loadedCount, query.isFetching, query.isFetchingNextPage, query.hasNextPage]);

    const all: TransactionView[] = useMemo(() => (query.data?.pages ?? []).flatMap(p => p.items), [query.data]);

    const options = useMemo(() => {
        const banks = Array.from(new Set(all.map(x => x.bank))).sort();
        const types = Array.from(new Set(all.map(x => x.type_str))).sort();
        return { banks, types };
    }, [all]);

    const v = (filters.q ?? "").trim().toLowerCase();
    const originF = (filters.origin ?? "all") as OriginFilter;
    const filtered = useMemo(() => all.filter(r => {
        const byQ = !v || String(r.id).includes(v) || r.bank.toLowerCase().includes(v) || r.type_str.toLowerCase().includes(v) || (r.description ?? "").toLowerCase().includes(v);
        const byBank = !filters.bank || r.bank === filters.bank;
        const byType = !filters.type || r.type_str === filters.type;
        const byOrigin = originF === "all" || (originF === "auto" ? r.is_auto : !r.is_auto);
        return byQ && byBank && byType && byOrigin;
    }), [all, v, filters.bank, filters.type, originF]);

    useEffect(() => { setPage(1); }, [filters.q, filters.bank, filters.type, filters.origin]);

    const total = filtered.length;
    const total_pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, total_pages);
    const items = useMemo(() => filtered.slice((safePage - 1) * pageSize, (safePage - 1) * pageSize + pageSize), [filtered, safePage, pageSize]);

    const refresh = () => qc.invalidateQueries({ queryKey: key });

    const hasMoreServer = query.hasNextPage && (!!serverTotal ? loadedCount < serverTotal : true);
    const isFetchingMore = query.isFetchingNextPage;
    const loadMore = () => {
        if (hasMoreServer && !isFetchingMore) {
            return query.fetchNextPage({ cancelRefetch: true });
        }
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
        has_next: safePage < total_pages,
        has_prev: safePage > 1,
        total_pages, page_size: pageSize, total,
        filters, setFilters,
        options,
    };
}
