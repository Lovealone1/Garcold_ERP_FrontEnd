"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { deletePurchasePayment } from "@/services/sales/purchase.api";
import { invalidateMovement } from "@/lib/query/invalidateMovement";
import { queryKeys } from "@/lib/query/queryKeys";
import type { Purchase, PurchasePage } from "@/types/purchase";

function patchPurchaseById(
    data: PurchasePage | undefined,
    purchaseId: number,
    updater: (p: Purchase) => Purchase
): PurchasePage | undefined {
    if (!data || !Array.isArray(data.items)) return data;
    return {
        ...data,
        items: data.items.map((purchase) =>
            purchase.id === purchaseId ? updater(purchase) : purchase
        ),
    };
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

            qc.setQueriesData<PurchasePage>(
                { queryKey: queryKeys.purchases.all },
                (curr) =>
                    patchPurchaseById(curr, purchaseId, (p) => {
                        const prev = Number(p.balance ?? 0);
                        const newRem = Math.max(prev + (Number(amount) || 0), 0);

                        return {
                            ...p,
                            balance: newRem,
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
