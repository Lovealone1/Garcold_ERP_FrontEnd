"use client";
import { useEffect, useState, useCallback } from "react";
import type { PurchasePayment } from "@/types/purchase";
import { listPurchasePayments } from "@/services/sales/purchase.api";

export function usePurchasePayments(purchaseId: number | null) {
    const [items, setItems] = useState<PurchasePayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!purchaseId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await listPurchasePayments(purchaseId);
            setItems(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? "Error cargando pagos de la compra");
        } finally {
            setLoading(false);
        }
    }, [purchaseId]);

    useEffect(() => { reload(); }, [reload]);

    return { items, loading, error, reload, setItems };
}

export function usePagosCompra(compraId: number | null) {
    return usePurchasePayments(compraId);
}
