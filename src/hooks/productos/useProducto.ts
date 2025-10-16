"use client";
import { useEffect, useState, useCallback } from "react";
import { getProductById } from "@/services/sales/productos.api";
import type { ProductDTO } from "@/types/productos";

export function useProducto(productoId: number | null) {
    const [producto, setProducto] = useState<ProductDTO | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchIt = useCallback(async () => {
        if (!productoId) return;
        setLoading(true);
        setError(null);
        try {
            const data = await getProductById(productoId);
            setProducto(data);
        } catch (e: any) {
            setError(e?.message ?? "Error al cargar producto");
        } finally {
            setLoading(false);
        }
    }, [productoId]);

    useEffect(() => { fetchIt(); }, [fetchIt]);

    return { producto, loading, error, refetch: fetchIt };
}
