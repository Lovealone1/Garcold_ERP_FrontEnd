"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { listProducts } from "@/services/sales/product.api";
import type { ProductDTO, ProductPageDTO } from "@/types/product";

type Estado = "activos" | "inactivos" | undefined;
export type ProductFilters = { q?: string; estado?: Estado };

export function useProductos(initialPage = 1, pageSize = 10) {
    const qc = useQueryClient();

    const [page, setPage] = useState(initialPage);
    const [filters, setFilters] = useState<ProductFilters>({ q: "", estado: undefined });

    const key = useMemo(
        () => ["products", { q: filters.q || "", estado: filters.estado || "", pageSize }] as const,
        [filters.q, filters.estado, pageSize]
    );

    const query = useInfiniteQuery<ProductPageDTO, Error, InfiniteData<ProductPageDTO>, typeof key, number>({
        queryKey: key,
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1, signal, queryKey }) => {
            const [, f] = queryKey;
            return listProducts(pageParam, { signal, q: f.q, page_size: f.pageSize });
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

    const all: ProductDTO[] = useMemo(() => (query.data?.pages ?? []).flatMap((p) => p.items), [query.data]);

    const v = (filters.q ?? "").trim().toLowerCase();
    const filtered = useMemo(() => {
        return all.filter((p) => {
            if (filters.estado === "activos" && !p.is_active) return false;
            if (filters.estado === "inactivos" && p.is_active) return false;
            if (!v) return true;
            return p.reference.toLowerCase().includes(v) || (p.description ?? "").toLowerCase().includes(v);
        });
    }, [all, filters.estado, v]);

    useEffect(() => { setPage(1); }, [filters.q, filters.estado]);

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

                const pagesLoaded = (qc.getQueryData<InfiniteData<ProductPageDTO>>(key)?.pages?.length ?? 0);
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
    }, [
        filters.q, filters.estado, pageSize,
        query.data?.pages?.[0]?.page, query.data?.pages?.length,
    ]);

    const loadMore = () => {
        if (hasMoreServer && !isFetchingMore) return query.fetchNextPage({ cancelRefetch: true });
        return Promise.resolve();
    };

    const refresh = () => qc.invalidateQueries({ queryKey: key });

    function upsertOne(patch: Partial<ProductDTO> & { id: number }) {
        qc.setQueryData<InfiniteData<ProductPageDTO, number>>(key, (data) => {
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

export default useProductos;
