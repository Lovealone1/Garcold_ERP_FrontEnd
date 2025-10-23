"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { listLoans } from "@/services/sales/loan.api";
import type { LoansPage } from "@/types/loan";

export function useLoans(page = 1) {
  const [data, setData] = useState<LoansPage | null>(null);
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
        const res = await listLoans(p, Date.now());
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

  return { data, items: data?.items ?? [], page: data?.page ?? page, loading, error, refresh };
}
