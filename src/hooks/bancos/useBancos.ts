"use client";
import { useCallback, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listBanks } from "@/services/sales/bank.api";
import { queryKeys } from "@/lib/query/queryKeys";
import type { Bank } from "@/types/bank";

type Filters = { q?: string; saldoFiltro?: "positivos" | "cero" | "todos" };

/**
 * Bank balances, backed by TanStack Query.
 *
 * This used to be a hand-rolled useState/useEffect fetcher, which meant it sat
 * outside the query cache entirely: every `invalidateQueries(["banks"])` in the
 * app was a silent no-op, so a sale, expense or payment updated the balance on
 * the server while the UI kept the number it fetched on mount.
 *
 * Balances are the single most cross-cutting value in the app -- almost every
 * movement touches one -- so it has to be invalidatable.
 *
 * The return shape is unchanged so no call site had to move.
 */
export function useBancos() {
    const qc = useQueryClient();
    const [filters, setFilters] = useState<Filters>({ q: "", saldoFiltro: "todos" });

    const query = useQuery<Bank[]>({
        queryKey: queryKeys.banks.list(),
        queryFn: ({ signal }) => listBanks(undefined, { signal }),
        // A balance is the most volatile number on screen; never serve it stale.
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const all = useMemo(() => query.data ?? [], [query.data]);

    const reload = useCallback(() => {
        void qc.invalidateQueries({ queryKey: queryKeys.banks.all });
    }, [qc]);

    /**
     * Patch one bank in place after a mutation returns the updated row, so the
     * balance moves without waiting for a refetch. The invalidation that
     * follows still reconciles against the server.
     */
    const upsertOne = useCallback(
        (patch: Partial<Bank> & { id: number }) => {
            qc.setQueryData<Bank[]>(queryKeys.banks.list(), (prev) => {
                if (!prev) return prev;
                const i = prev.findIndex((x) => x.id === patch.id);
                if (i === -1) return prev;
                const next = [...prev];
                next[i] = { ...next[i], ...patch };
                return next;
            });
        },
        [qc]
    );

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
        loading: query.isPending,
        items,
        total: items.length,
        filters,
        setFilters,
        reload,
        upsertOne,
    };
}
