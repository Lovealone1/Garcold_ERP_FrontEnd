// hooks/transactions/useTransactions.ts
"use client";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useInfiniteQuery, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { TransactionView, TransactionPageDTO } from "@/types/transaction";
import { listTransactions } from "@/services/sales/transaction.api";
import { useRtVersion } from "@/lib/realtime/rtVersion";

export type OriginFilter = "all" | "auto" | "manual";
export interface TransactionFilters { q?: string; bank?: string; type?: string; origin?: OriginFilter; }
type Page = TransactionPageDTO;

// IMPORTANTE: filtros FUERA de la key y del fetch
function fetchKey(pageSize: number, rtVersion: number) {
    return { pageSize, rtVersion };
}

export function useTransactions(initialPage = 1, pageSize = 8) {
    const qc = useQueryClient();
    const rtVersion = useRtVersion();
    const [page, setPage] = useState(initialPage);
    const [filters, setFilters] = useState<TransactionFilters>({ q: "", bank: "", type: "", origin: "all" });

    const fkey = useMemo(() => fetchKey(pageSize, rtVersion), [pageSize, rtVersion]);

    // HEAD (page 1) - sin filtros en el fetch
    const headKey = useMemo(() => ["transactions-head", fkey] as const, [fkey]);
    const head = useQuery<Page, Error>({
        queryKey: headKey,
        queryFn: ({ signal }) => listTransactions(1, { signal, page_size: fkey.pageSize }),
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    // TAIL (pages 2+) - sin filtros en el fetch
    const tailKey = useMemo(() => ["transactions", fkey] as const, [fkey]);
    const tail = useInfiniteQuery<Page, Error, InfiniteData<Page>, typeof tailKey, number>({
        queryKey: tailKey,
        enabled: !!head.data,                   // arranca cuando HEAD está lista
        initialPageParam: 2,
        queryFn: ({ pageParam = 2, signal }) =>
            listTransactions(pageParam, { signal, page_size: fkey.pageSize }),
        getNextPageParam: (last) => {
            const cur = last.page ?? 1;
            if (last.has_next === true) return cur + 1;
            if (typeof last.total_pages === "number" && cur < last.total_pages) return cur + 1;
            if (Array.isArray(last.items) && last.page_size && last.items.length === last.page_size) return cur + 1;
            return undefined;
        },
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    // Prefetch secuencial del TAIL
    useEffect(() => {
        if (!tail.data?.pages?.length) return;
        let cancelled = false;
        const prefetchAll = async () => {
            if (cancelled || tail.isFetchingNextPage || !tail.hasNextPage) return;
            await tail.fetchNextPage({ cancelRefetch: true });
            const data = qc.getQueryData<InfiniteData<Page>>(tailKey);
            const pages = data?.pages ?? [];
            const last = pages[pages.length - 1];
            const canContinue =
                last?.has_next === true ||
                (typeof last?.total_pages === "number" && pages.length + 1 < last.total_pages) || // +1 por HEAD
                (Array.isArray(last?.items) && last.page_size && last.items.length === last.page_size);
            if (!cancelled && canContinue) setTimeout(prefetchAll, 120);
        };
        const t = setTimeout(prefetchAll, 120);
        return () => { cancelled = true; clearTimeout(t); };
    }, [tail.data?.pages?.length, tail.hasNextPage, tail.isFetchingNextPage, qc, tailKey, tail.fetchNextPage]);

    // Cambiar filtros → volver a page 1 (sin refetch)
    useEffect(() => { setPage(1); }, [filters.q, filters.bank, filters.type, filters.origin]);

    // ---------- SOLO PARA FILTROS: base = TODO lo cargado (HEAD + TAIL) ----------
    const loadedPages: Page[] = useMemo(() => {
        const out: Page[] = [];
        if (head.data) out.push(head.data);
        if (tail.data?.pages?.length) out.push(...tail.data.pages);
        return out;
    }, [head.data, tail.data?.pages]);

    // Aplana y dedup por id a partir de TODO lo cargado
    const all: TransactionView[] = useMemo(() => {
        const flat = loadedPages.flatMap(p => p.items ?? []);
        const byId = new Map<number, TransactionView>();
        for (const t of flat) byId.set(t.id, t);
        const uniq = Array.from(byId.values());
        return uniq.sort((a, b) => {
            const ta = +new Date(a.created_at), tb = +new Date(b.created_at);
            return tb !== ta ? tb - ta : (b.id ?? 0) - (a.id ?? 0);
        });
    }, [loadedPages]);

    // Filtros 100% locales (normalizados)
    const qNorm = (filters.q ?? "").trim().toLowerCase();
    const bankNorm = (filters.bank ?? "").trim();
    const typeNorm = (filters.type ?? "").trim();
    const originF = (filters.origin ?? "all") as OriginFilter;

    const filtered = useMemo(
        () => all.filter((r) => {
            const byQ =
                !qNorm ||
                String(r.id).includes(qNorm) ||
                r.bank.toLowerCase().includes(qNorm) ||
                r.type_str.toLowerCase().includes(qNorm) ||
                (r.description ?? "").toLowerCase().includes(qNorm);

            const byBank = !bankNorm || r.bank === bankNorm;
            const byType = !typeNorm || r.type_str === typeNorm;
            const byOrigin = originF === "all" || (originF === "auto" ? r.is_auto : !r.is_auto);

            return byQ && byBank && byType && byOrigin;
        }),
        [all, qNorm, bankNorm, typeNorm, originF]
    );

    // Paginación SIEMPRE desde los datos filtrados (cliente)
    const clientTotal = filtered.length;
    const uiTotalPages = Math.max(1, Math.ceil(clientTotal / pageSize));
    const safePage = Math.min(page, uiTotalPages);

    const items = useMemo(
        () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
        [filtered, safePage, pageSize]
    );

    const options = useMemo(() => {
        const banks = Array.from(new Set(all.map((x) => x.bank))).sort();
        const types = Array.from(new Set(all.map((x) => x.type_str))).sort();
        return { banks, types };
    }, [all]);

    const refresh = () => {
        qc.invalidateQueries({ queryKey: headKey, refetchType: "active" });
        qc.invalidateQueries({ queryKey: tailKey, refetchType: "active" });
    };

    const loadingHead = head.isLoading || (!head.data && head.isFetching);
    const loadingTail = page > 1 && tail.isFetching && !tail.data?.pages?.length;

    const hasMoreServer = !!tail.hasNextPage;
    const isFetchingMore = tail.isFetchingNextPage;
    const loadMore = () => {
        if (hasMoreServer && !isFetchingMore) return tail.fetchNextPage({ cancelRefetch: true });
        return Promise.resolve();
    };

    // Info de server (opcional, solo informativa, NO usada para UI)
    const serverTotal = head.data?.total ?? null;
    const serverTotalPages = head.data?.page_size ? Math.max(1, Math.ceil((head.data.total ?? 0) / head.data.page_size)) : null;

    return {
        page: safePage,
        setPage,
        items,
        loading: loadingHead || loadingTail,
        error: head.isError ? (head.error as Error).message : (tail.isError ? (tail.error as Error).message : null),
        refresh,
        loadMore,
        hasMoreServer,
        isFetchingMore,
        total_pages: uiTotalPages,  // locales
        page_size: pageSize,
        total: clientTotal,         // local
        filters,
        setFilters,
        options,
        serverTotal,                // opcional
        serverTotalPages,           // opcional
    };
}
