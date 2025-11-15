"use client";

import { useState } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { deletePurchasePayment } from "@/services/sales/purchase.api";
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
    if (!data) return data;

    const pages = data.pages.map((p) => ({
        ...p,
        items: p.items.map((purchase) =>
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

            qc.invalidateQueries({ queryKey: ["purchases"], refetchType: "active" });
            qc.invalidateQueries({
                queryKey: ["purchase-payments", { purchaseId }],
                refetchType: "active",
            });
            qc.invalidateQueries({ queryKey: ["transactions"], refetchType: "active" });

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
