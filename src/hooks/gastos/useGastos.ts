"use client";
import { useEffect, useState } from "react";
import type { ExpenseView, ExpensesPage } from "@/types/expense";
import { listExpenses } from "@/services/sales/expense.api";

export function useExpenses(page: number, params?: Record<string, any>) {
  const [data, setData] = useState<ExpensesPage | null>(null);
  const [items, setItems] = useState<ExpenseView[]>([]);
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
        const res = await listExpenses(page, params, Date.now());
        if (!alive) return;
        setData(res);
        setItems(res.items);
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? "Failed to load expenses");
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
