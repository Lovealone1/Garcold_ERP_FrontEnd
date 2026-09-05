"use client";
import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchFinalDashboard } from "@/services/sales/dashboard.api";
import { queryKeys } from "@/lib/query/queryKeys";
import type { FinalReportDTO, RequestMetaDTO } from "@/types/reporte-general";

type Options = { auto?: boolean; topLimit?: number };

/**
 * Aggregated dashboard report, backed by TanStack Query.
 *
 * Like useBancos, this was a hand-rolled fetcher living outside the query
 * cache, so every `invalidateQueries(["dashboard"])` was a no-op and the KPIs
 * stayed frozen at their mount-time values after any movement.
 *
 * The return shape is unchanged so the page did not have to move.
 */
export function useFinalDashboard(
    initialParams?: RequestMetaDTO,
    { auto = true, topLimit = 10 }: Options = {}
) {
    const qc = useQueryClient();
    const [params, setParams] = useState<RequestMetaDTO | undefined>(initialParams);

    // The dashboard drives this from the header period selector, so the hook
    // has to follow the params it is handed rather than freeze the first ones
    // it saw. Callers memoise them, so this fires only on a real change.
    useEffect(() => {
        setParams(initialParams);
    }, [initialParams]);

    const query = useQuery<FinalReportDTO>({
        queryKey: queryKeys.dashboard.detail({ params: params ?? null, topLimit }),
        queryFn: ({ signal }) =>
            fetchFinalDashboard(params as RequestMetaDTO, { topLimit, signal }),
        enabled: auto && !!params,
        staleTime: 0,
        refetchOnMount: "always",
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
    });

    const refetch = useCallback(
        async (override?: RequestMetaDTO) => {
            if (override) {
                setParams(override);
                return;
            }
            await qc.invalidateQueries({ queryKey: queryKeys.dashboard.all });
        },
        [qc]
    );

    return {
        data: query.data ?? null,
        loading: query.isPending && query.fetchStatus !== "idle",
        error: query.error,
        lastUpdated: query.dataUpdatedAt || null,
        params,
        setParams,
        refetch,
    };
}

export default useFinalDashboard;
