// hooks/transactions/useTransactions.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { TransactionView, TransactionPageDTO } from "@/types/transaction";
import { listTransactions } from "@/services/sales/transaction.api";

export type OriginFilter = "all" | "auto" | "manual";

export interface TransactionFilters {
    q?: string;
    bank?: string;   // bank name
    type?: string;   // type_str
    origin?: OriginFilter;
}

/**
 * Loads all transactions (paginated fetch) and paginates locally.
 * Supports global filters and combo options.
 */
export function useTransactions(initialPage = 1, pageSize = 10) {
    const [page, setPage] = useState(initialPage);
    const [all, setAll] = useState<TransactionView[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState<TransactionFilters>({
        q: "",
        bank: "",
        type: "",
        origin: "all",
    });

    const nonceRef = useRef<number>(0);
    const mounted = useRef(true);

    const fetchAll = useCallback(async () => {
        setLoading(true);
        setError(null);
        const nonce = Date.now();
        nonceRef.current = nonce;
        try {
            const first: TransactionPageDTO = await listTransactions(1, nonce);
            if (!mounted.current || nonceRef.current !== nonce) return;

            const acc: TransactionView[] = [...first.items];
            for (let p = 2; p <= first.total_pages; p++) {
                const res = await listTransactions(p, nonce);
                if (!mounted.current || nonceRef.current !== nonce) return;
                acc.push(...res.items);
            }

            if (!mounted.current || nonceRef.current !== nonce) return;
            setAll(acc);
        } catch (e: any) {
            if (mounted.current && nonceRef.current === nonce) {
                setError(e?.message ?? "Error al cargar transacciones");
            }
        } finally {
            if (mounted.current && nonceRef.current === nonce) setLoading(false);
        }
    }, []);

    useEffect(() => {
        mounted.current = true;
        fetchAll();
        return () => {
            mounted.current = false;
        };
    }, [fetchAll]);

    // Opciones únicas globales
    const options = useMemo(() => {
        const banks = Array.from(new Set(all.map(x => x.bank))).sort();
        const types = Array.from(new Set(all.map(x => x.type_str))).sort();
        return { banks, types };
    }, [all]);

    // Filtros
    const filtered = useMemo(() => {
        const v = (filters.q ?? "").trim().toLowerCase();
        const originF = (filters.origin ?? "all") as OriginFilter;

        return all.filter(r => {
            const byQ =
                !v ||
                String(r.id).includes(v) ||
                r.bank.toLowerCase().includes(v) ||
                r.type_str.toLowerCase().includes(v) ||
                (r.description ?? "").toLowerCase().includes(v);

            const byBank = !filters.bank || r.bank === filters.bank;
            const byType = !filters.type || r.type_str === filters.type;
            const byOrigin =
                originF === "all" ||
                (originF === "auto" ? r.is_auto : !r.is_auto);

            return byQ && byBank && byType && byOrigin;
        });
    }, [all, filters]);

    // Reset page when filters change
    useEffect(() => {
        setPage(1);
    }, [filters.q, filters.bank, filters.type, filters.origin]);

    // Client-side pagination
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
        page: safePage,
        setPage,
        items,
        loading,
        error,
        refresh,

        has_next,
        has_prev,
        total_pages,
        page_size: pageSize,
        total,

        filters,
        setFilters,
        options,
    };
}
