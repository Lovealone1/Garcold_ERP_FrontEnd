"use client";
import { useState } from "react";
import { deletePurchasePayment } from "@/services/sales/purchase.api";

export function useDeletePurchasePayment() {
    const [loading, setLoading] = useState(false);

    async function remove(paymentId: number): Promise<boolean> {
        setLoading(true);
        try {
            await deletePurchasePayment(paymentId);
            return true;
        } finally {
            setLoading(false);
        }
    }

    return { remove, loading };
}

export function useDeletePagoCompra() {
    return useDeletePurchasePayment();
}
