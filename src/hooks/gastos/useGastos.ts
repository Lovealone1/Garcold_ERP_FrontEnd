"use client";
import { useEffect, useState } from "react";
import type { Gasto, GastosPage } from "@/types/expense";
import { listGastos } from "@/services/sales/gastos.api";

export function useGastos(page: number, params?: Record<string, any>) {
  const [data, setData] = useState<GastosPage | null>(null);
  const [items, setItems] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const refresh = () => setTick(t => t + 1);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await listGastos(page, params, Date.now());
        if (!alive) return;
        setData(res);
        setItems(res.items);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Error cargando gastos");
        setData(null);
        setItems([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [page, JSON.stringify(params ?? {}), tick]);

  return { data, items, loading, error, refresh };
}
