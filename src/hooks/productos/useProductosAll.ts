"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { listProductosAll } from "@/services/sales/productos.api";
import type { Producto } from "@/types/productos";

type Option = { value: number; label: string };

export function useProductosAll(nocacheToken?: number) {
    const [items, setItems] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const reload = useCallback(
        async (token = nocacheToken) => {
            setLoading(true);
            setError(null);
            try {
                const data = await listProductosAll(token ?? Date.now());
                setItems(Array.isArray(data) ? data : []);
            } catch (e: any) {
                setError(e?.response?.data?.detail ?? e?.message ?? "Error cargando productos");
                setItems([]);
            } finally {
                setLoading(false);
            }
        },
        [nocacheToken]
    );

    useEffect(() => {
        reload();
    }, [reload]);

    const options: Option[] = useMemo(
        () =>
            items.map((p) => ({
                value: p.id,
                label: p.descripcion ? `${p.referencia} — ${p.descripcion}` : p.referencia,
            })),
        [items]
    );

    return { items, options, loading, error, reload };
}
