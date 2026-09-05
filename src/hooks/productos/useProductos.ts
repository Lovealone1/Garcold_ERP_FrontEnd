"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProducts } from "@/services/sales/product.api";
import { queryKeys } from "@/lib/query/queryKeys";
import type { ProductDTO, ProductPageDTO } from "@/types/product";

type Filters = { q?: string; estado?: string };

type Estado = "activos" | "inactivos";

function toQueryParams(filters: Filters) {
    return {
        q: filters.q?.trim() || undefined,
        estado:
            filters.estado === "activos" || filters.estado === "inactivos"
                ? (filters.estado as Estado)
                : undefined,
    };
}

/**
 * Products list, paginated and filtered by the API.
 *
 * It used to pump every page into memory and filter the copy, which for an
 * inventory of any size meant a long burst of sequential requests each time
 * the screen opened.
 */
export function useProductos(initialPage = 1, pageSize = 10) {
    const qc = useQueryClient();
    const [page, setPage] = useState(initialPage);
    const [filters, setFilters] = useState<Filters>({});

    const params = useMemo(() => toQueryParams(filters), [filters]);

    useEffect(() => {
        setPage(1);
    }, [params.q, params.estado]);

    const listKey = useMemo(
        () => queryKeys.products.list({ page, pageSize, ...params }),
        [page, pageSize, params]
    );

    const query = useQuery<ProductPageDTO>({
        queryKey: listKey,
        queryFn: ({ signal }) =>
            listProducts(page, { signal, page_size: pageSize, ...params }),
        placeholderData: keepPreviousData,
    });

    const data = query.data;
    const total = data?.total ?? 0;
    const totalPages = Math.max(1, data?.total_pages ?? 1);

    const refresh = useCallback(
        () => qc.invalidateQueries({ queryKey: queryKeys.products.all }),
        [qc]
    );

    const upsertOne = useCallback(
        (patch: Partial<ProductDTO> & { id: number }) => {
            qc.setQueryData<ProductPageDTO>(listKey, (current) => {
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
        items: data?.items ?? [],
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
    };
}

export default useProductos;
