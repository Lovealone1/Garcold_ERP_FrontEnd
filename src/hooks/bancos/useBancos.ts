"use client";
import { useEffect, useMemo, useState } from "react";
import { listBancos } from "@/services/sales/bancos.api";
import type { Banco } from "@/types/bancos";

type Filters = { q?: string; saldoFiltro?: "positivos" | "cero" | "todos" };

export function useBancos() {
    const [all, setAll] = useState<Banco[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>({ q: "", saldoFiltro: "todos" });

    const [refreshTick, setRefreshTick] = useState(0);
    const reload = () => setRefreshTick(t => t + 1);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const data = await listBancos(Date.now()); // cache-buster
                if (alive) setAll(data);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [refreshTick]);

    function upsertOne(patch: Partial<Banco> & { id: number }) {
        setAll(prev => {
            const i = prev.findIndex(x => x.id === patch.id);
            if (i === -1) return prev;
            const next = [...prev];
            next[i] = { ...next[i], ...patch };
            return next;
        });
    }

    const items = useMemo(() => {
        const v = (filters.q ?? "").trim().toLowerCase();
        return all.filter(b => {
            if (v && !b.nombre.toLowerCase().includes(v)) return false;
            if (filters.saldoFiltro === "positivos" && !(b.saldo > 0)) return false;
            if (filters.saldoFiltro === "cero" && !(b.saldo === 0)) return false;
            return true;
        });
    }, [all, filters.q, filters.saldoFiltro]);

    return {
        loading,
        items,                // lista filtrada completa, sin paginación
        total: items.length,  // útil para UI
        filters, setFilters,
        reload,
        upsertOne,
    };
}
