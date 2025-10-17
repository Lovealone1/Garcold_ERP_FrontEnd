"use client";

import { useCallback, useState } from "react";
import { createPurchase } from "@/services/sales/purchase.api";
import { useNotifications } from "@/components/providers/NotificationsProvider";
import type { PurchaseCreate, Purchase } from "@/types/purchase";

type Options = {
  onSuccess?: (purchase: Purchase) => void;
  onError?: (e: unknown) => void;
};

export function useCreatePurchase(opts: Options = {}) {
  const { success, error: notifyError } = useNotifications();
  const [loading, setLoading] = useState(false);
  const [purchase, setPurchase] = useState<Purchase | null>(null);
  const [error, setError] = useState<unknown>(null);

  const mutate = useCallback(async (payload: PurchaseCreate) => {
    setLoading(true);
    setError(null);
    try {
      const p = await createPurchase(payload);
      setPurchase(p);
      success("Compra creada correctamente");
      opts.onSuccess?.(p);
      return p;
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? "No fue posible crear la compra";
      setError(e);
      notifyError(msg);
      opts.onError?.(e);
      throw e;
    } finally {
      setLoading(false);
    }
  }, [notifyError, success, opts]);

  const reset = useCallback(() => {
    setPurchase(null);
    setError(null);
    setLoading(false);
  }, []);

  return { create: mutate, loading, purchase, error, reset };
}

// compat
export function useCreateCompra(opts: Options = {}) {
  return useCreatePurchase(opts);
}
