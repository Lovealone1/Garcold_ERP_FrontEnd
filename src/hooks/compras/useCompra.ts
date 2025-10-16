"use client";
import { useCallback, useEffect, useState } from "react";
import { getCompraById } from "@/services/sales/compras.api";
import type { Compra } from "@/types/compras";

export function useCompra(compraId: number | null) {
    const [compra, setCompra] = useState<Compra | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIt = useCallback(async () => {
        if (!compraId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getCompraById(compraId);
            setCompra(data);
        } catch (e: any) {
            setError(e?.response?.data?.detail ?? e?.message ?? "Error al cargar compra");
        } finally {
            setLoading(false);
        }
    }, [compraId]);

    useEffect(() => { fetchIt(); }, [fetchIt]);

    return { compra, loading, error, refetch: fetchIt };
}
