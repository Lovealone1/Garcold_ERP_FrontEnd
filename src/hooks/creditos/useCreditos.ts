"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { listCreditos } from "@/services/sales/creditos.api";
import type { CreditosPage } from "@/types/creditos";

export function useCreditos(page = 1) {
  const [data, setData] = useState<CreditosPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchPage = useCallback(async (p = page) => {
    setLoading(true);
    setError(null);
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await listCreditos(p, Date.now());
      if (!ac.signal.aborted) setData(res);
    } catch (e) {
      if (!ac.signal.aborted) setError(e);
    } finally {
      if (!ac.signal.aborted) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchPage(page);
    return () => abortRef.current?.abort();
  }, [page, fetchPage]);

  const refresh = useCallback(() => fetchPage(page), [fetchPage, page]);

  return { data, items: data?.items ?? [], page: data?.page ?? page, loading, error, refresh };
}
