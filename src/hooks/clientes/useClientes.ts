"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { fetchAllCustomers } from "@/services/sales/customer.api";
import type { Customer } from "@/types/customer";

type Filters = { q?: string; cities?: string[]; pendingBalance?: "yes" | "no" };

export function useCustomers(pageSize = 10) {
  const [all, setAll] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ q: "" });

  const [refreshTick, setRefreshTick] = useState(0);
  const reload = () => setRefreshTick((t) => t + 1);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllCustomers(undefined, Date.now()); 
        if (alive) setAll(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshTick]);

  // Upsert in-memory
  const upsertOne = useCallback((patch: Partial<Customer> & { id: number }) => {
    setAll((prev) => {
      const i = prev.findIndex((x) => x.id === patch.id);
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }, []);

  const filteredExceptCity = useMemo(() => {
    const v = (filters.q ?? "").trim().toLowerCase();
    return all.filter((c) => {
      if (
        v &&
        !(
          c.name.toLowerCase().includes(v) ||
          (c.tax_id ?? "").toLowerCase().includes(v) ||
          (c.email ?? "").toLowerCase().includes(v) ||
          (c.phone ?? "").toLowerCase().includes(v)
        )
      )
        return false;

      if (filters.pendingBalance === "yes" && !(c.balance > 0)) return false;
      if (filters.pendingBalance === "no" && !(c.balance <= 0)) return false;

      return true;
    });
  }, [all, filters.q, filters.pendingBalance]);

  const options = useMemo(() => {
    const cities = Array.from(
      new Set(filteredExceptCity.map((c) => c.city).filter(Boolean))
    )
      .map(String)
      .sort();
    return { cities };
  }, [filteredExceptCity]);

  const filtered = useMemo(() => {
    return filteredExceptCity.filter((c) => {
      if (filters.cities?.length && !filters.cities.includes(String(c.city))) return false;
      return true;
    });
  }, [filteredExceptCity, filters.cities]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);

  const items = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  return {
    loading,
    items,
    page: safePage,
    setPage,
    pageSize,
    total,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    filters,
    setFilters,
    options,
    reload,
    upsertOne,
  };
}
