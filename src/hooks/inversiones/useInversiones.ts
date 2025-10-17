"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { listInvestments } from "@/services/sales/investment.api";
import type { InvestmentsPage } from "@/types/investment";

export function useInvestments(page = 1) {
  const [data, setData] = useState<InvestmentsPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(
    async (p = page) => {
      setLoading(true);
      setError(null);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await listInvestments(p, Date.now());
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
    fetchPage(page);
    return () => abortRef.current?.abort();
  }, [page, fetchPage]);

  const refresh = useCallback(() => fetchPage(page), [fetchPage, page]);

  return {
    data,
    items: data?.items ?? [],
    page: data?.page ?? page,
    loading,
    error,
    refresh,
  };
}
