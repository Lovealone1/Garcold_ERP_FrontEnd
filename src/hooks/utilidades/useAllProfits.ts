"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchAllProfits } from "@/services/sales/profit.api";
import type { Profit } from "@/types/profit";

export function useAllProfits(initialForce?: number) {
    const qc = useQueryClient();
    const [forceTs, setForceTs] = useState<number | undefined>(initialForce);

    const key = useMemo(
        () => ["profits", "all", { force: forceTs ?? 0 }] as const,
        [forceTs]
    );

    const query = useQuery<Profit[]>({
        queryKey: key,
        queryFn: async ({ signal, queryKey }) => {
            const [, , meta] = queryKey;
            const nocacheToken =
                typeof (meta as any)?.force === "number" &&
                    (meta as any).force > 0
                    ? Date.now()
                    : undefined;
            return fetchAllProfits({ signal, nocacheToken });
        },
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 24 * 3,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const items = query.data ?? [];

    const totalProfit = useMemo(
        () => items.reduce((a, r) => a + (r.profit ?? 0), 0),
        [items]
    );

    const reload = () => setForceTs(Date.now());

    const invalidate = () =>
        qc.invalidateQueries({
            queryKey: ["profits"],
            refetchType: "active",
        });

    const primeFromPages = (allProfits: Profit[]) => {
        qc.setQueryData<Profit[]>(["profits", "all", { force: 0 }], allProfits);
    };

    return {
        items,
        totalProfit,
        loading: query.isLoading || query.isFetching,
        error: query.isError ? (query.error as Error).message : null,
        reload,
        invalidate,
        primeFromPages,
    };
}
