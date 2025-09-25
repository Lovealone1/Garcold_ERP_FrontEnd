"use client";

import { useEffect, useState, useCallback } from "react";
import { listVentas } from "@/services/sales/ventas.api";
import type { Venta, VentasPage } from "@/types/ventas";

type Filters = {
  q?: string;
  estado?: string;
  banco?: string;
  from?: string; 
  to?: string;   
};

export function useVentas(initialFilters: Filters = {}) {
  const [items, setItems] = useState<Venta[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [hasPrev, setHasPrev] = useState(false);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<Filters>(initialFilters);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    try {
      const data: VentasPage = await listVentas(page, filters, Date.now());
      setItems(data.items);
      setPageSize(data.page_size);
      setTotal(data.total);
      setTotalPages(data.total_pages);
      setHasPrev(data.has_prev);
      setHasNext(data.has_next);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => { fetchPage(); }, [fetchPage]);


  useEffect(() => { setPage(1); }, [filters]);

  return {
    items,
    page, setPage,
    pageSize,
    total,
    totalPages,
    hasPrev,
    hasNext,
    loading,
    reload: fetchPage,
    filters,
    setFilters,
  };
}
