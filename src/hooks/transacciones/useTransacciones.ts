// hooks/transacciones/useTransacciones.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TransaccionResponse, TransaccionesPage, TransaccionVM } from "@/types/transacciones";
import { listTransacciones } from "@/services/sales/transaccion.api";
import { origenFromDescripcion, type Origen } from "@/utils/transacciones";

export type OrigenFilter = "all" | Origen;

export interface TransaccionesFilters {
    q?: string;
    banco?: string;     // label "Banco {id}"
    tipo?: string;      // tipo_str
    origen?: OrigenFilter;
}

/**
 * Carga TODO el dataset desde el backend y pagina en cliente.
 * Devuelve filtros globales y opciones globales para combos.
 */
export function useTransacciones(initialPage = 1, pageSize = 10) {
    const [page, setPage] = useState(initialPage);
    const [all, setAll] = useState<TransaccionVM[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<TransaccionesFilters>({ q: "", banco: "", tipo: "", origen: "all" });

    const nonceRef = useRef<number>(0);
    const mounted = useRef(true);

    const toVM = (r: TransaccionResponse): TransaccionVM => {
        const origen = origenFromDescripcion(r.descripcion);
        return { ...r, origen, locked: origen === "auto" };
    };

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        const nonce = Date.now();
        nonceRef.current = nonce;
        try {
            const first: TransaccionesPage = await listTransacciones(1, nonce);
            if (!mounted.current || nonceRef.current !== nonce) return;

            const acc: TransaccionVM[] = first.items.map(toVM);
            for (let p = 2; p <= first.total_pages; p++) {
                const res = await listTransacciones(p, nonce);
                if (!mounted.current || nonceRef.current !== nonce) return;
                acc.push(...res.items.map(toVM));
            }

            if (!mounted.current || nonceRef.current !== nonce) return;
            setAll(acc);
        } catch (e: any) {
            if (mounted.current && nonceRef.current === nonce) setError(e?.message ?? "Error");
        } finally {
            if (mounted.current && nonceRef.current === nonce) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        fetchAll();
        return () => { mounted.current = false; };
    }, [fetchAll]);

    // Opciones globales para combos
    const options = useMemo(() => {
        const bancos = Array.from(new Set(all.map(x => `Banco ${x.banco_id}`))).sort();
        const tipos = Array.from(new Set(all.map(x => x.tipo_str))).sort();
        return { bancos, tipos };
    }, [all]);

    // Filtros globales
    const filtered = useMemo(() => {
        const v = (filters.q ?? "").trim().toLowerCase();
        const origenF = (filters.origen ?? "all") as OrigenFilter;

        return all.filter(r => {
            const bancoLabel = `Banco ${r.banco_id}`;
            const byQ =
                !v ||
                String(r.id).includes(v) ||
                bancoLabel.toLowerCase().includes(v) ||
                r.tipo_str.toLowerCase().includes(v) ||
                (r.descripcion ?? "").toLowerCase().includes(v);

            const byBanco = !filters.banco || bancoLabel === filters.banco;
            const byTipo = !filters.tipo || r.tipo_str === filters.tipo;
            const byOrigen = origenF === "all" || r.origen === origenF;

            return byQ && byBanco && byTipo && byOrigen;
        });
    }, [all, filters]);

    // reset de página al cambiar filtros
    useEffect(() => { setPage(1); }, [filters.q, filters.banco, filters.tipo, filters.origen]);

    // Paginación en cliente
    const total = filtered.length;
    const total_pages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, total_pages);

    const items = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, safePage, pageSize]);

    const has_prev = safePage > 1;
    const has_next = safePage < total_pages;

    const refresh = useCallback(() => fetchAll(), [fetchAll]);

    return {
        // datos para UI
        page: safePage,
        setPage,
        items,
        loading,
        error,
        refresh,

        // paginación (cliente)
        has_next,
        has_prev,
        total_pages,
        page_size: pageSize,
        total,

        // filtros y opciones globales
        filters,
        setFilters,
        options,
    };
}
