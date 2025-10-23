import { useCallback, useEffect, useRef, useState } from "react";
import { fetchFinalDashboard } from "@/services/sales/dashboard.api";
import type { FinalReportDTO, RequestMetaDTO } from "@/types/reporte-general";

type Options = { auto?: boolean; topLimit?: number };

export function useFinalDashboard(
  initialParams?: RequestMetaDTO,
  { auto = true, topLimit = 10 }: Options = {}
) {
  const [params, setParams] = useState<RequestMetaDTO | undefined>(initialParams);
  const [data, setData] = useState<FinalReportDTO | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(
    async (override?: RequestMetaDTO) => {
      const payload = override ?? params;
      if (!payload) return;

      // cancelar petición anterior
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const resp = await fetchFinalDashboard(payload, {
          topLimit,
          nocacheToken: Date.now(),
          signal: controller.signal, // cancelación real
        });
        if (!mountedRef.current || controller.signal.aborted) return;
        setData(resp);
        setLastUpdated(Date.now());
      } catch (err: any) {
        if (!mountedRef.current || err?.name === "CanceledError") return;
        setError(err);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    },
    [params, topLimit]
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (auto && params) void refetch();
  }, [auto, params, refetch]);

  return { data, loading, error, lastUpdated, params, setParams, refetch };
}

export default useFinalDashboard;
