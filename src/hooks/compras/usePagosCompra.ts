"use client";
import { useEffect, useState, useCallback } from "react";
import type { PagoCompra } from "@/types/compras";
import { listPagosCompra } from "@/services/sales/compras.api";

export function usePagosCompra(compraId: number | null) {
    const [items, setItems] = useState<PagoCompra[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!compraId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await listPagosCompra(compraId);
            setItems(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? "Error cargando pagos de la compra");
        } finally {
            setLoading(false);
        }
    }, [compraId]);

    useEffect(() => {
        reload();
    }, [reload]);

    return { items, loading, error, reload, setItems };
}
