"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { listLoans } from "@/services/sales/loan.api";
import type { LoansPage, Loan } from "@/types/loan";

export function useLoans(page = 1) {
  const [data, setData] = useState<LoansPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [refreshTick, setRefreshTick] = useState(0); // ← hard refresh

  const fetchPage = useCallback(
    async (p = page, cacheBust = Date.now()) => {
      setLoading(true);
      setError(null);
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      try {
        const res = await listLoans(p, cacheBust);
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
  }, [page, refreshTick, fetchPage]); // ← incluye refreshTick

  const refresh = useCallback(
    (hard = false) => {
      if (hard) setRefreshTick((t) => t + 1);
      else fetchPage(page, Date.now());
    },
    [fetchPage, page]
  );

  // Opcional: actualizar un préstamo en memoria
  const upsertOne = useCallback((patch: Partial<Loan> & { id: number }) => {
    setData((prev) =>
      prev
        ? {
          ...prev,
          items: prev.items.map((l) => (l.id === patch.id ? { ...l, ...patch } : l)),
        }
        : prev
    );
  }, []);

  return {
    data,
    items: data?.items ?? [],
    page: data?.page ?? page,
    loading,
    error,
    refresh,     // usa refresh(true) tras pagar o eliminar
    upsertOne,   // opcional para optimismo
  };
}
