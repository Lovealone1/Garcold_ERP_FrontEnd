"use client";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { ProductDTO, ProductPageDTO } from "@/types/product";

export function useProductsCache() {
    const qc = useQueryClient();

    const invalidateAll = () =>
        qc.invalidateQueries({
            predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === "products",
        });

    const insertOptimistic = (p: ProductDTO) => {
        qc.setQueriesData<ProductDTO[]>(
            { predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === "products" && q.queryKey[1] === "all" },
            (cur) => {
                const list = cur ?? [];
                return list.some(x => x.id === p.id) ? list : [p, ...list];
            },
        );

        qc.setQueriesData<InfiniteData<ProductPageDTO, number>>(
            { predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === "products" && typeof (q.queryKey as any)[1] === "object" },
            (cur) => {
                if (!cur) return cur;
                const exists = cur.pages.some(pg => pg.items?.some(i => i.id === p.id));
                if (exists) return cur;
                const pages = cur.pages.map((pg, i) =>
                    i === 0
                        ? { ...pg, items: [p, ...(pg.items ?? [])], total: typeof pg.total === "number" ? pg.total + 1 : pg.total }
                        : pg,
                );
                return { ...cur, pages };
            },
        );
    };

    const patchOptimistic = (patch: Partial<ProductDTO> & { id: number }) => {
        qc.setQueriesData<ProductDTO[]>(
            { predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === "products" && q.queryKey[1] === "all" },
            (cur) => (cur ?? []).map(x => (x.id === patch.id ? { ...x, ...patch } as ProductDTO : x)),
        );
        qc.setQueriesData<InfiniteData<ProductPageDTO, number>>(
            { predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === "products" && typeof (q.queryKey as any)[1] === "object" },
            (cur) => {
                if (!cur) return cur;
                const pages = cur.pages.map(pg => ({
                    ...pg,
                    items: pg.items?.map(x => (x.id === patch.id ? { ...x, ...patch } as ProductDTO : x)) ?? [],
                }));
                return { ...cur, pages };
            },
        );
    };

    const removeOptimistic = (id: number) => {
        qc.setQueriesData<ProductDTO[]>(
            { predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === "products" && q.queryKey[1] === "all" },
            (cur) => (cur ?? []).filter(x => x.id !== id),
        );
        qc.setQueriesData<InfiniteData<ProductPageDTO, number>>(
            { predicate: q => Array.isArray(q.queryKey) && q.queryKey[0] === "products" && typeof (q.queryKey as any)[1] === "object" },
            (cur) => {
                if (!cur) return cur;
                const pages = cur.pages.map(pg => {
                    const next = (pg.items ?? []).filter(x => x.id !== id);
                    const delta = (pg.items?.length ?? 0) - next.length;
                    return { ...pg, items: next, total: typeof pg.total === "number" ? pg.total - delta : pg.total };
                });
                return { ...cur, pages };
            },
        );
    };

    return { invalidateAll, insertOptimistic, patchOptimistic, removeOptimistic };
}
