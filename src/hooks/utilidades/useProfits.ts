"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { listProfits } from "@/services/sales/profit.api";
import type { Profit, ProfitPageDTO } from "@/types/profit";

export type ProfitFilters = { q?: string; from?: Date | null; to?: Date | null };

export function useProfits(initialPage = 1, pageSize = 16) {
    const qc = useQueryClient();
    const [page, setPage] = useState(initialPage);
    const [filters, setFilters] = useState<ProfitFilters>({});
    const key = useMemo(
        () => ["profits", { pageSize, q: filters.q || "", from: filters.from?.toISOString() ?? "", to: filters.to?.toISOString() ?? "" }] as const,
        [pageSize, filters.q, filters.from, filters.to]
    );

    const query = useInfiniteQuery<ProfitPageDTO, Error, InfiniteData<ProfitPageDTO>, typeof key, number>({
        queryKey: key,
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1, signal, queryKey }) => {
            const [, meta] = queryKey;
            return listProfits(pageParam, { signal, page_size: meta.pageSize });
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
    const serverTotalPages =
        typeof serverTotal === "number" ? Math.max(1, Math.ceil(serverTotal / serverPageSize)) : undefined;

    const all: Profit[] = useMemo(() => (query.data?.pages ?? []).flatMap((p) => p.items), [query.data]);
    const v = (filters.q ?? "").trim().toLowerCase();

    const filtered = useMemo(() => {
        const fromTime = filters.from ? new Date(filters.from.getFullYear(), filters.from.getMonth(), filters.from.getDate(), 0, 0, 0, 0).getTime() : undefined;
        const toTime = filters.to ? new Date(filters.to.getFullYear(), filters.to.getMonth(), filters.to.getDate(), 23, 59, 59, 999).getTime() : undefined;
        return all.filter((u) => {
            if (v && !String(u.sale_id).includes(v)) return false;
            if (fromTime != null || toTime != null) {
                const t = new Date(u.created_at).getTime();
                if (fromTime != null && t < fromTime) return false;
                if (toTime != null && t > toTime) return false;
            }
            return true;
        });
    }, [all, v, filters.from, filters.to]);

    useEffect(() => { setPage(1); }, [filters.q, filters.from, filters.to]);

    const totalClient = filtered.length;
    const localTotalPages = Math.max(1, Math.ceil(totalClient / pageSize));
    const uiTotalPages = serverTotalPages ?? localTotalPages;
    const safePage = Math.min(page, uiTotalPages);

    const items = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    const loadedCount = (query.data?.pages ?? []).reduce((a, p) => a + (p.items?.length ?? 0), 0);
    const hasMoreServer = !!serverTotal ? loadedCount < serverTotal : !!query.hasNextPage;
    const isFetchingMore = query.isFetchingNextPage;

    useEffect(() => {
        const need = safePage * pageSize;
        if (loadedCount < need && hasMoreServer && !isFetchingMore) {
            query.fetchNextPage({ cancelRefetch: true });
        }
    }, [safePage, pageSize, loadedCount, hasMoreServer, isFetchingMore, query]);

    const warmTokenRef = useRef(0);
    useEffect(() => {
        const first = query.data?.pages?.[0];
        if (!first) return;
        warmTokenRef.current += 1;
        const myToken = warmTokenRef.current;
        const expectedPages =
            typeof first.total_pages === "number"
                ? first.total_pages
                : typeof first.total === "number"
                    ? Math.max(1, Math.ceil(first.total / (first.page_size ?? pageSize)))
                    : undefined;
        let stopped = false;
        (async () => {
            const hardCap = expectedPages ?? 200;
            for (; ;) {
                if (stopped) break;
                if (myToken !== warmTokenRef.current) break;
                const pagesLoaded = (qc.getQueryData<InfiniteData<ProfitPageDTO>>(key)?.pages?.length ?? 0);
                const canContinue =
                    (expectedPages ? pagesLoaded < expectedPages : !!query.hasNextPage) &&
                    hasMoreServer &&
                    !isFetchingMore;
                if (!canContinue) break;
                await query.fetchNextPage({ cancelRefetch: true }).catch(() => { });
                await new Promise((r) => setTimeout(r, 80));
                if (pagesLoaded >= hardCap) break;
            }
        })();
        return () => { stopped = true; };
    }, [pageSize, query.data?.pages?.[0]?.page, query.data?.pages?.length]);

    const loadMore = () => {
        if (hasMoreServer && !isFetchingMore) return query.fetchNextPage({ cancelRefetch: true });
        return Promise.resolve();
    };

    const refresh = () => qc.invalidateQueries({ queryKey: key });

    function upsertOne(patch: Partial<Profit> & { id: number }) {
        qc.setQueryData<InfiniteData<ProfitPageDTO, number>>(key, (data) => {
            if (!data) return data as any;
            const nextPages = data.pages.map((pg) => {
                const items = pg.items.map((it) => (it.id === patch.id ? { ...it, ...patch } : it));
                return { ...pg, items };
            });
            return { ...data, pages: nextPages };
        });
    }

    return {
        page: safePage,
        setPage,
        items,
        all,
        loading: query.isLoading || (query.isFetching && !query.isFetched),
        error: query.isError ? (query.error as Error).message : null,
        loadMore,
        hasMoreServer,
        isFetchingMore,
        total_pages: uiTotalPages,
        page_size: pageSize,
        total: serverTotal ?? totalClient,
        filters,
        setFilters,
        refresh,
        upsertOne,
    };
}

export default useProfits;
