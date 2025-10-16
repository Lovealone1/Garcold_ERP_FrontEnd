"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { fetchAllProducts } from "@/services/sales/productos.api"; // <- ruta nueva
import type { ProductDTO } from "@/types/productos";

type Filters = { q?: string; estado?: "activos" | "inactivos" };

export function useProductos(pageSize = 10) {
    const [all, setAll] = useState<ProductDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [filters, setFilters] = useState<Filters>({ q: "" });

    const [refreshTick, setRefreshTick] = useState(0);
    const reload = () => setRefreshTick((t) => t + 1);

    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        let alive = true;
        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        (async () => {
            setLoading(true);
            try {
                const data = await fetchAllProducts(
        /* sin params */ undefined,
                    { nocacheToken: Date.now(), signal: controller.signal }
                );
                if (alive && !controller.signal.aborted) setAll(data);
            } catch (e) {
                // silenciar cancelaciones
                const canceled = controller.signal.aborted;
                if (!canceled) console.error(e);
            } finally {
                if (alive) setLoading(false);
            }
        })();

        return () => { alive = false; controller.abort(); };
    }, [refreshTick]);

    function upsertOne(patch: Partial<ProductDTO> & { id: number }) {
        setAll((prev) => {
            const i = prev.findIndex((x) => x.id === patch.id);
            if (i === -1) return prev;
            const next = [...prev];
            next[i] = { ...next[i], ...patch };
            return next;
        });
    }

    const filtered = useMemo(() => {
        const estado = filters.estado;
        return all.filter((p) => {
            if (estado === "activos" && !p.is_active) return false;
            if (estado === "inactivos" && p.is_active) return false;
            return true;
        });
    }, [all, filters.estado]);

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const items = useMemo(() => {
        const v = (filters.q ?? "").trim().toLowerCase();
        const byText = v
            ? filtered.filter(
                (p) =>
                    p.reference.toLowerCase().includes(v) ||
                    p.description.toLowerCase().includes(v)
            )
            : filtered;

        const start = (safePage - 1) * pageSize;
        return byText.slice(start, start + pageSize);
    }, [filtered, filters.q, safePage, pageSize]);

    useEffect(() => {
        setPage(1);
    }, [filters.q, filters.estado]);

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
        filters,
        setFilters,
        options: {},
        reload,
        upsertOne,
    };
}

export default useProductos;
