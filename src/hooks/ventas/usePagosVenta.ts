"use client";
import { useEffect, useState, useCallback } from "react";
import type { PagoVenta } from "@/types/ventas";
import { listPagosVenta } from "@/services/sales/ventas.api";

export function usePagosVenta(ventaId: number | null) {
    const [items, setItems] = useState<PagoVenta[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(async () => {
        if (!ventaId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await listPagosVenta(ventaId);
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
