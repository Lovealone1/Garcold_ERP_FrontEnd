"use client";

import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deletePurchasePayment } from "@/services/sales/purchase.api";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import type { Purchase } from "@/types/purchase";

type Page = {
    items: Purchase[];
    page: number;
    page_size: number;
    total?: number;
    total_pages?: number;
    has_next?: boolean;
};

function patchPurchaseById(
    data: InfiniteData<Page> | undefined,
    purchaseId: number,
    updater: (p: Purchase) => Purchase
): InfiniteData<Page> | undefined {
    // setQueriesData matches every query under the prefix, including any that
    // is not an infinite list. Bail out instead of throwing past the mutation.
    if (!data || !Array.isArray(data.pages)) return data;

    const pages = data.pages.map((p) => ({
        ...p,
        items: (p.items ?? []).map((purchase) =>
            purchase.id === purchaseId ? updater(purchase) : purchase
        ),
    }));

    return { ...data, pages, pageParams: data.pageParams } as InfiniteData<Page>;
}

export function useDeletePurchasePayment() {
    const qc = useQueryClient();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function remove(
        paymentId: number,
        purchaseId: number,
        amount: number
    ): Promise<boolean> {
        setLoading(true);
        setError(null);
        try {
            const ok = await deletePurchasePayment(paymentId);

            qc.setQueriesData<InfiniteData<Page>>(
                { queryKey: ["purchases"] },
                (curr) =>
                    patchPurchaseById(curr, purchaseId, (p) => {
                        const prev = Number(p.balance ?? 0);
                        const newRem = Math.max(prev + (Number(amount) || 0), 0);

                        return {
                            ...p,
                            remaining_balance: newRem,
                            status: newRem > 0 ? "Compra credito" : p.status,
                        };
                    })
            );

            await invalidateMovement(qc, {
                kind: "purchase_payment",
                ids: { purchaseId },
            });

            return !!ok;
        } catch (e: any) {
            setError(
                e?.response?.data?.detail ??
                e?.message ??
                "Error eliminando pago de compra"
            );
            throw e;
        } finally {
            setLoading(false);
        }
    }

    return { remove, loading, error };
}

export function useDeletePagoCompra() {
    return useDeletePurchasePayment();
}
