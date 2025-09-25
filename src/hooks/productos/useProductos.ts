// hooks/productos/useProductos.ts
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAllProductos } from "@/services/sales/productos.api";
import type { Producto } from "@/types/productos";

type Filters = { q?: string; estado?: "activos" | "inactivos" };

export function useProductos(pageSize = 10) {
    const [all, setAll] = useState<Producto[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<Filters>({ q: "" });

    const [refreshTick, setRefreshTick] = useState(0);
    const reload = () => setRefreshTick((t) => t + 1);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const data = await fetchAllProductos(undefined, Date.now());
                if (alive) setAll(data);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [refreshTick]);

    function upsertOne(patch: Partial<Producto> & { id: number }) {
        setAll((prev) => {
            const i = prev.findIndex((x) => x.id === patch.id);
            if (i === -1) return prev;
            const next = [...prev];
            next[i] = { ...next[i], ...patch };
            return next;
        });
    }

    const filtered = useMemo(() => {
        const v = (filters.q ?? "").trim().toLowerCase();
        return all.filter((p) => {
            if (v && !(p.referencia.toLowerCase().includes(v) || p.descripcion.toLowerCase().includes(v))) return false;
            if (filters.estado === "activos" && !p.activo) return false;
            if (filters.estado === "inactivos" && p.activo) return false;
            return true;
        });
    }, [all, filters.q, filters.estado]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);
    const items = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    useEffect(() => { setPage(1); }, [filters]);

    return {
        loading,
        items,
        page: safePage,
        setPage,
        pageSize,
        total,
        totalPages,
        hasPrev: safePage > 1,
        hasNext: safePage < totalPages,
        filters, setFilters,
        // puedes exponer options si luego agregas más filtros
        options: {},
        reload,
        upsertOne,
    };
}
