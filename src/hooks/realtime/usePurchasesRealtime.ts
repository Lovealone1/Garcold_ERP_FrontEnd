"use client";
import { useCallback } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { useRealtime } from "./useRealtime";
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

function stripId<T extends { id: number }>(
    data:
        | InfiniteData<{
            items: T[];
            page: number;
            page_size: number;
            total?: number;
            total_pages?: number;
            has_next?: boolean;
        }>
        | undefined,
    id: number
) {
    if (!data) return data;
    let removed = false;

    const pages = data.pages.map((p) => {
        const filtered = (p.items ?? []).filter((x) => x.id !== id);
        if (filtered.length !== (p.items?.length ?? 0)) removed = true;
        return { ...p, items: filtered };
    });

    if (!removed) return data;
    return { ...data, pages, pageParams: data.pageParams } as typeof data;
}

function stripTxByPurchaseId(
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
    return { ...data, pages, pageParams: data.pageParams } as InfiniteData<TxPage>;
}

type PurchaseEvent = {
    resource: "purchase";
    action: string;
    payload?: { id?: number | string };
};

function isPurchaseEvent(m: unknown): m is PurchaseEvent {
    if (!m || typeof m !== "object") return false;
    const r = m as Record<string, unknown>;
    return r.resource === "purchase" && typeof r.action === "string";
}

export function usePurchasesRealtime() {
    const qc = useQueryClient();

    const onMsg = useCallback(
        (m: unknown) => {
            console.log("[RT purchases] handler called with:", m);

            if (!isPurchaseEvent(m)) {
                console.log("[RT purchases] NOT purchase event");
                return;
            }

            const { action, payload } = m;
            const id = (payload as any)?.id;
            const purchaseId = id != null ? Number(id) : NaN;

            console.log("[RT purchases] event:", action, payload);

            if (action === "created") {
                console.log("[RT purchases] created -> invalidate purchases + transactions");
                qc.invalidateQueries({
                    predicate: ({ queryKey }) =>
                        Array.isArray(queryKey) && queryKey[0] === "purchases",
                    refetchType: "active",
                });

                qc.invalidateQueries({
                    predicate: ({ queryKey }) =>
                        Array.isArray(queryKey) && queryKey[0] === "transactions",
                    refetchType: "active",
                });

                return;
            }

            if (action === "deleted" && Number.isFinite(purchaseId)) {
                console.log("[RT purchases] deleted -> strip + invalidate", purchaseId);
                qc.setQueriesData<InfiniteData<PurchasePage>>(
                    { queryKey: ["purchases"] },
                    (curr) => stripId(curr, purchaseId)
                );
                qc.invalidateQueries({
                    predicate: ({ queryKey }) =>
                        Array.isArray(queryKey) && queryKey[0] === "purchases",
                    refetchType: "active",
                });

                qc.setQueriesData<InfiniteData<TxPage>>(
                    { queryKey: ["transactions"] },
                    (curr) => stripTxByPurchaseId(curr, purchaseId)
                );
                qc.invalidateQueries({
                    predicate: ({ queryKey }) =>
                        Array.isArray(queryKey) && queryKey[0] === "transactions",
                    refetchType: "active",
                });
            }
        },
        [qc]
    );

    useRealtime(onMsg);
}
