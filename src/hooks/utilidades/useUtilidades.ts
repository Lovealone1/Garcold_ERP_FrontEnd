"use client";
import { useEffect, useMemo, useState } from "react";
import { fetchAllProfits } from "@/services/sales/profit.api";
import type { Profit } from "@/types/profit";

export function useProfits(pageSize = 10) {
    const [all, setAll] = useState<Profit[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [refreshTick, setRefreshTick] = useState(0);
    const reload = () => setRefreshTick(t => t + 1);

    useEffect(() => {
        let alive = true;
        (async () => {
            setLoading(true);
            try {
                const data = await fetchAllProfits(Date.now());
                if (alive) setAll(data);
            } finally {
                if (alive) setLoading(false);
            }
        })();
        return () => { alive = false; };
    }, [refreshTick]);

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(page, totalPages);

    const items = useMemo(() => {
        const start = (safePage - 1) * pageSize;
        return all.slice(start, start + pageSize);
    }, [all, safePage, pageSize]);

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
        reload,
    };
}
