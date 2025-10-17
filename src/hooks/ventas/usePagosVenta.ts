"use client";
import { useEffect, useState, useCallback } from "react";
import type { SalePayment } from "@/types/sale";
import { listSalePayments } from "@/services/sales/sale.api";

export function usePagosVenta(ventaId: number | null) {
    const [items, setItems] = useState<SalePayment[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!ventaId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await listSalePayments(ventaId);
            setItems(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? "Error cargando pagos");
        } finally {
            setLoading(false);
        }
    }, [ventaId]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { items, loading, error, reload, setItems };
}
