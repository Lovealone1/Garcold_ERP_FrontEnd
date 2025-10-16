"use client";

import { useEffect, useMemo, useState } from "react";
import { listDetallesCompra } from "@/services/sales/compras.api";
import type { DetalleCompraView } from "@/types/compras";

type Options = { enabled?: boolean };

export function useCompraDetalles(compraId?: number, options?: Options) {
    const enabled = options?.enabled ?? true;

    const [items, setItems] = useState<DetalleCompraView[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const fetchData = async () => {
        if (!compraId || !enabled) return;
        setLoading(true);
        setError(null);
        try {
            const data = await listDetallesCompra(compraId, Date.now());
            setItems(data);
        } catch (e) {
            setItems([]);
            setError(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let alive = true;
        if (!compraId || !enabled) {
            setItems([]);
            return;
        }
        setLoading(true);
        setError(null);
        listDetallesCompra(compraId, Date.now())
            .then((data) => alive && setItems(data))
            .catch((e) => {
                if (!alive) return;
                setError(e);
                setItems([]);
            })
            .finally(() => alive && setLoading(false));
        return () => {
            alive = false;
        };
    }, [compraId, enabled]);

    const total = useMemo(() => items.reduce((s, d) => s + d.total, 0), [items]);

    return { items, total, loading, error, reload: fetchData };
}
