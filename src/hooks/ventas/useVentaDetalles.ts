"use client";

import { useEffect, useMemo, useState } from "react";
import { listDetallesVenta } from "@/services/sales/ventas.api";
import type { DetalleVentaView } from "@/types/ventas";

type Options = { enabled?: boolean };

export function useVentaDetalles(ventaId?: number, options?: Options) {
    const enabled = options?.enabled ?? true;

    const [items, setItems] = useState<DetalleVentaView[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<unknown>(null);

    const fetchData = async () => {
        if (!ventaId || !enabled) return;
        setLoading(true);
        setError(null);
        try {
            const data = await listDetallesVenta(ventaId, Date.now());
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
        if (!ventaId || !enabled) {
            setItems([]);
            return;
        }
        setLoading(true);
        setError(null);
        listDetallesVenta(ventaId, Date.now())
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
    }, [ventaId, enabled]);

    const total = useMemo(() => items.reduce((s, d) => s + d.total, 0), [items]);

    return { items, total, loading, error, reload: fetchData };
}
