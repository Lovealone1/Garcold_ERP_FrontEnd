"use client";
import { useEffect, useMemo, useState } from "react";
import { listEstados } from "@/services/sales/estados.api";
import type { Estado } from "@/types/estados";

type UseEstadosOpts = { prefix?: string };

export function useEstados(opts: UseEstadosOpts = {}) {
    const [raw, setRaw] = useState<Estado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tick, setTick] = useState(0);
    const reload = () => setTick(t => t + 1);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await listEstados(Date.now());
                if (alive) setRaw(data);
            } catch (e: any) {
                if (alive) setError(e?.message ?? "Error al cargar estados");
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [tick]);

    const prefix = opts.prefix;

    const items = useMemo(() => {
        if (!prefix) return raw;
        return raw.filter(e => e.nombre.startsWith(prefix));
    }, [raw, prefix]);

    const options = useMemo(() => items.map(e => e.nombre).sort(), [items]);
    const byName = useMemo(
        () => Object.fromEntries(items.map(e => [e.nombre, e.id])) as Record<string, number>,
        [items]
    );
    return { items, options, loading, error, reload, byName };
}

// atajos
export const useVentaEstados = () => useEstados({ prefix: "Venta" });
export const useCompraEstados = () => useEstados({ prefix: "Compra" });
