"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { soldProductsInRange } from "@/services/sales/product.api";
import type { SaleProductsDTO } from "@/types/product";

export type UseProductosVendidosParams = {
  date_from: string | Date;
  date_to: string | Date;
  product_ids: number[];
  enabled?: boolean;
  nocacheToken?: number;
};

type State = {
  data: SaleProductsDTO[] | null;
  loading: boolean;
  error: unknown;
  triggeredAt: Date | null;
};

export default function useProductosVendidos({
  date_from,
  date_to,
  product_ids,
  enabled = true,
  nocacheToken,
}: UseProductosVendidosParams) {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    error: null,
    triggeredAt: null,
  });

  const mountedRef = useRef(true);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => { mountedRef.current = false; abortRef.current?.abort(); }, []);

  // clave estable para deps
  const idsKey = useMemo(
    () => (product_ids && product_ids.length ? [...product_ids].sort((a,b)=>a-b).join(",") : ""),
    [product_ids]
  );

  const fire = useCallback(async () => {
    if (!product_ids?.length) {
      setState((s) => ({ ...s, data: [], loading: false, error: null, triggeredAt: new Date() }));
      return [];
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await soldProductsInRange(
        { date_from, date_to, product_ids },
        { nocacheToken: nocacheToken ?? Date.now(), signal: controller.signal }
      );
      if (!mountedRef.current || controller.signal.aborted) return [];
      setState({ data, loading: false, error: null, triggeredAt: new Date() });
      return data;
    } catch (err) {
      if (!mountedRef.current || (err as any)?.name === "CanceledError") return [];
      setState((s) => ({ ...s, loading: false, error: err }));
      return [];
    }
  }, [date_from, date_to, idsKey, nocacheToken, product_ids]);

  useEffect(() => {
    if (enabled) void fire();
  }, [enabled, fire]);

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    triggeredAt: state.triggeredAt,
    reload: fire,
  };
}
