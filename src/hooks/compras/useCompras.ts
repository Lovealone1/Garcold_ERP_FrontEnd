"use client";

import { useEffect, useState, useCallback } from "react";
import { listPurchases } from "@/services/sales/purchase.api";
import type { Purchase, PurchasePage } from "@/types/purchase";

type Filters = {
  q?: string;
  status?: string;
  bank?: string;
  from?: string;
  to?: string;
};

export function usePurchases(initialFilters: Filters = {}) {
  const [items, setItems] = useState<Purchase[]>([]);
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
      const data: PurchasePage = await listPurchases(page, filters, Date.now());
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
