"use client";
import { useEffect, useMemo, useState } from "react";
import { listBanks } from "@/services/sales/bank.api";
import type { Bank } from "@/types/bank";

type Filters = { q?: string; saldoFiltro?: "positivos" | "cero" | "todos" };

export function useBancos() {
    const [all, setAll] = useState<Bank[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<Filters>({ q: "", saldoFiltro: "todos" });

    const [refreshTick, setRefreshTick] = useState(0);
    const reload = () => setRefreshTick((t) => t + 1);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const data = await listBanks(Date.now());
                if (alive) setAll(data);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => {
            alive = false;
        };
    }, [refreshTick]);

    function upsertOne(patch: Partial<Bank> & { id: number }) {
        setAll((prev) => {
            const i = prev.findIndex((x) => x.id === patch.id);
            if (i === -1) return prev;
            const next = [...prev];
            next[i] = { ...next[i], ...patch };
            return next;
        });
    }

    const items = useMemo(() => {
        const v = (filters.q ?? "").trim().toLowerCase();
        return all.filter((b) => {
            if (v && !b.name.toLowerCase().includes(v)) return false;
            if (filters.saldoFiltro === "positivos" && !(b.balance > 0)) return false;
            if (filters.saldoFiltro === "cero" && !(b.balance === 0)) return false;
            return true;
        });
    }, [all, filters.q, filters.saldoFiltro]);

    return {
        loading,
        items,
        total: items.length,
        filters,
        setFilters,
        reload,
        upsertOne,
    };
}
