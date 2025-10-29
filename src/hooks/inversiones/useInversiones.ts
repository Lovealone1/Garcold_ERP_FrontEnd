"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { listInvestments } from "@/services/sales/investment.api";
import type { InvestmentsPage } from "@/types/investment";

export function useInvestments(page = 1) {
  const [data, setData] = useState<InvestmentsPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [refreshKey, setRefreshKey] = useState<number>(0); // cambia para hard refresh
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (p = page, nocache = Date.now()) => {
      setLoading(true);
      setError(null);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await listInvestments(p, nocache); // _ts anti-cache
        if (!ac.signal.aborted) setData(res);
      } catch (e) {
        if (!ac.signal.aborted) setError(e);
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    },
    [page]
  );

  useEffect(() => {
    fetchPage(page, refreshKey || Date.now());
    return () => abortRef.current?.abort();
  }, [page, refreshKey, fetchPage]);

  const refresh = useCallback(
    (hard = false) => {
      if (hard) {
        // cambia la key para disparar el efecto y pasar un _ts nuevo
        setRefreshKey(Date.now());
      } else {
        // soft: reusa el mismo ciclo pero con nuevo _ts
        fetchPage(page, Date.now());
      }
    },
    [fetchPage, page]
  );

  return {
    data,
    items: data?.items ?? [],
    page: data?.page ?? page,
    loading,
    error,
    refresh, // usa refresh(true) tras agregar saldo o retirar
  };
}
