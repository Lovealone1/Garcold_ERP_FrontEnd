"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fetchAllClientes } from "@/services/sales/clientes.api";
import type { Cliente } from "@/types/clientes";

type Filters = { q?: string; ciudades?: string[]; saldoPendiente?: "si" | "no" };

export function useClientes(pageSize = 10) {
  const [all, setAll] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<Filters>({ q: "" });

  const [refreshTick, setRefreshTick] = useState(0);
  const reload = () => setRefreshTick(t => t + 1);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const data = await fetchAllClientes(undefined, Date.now()); // cache-buster
        if (alive) setAll(data);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [refreshTick]);

  // 👇 NUEVO: actualiza en memoria un cliente existente
  function upsertOne(patch: Partial<Cliente> & { id: number }) {
    setAll(prev => {
      const i = prev.findIndex(x => x.id === patch.id);
      if (i === -1) return prev;
      const next = [...prev];
      next[i] = { ...next[i], ...patch };
      return next;
    });
  }

  // … (resto igual: filtros, options, paginado, reset page on filters)

  // 1) aplica filtros excepto ciudad
  const filteredExceptCity = useMemo(() => {
    const v = (filters.q ?? "").trim().toLowerCase();
    return all.filter(c => {
      if (v && !(
        c.nombre.toLowerCase().includes(v) ||
        c.cc_nit.toLowerCase().includes(v) ||
        (c.correo ?? "").toLowerCase().includes(v) ||
        (c.celular ?? "").toLowerCase().includes(v)
      )) return false;
      if (filters.saldoPendiente === "si" && !(c.saldo > 0)) return false;
      if (filters.saldoPendiente === "no" && !(c.saldo <= 0)) return false;
      return true;
    });
  }, [all, filters.q, filters.saldoPendiente]);

  const options = useMemo(() => {
    const ciudades = Array.from(new Set(filteredExceptCity.map(c => c.ciudad).filter(Boolean))).sort();
    return { ciudades };
  }, [filteredExceptCity]);

  const filtered = useMemo(() => {
    return filteredExceptCity.filter(c => {
      if (filters.ciudades?.length && !filters.ciudades.includes(c.ciudad)) return false;
      return true;
    });
  }, [filteredExceptCity, filters.ciudades]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const items = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);

  useEffect(() => { setPage(1); }, [filters]);

  return {
    loading,
    items,
    page: safePage, setPage,
    pageSize,
    total,
    totalPages,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    filters, setFilters,
    options,
    reload,
    upsertOne
  };
}
