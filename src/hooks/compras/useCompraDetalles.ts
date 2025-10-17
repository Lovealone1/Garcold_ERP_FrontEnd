"use client";

import { useEffect, useMemo, useState } from "react";
import { listPurchaseItems } from "@/services/sales/purchase.api";
import type { PurchaseDetailItem } from "@/types/purchase";

type Options = { enabled?: boolean };

export function usePurchaseItems(purchaseId?: number, options?: Options) {
  const enabled = options?.enabled ?? true;

  const [items, setItems] = useState<PurchaseDetailItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const fetchData = async () => {
    if (!purchaseId || !enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listPurchaseItems(purchaseId, Date.now());
      setItems(data);
    } catch (e) {
      setItems([]);
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let alive = true;
    if (!purchaseId || !enabled) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    listPurchaseItems(purchaseId, Date.now())
      .then((data) => alive && setItems(data))
      .catch((e) => {
        if (!alive) return;
        setError(e);
        setItems([]);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [purchaseId, enabled]);

  const total = useMemo(() => items.reduce((s, d) => s + d.line_total, 0), [items]);

  return { items, total, loading, error, reload: fetchData };
}

export function useCompraDetalles(compraId?: number, options?: Options) {
  const { items, total, loading, error, reload } = usePurchaseItems(compraId, options);
  return { items, total, loading, error, reload };
}
