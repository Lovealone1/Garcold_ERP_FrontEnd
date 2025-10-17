"use client";
import { useState } from "react";
import type { ExpenseCreate, Expense } from "@/types/expense";
import { createExpense } from "@/services/sales/expense.api";

export function useCreateExpense(onCreated?: (e: Expense) => void) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(payload: ExpenseCreate) {
    setLoading(true);
    setError(null);
    try {
      const res = await createExpense(payload);
      onCreated?.(res);
      return res;
    } catch (e: any) {
      setError(e?.message ?? "Failed to create expense");
      throw e;
    } finally {
      setLoading(false);
    }
  }

  return { create, loading, error };
}
