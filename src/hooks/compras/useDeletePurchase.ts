"use client";

import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deletePurchase } from "@/services/sales/purchase.api";
import type { Purchase } from "@/types/purchase";

type PurchasePage = {
    items: Purchase[];
    page: number;
    page_size: number;
    total?: number;
    total_pages?: number;
    has_next?: boolean;
};

type Tx = { id: number; purchase_id?: number | null };
type TxPage = {
    items: Tx[];
    page: number;
    page_size: number;
    total?: number;
    total_pages?: number;
    has_next?: boolean;
};

function stripPurchaseFromInfinite(
    data: InfiniteData<PurchasePage> | undefined,
    purchaseId: number
) {
    if (!data) return data;
    let removed = false;

    const pages = data.pages.map((p) => {
        const filtered = p.items?.filter((x) => x.id !== purchaseId) ?? [];
        if (filtered.length !== (p.items?.length ?? 0)) removed = true;
        return { ...p, items: filtered };
    });

    if (!removed) return data;

    const first = pages[0];
    const total = Math.max(0, (first.total ?? 0) - 1);
    const pageSize = first.page_size || 1;
    const total_pages = Math.max(1, Math.ceil(total / pageSize));

    return {
        ...data,
        pages: pages.slice(0, total_pages),
        pageParams: data.pageParams,
    } as InfiniteData<PurchasePage>;
}

function stripTransactionsByPurchaseId(
    data: InfiniteData<TxPage> | undefined,
    purchaseId: number
) {
    if (!data) return data;
    let removed = false;

    const pages = data.pages.map((p) => {
        const filtered = (p.items ?? []).filter(
            (t) => Number(t.purchase_id) !== Number(purchaseId)
        );
        if (filtered.length !== (p.items?.length ?? 0)) removed = true;
        return { ...p, items: filtered };
    });

    if (!removed) return data;

    const first = pages[0];
    const total = Math.max(0, (first.total ?? 0) - 1); 
    const pageSize = first.page_size || 1;
    const total_pages = Math.max(1, Math.ceil(total / pageSize));

    return {
        ...data,
        pages: pages.slice(0, total_pages),
        pageParams: data.pageParams,
    } as InfiniteData<TxPage>;
}

export function useDeletePurchase() {
    const qc = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleDelete(id: number) {
        setLoading(true);
        setError(null);

        try {
            await deletePurchase(id);

            qc.setQueriesData<InfiniteData<PurchasePage>>(
                { queryKey: ["purchases"] },
                (curr) => stripPurchaseFromInfinite(curr, id)
            );

            qc.setQueriesData<InfiniteData<TxPage>>(
                { queryKey: ["transactions"] },
                (curr) => stripTransactionsByPurchaseId(curr, id)
            );

            qc.invalidateQueries({ queryKey: ["purchases"], refetchType: "active" });

            qc.invalidateQueries({
                predicate: ({ queryKey }) =>
                    Array.isArray(queryKey) && queryKey[0] === "transactions",
                refetchType: "active",
            });
        } catch (e: any) {
            const msg =
                e?.response?.data?.detail ?? e?.message ?? "Error eliminando compra";
            setError(msg);
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { deleteCompra: handleDelete, loading, error };
}
